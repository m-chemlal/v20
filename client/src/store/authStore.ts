import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, AuthState } from '@/types/auth';
import { authAPI } from '@/services/api';

interface AuthStoreState extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  signup: (user: Omit<User, 'id' | 'createdAt' | 'avatar'>) => Promise<boolean>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthStoreState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          // Call backend API
          const response = await authAPI.login(email, password);
          
          // Get user info
          const userData = await authAPI.getMe();
          
          // Map backend user to frontend User type
          const user: User = {
            id: userData.id.toString(),
            email: userData.email,
            name: `${userData.prenom} ${userData.nom}`,
            role: userData.role,
            avatar: userData.photo_profil || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.email}`,
            createdAt: new Date(userData.date_creation),
          };

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          return true;
        } catch (error: any) {
          console.error('Login error:', error);
          let errorMessage = 'Une erreur est survenue lors de la connexion.';
          
          if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error') || !error.response) {
            errorMessage = 'Impossible de se connecter au serveur. Vérifiez que le backend est démarré sur http://localhost:8000';
          } else if (error.response?.data?.detail) {
            errorMessage = error.response.data.detail;
          } else if (error.response?.status === 401) {
            errorMessage = 'Email ou mot de passe incorrect.';
          } else if (error.response?.status === 423) {
            errorMessage = 'Compte verrouillé. Veuillez réessayer plus tard.';
          } else if (error.response?.status === 403) {
            errorMessage = 'Mot de passe expiré. Veuillez le réinitialiser.';
          }
          
          set({
            isLoading: false,
            error: errorMessage,
          });
          return false;
        }
      },

      loadUser: async () => {
        const token = localStorage.getItem('access_token');
        if (!token) {
          return;
        }

        try {
          const userData = await authAPI.getMe();
          const user: User = {
            id: userData.id.toString(),
            email: userData.email,
            name: `${userData.prenom} ${userData.nom}`,
            role: userData.role,
            avatar: userData.photo_profil || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.email}`,
            createdAt: new Date(userData.date_creation),
          };
          set({ user, isAuthenticated: true });
        } catch (error) {
          // Token invalid, clear it
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          set({ user: null, isAuthenticated: false });
        }
      },

      signup: async (newUser: Omit<User, 'id' | 'createdAt' | 'avatar'>) => {
        set({ isLoading: true, error: null });

        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 800));

        try {
          // Check if user already exists
          const userExists = mockUsers.find((u) => u.email === newUser.email);
          if (userExists) {
            set({
              isLoading: false,
              error: 'Cet email est déjà utilisé.',
            });
            return false;
          }

          // In a real app, the user would be created in the database.
          // Here, we just simulate success.
          const mockNewUser: User = {
            id: `new-${Date.now()}`,
            email: newUser.email,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            name: `${newUser.firstName} ${newUser.lastName}`,
            role: 'donateur', // Default role for new signups
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${newUser.firstName}`,
            createdAt: new Date(),
          };

          set({
            user: mockNewUser,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          return true;
        } catch (error) {
          set({
            isLoading: false,
            error: "Une erreur s'est produite lors de l'inscription. Veuillez réessayer.",
          });
          return false;
        }
      },

      logout: async () => {
        try {
          await authAPI.logout();
        } catch (error) {
          // Even if logout fails, clear local storage
        }
        set({
          user: null,
          isAuthenticated: false,
          error: null,
        });
      },

      setUser: (user: User | null) => {
        set({
          user,
          isAuthenticated: user !== null,
        });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

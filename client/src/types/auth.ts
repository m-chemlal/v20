export type UserRole = 'admin' | 'chef_projet' | 'donateur';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  role: UserRole;
  avatar?: string;
  createdAt: Date;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface PasswordStrengthResult {
  score: 'weak' | 'fair' | 'good' | 'strong';
  percentage: number;
  feedback: string[];
}

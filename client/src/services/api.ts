import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Log error for debugging
    if (!error.response) {
      console.error('Network error:', error.message);
      console.error('API URL:', API_URL);
    }
    
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });

          const { access_token, refresh_token } = response.data;
          localStorage.setItem('access_token', access_token);
          localStorage.setItem('refresh_token', refresh_token);

          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const { access_token, refresh_token } = response.data;
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('refresh_token', refresh_token);
    return response.data;
  },

  logout: async () => {
    await api.post('/auth/logout');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  refreshToken: async (refreshToken: string) => {
    const response = await api.post('/auth/refresh', {
      refresh_token: refreshToken,
    });
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return response.data;
  },

  forgotPassword: async (email: string) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token: string, newPassword: string) => {
    const response = await api.post('/auth/reset-password', {
      token,
      new_password: newPassword,
    });
    return response.data;
  },
};

// Users API
export const usersAPI = {
  getAll: async () => {
    const response = await api.get('/users');
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  create: async (userData: any) => {
    const response = await api.post('/users', userData);
    return response.data;
  },

  update: async (id: number, userData: any) => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },

  delete: async (id: number) => {
    await api.delete(`/users/${id}`);
  },
};

// Projects API
export const projectsAPI = {
  getAll: async (params?: { skip?: number; limit?: number }) => {
    const response = await api.get('/projects', { params });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  },

  create: async (projectData: any) => {
    const response = await api.post('/projects', projectData);
    return response.data;
  },

  update: async (id: number, projectData: any) => {
    const response = await api.put(`/projects/${id}`, projectData);
    return response.data;
  },

  delete: async (id: number) => {
    await api.delete(`/projects/${id}`);
  },
};

// Indicators API
export const indicatorsAPI = {
  getAll: async (params?: { skip?: number; limit?: number; projet_id?: number }) => {
    const response = await api.get('/indicators', { params });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`/indicators/${id}`);
    return response.data;
  },

  create: async (indicatorData: any) => {
    const response = await api.post('/indicators', indicatorData);
    return response.data;
  },

  update: async (id: number, indicatorData: any) => {
    const response = await api.put(`/indicators/${id}`, indicatorData);
    return response.data;
  },

  delete: async (id: number) => {
    await api.delete(`/indicators/${id}`);
  },
};

// Financements API
export const financementsAPI = {
  getAll: async (params?: { skip?: number; limit?: number; projet_id?: number }) => {
    const response = await api.get('/financements', { params });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`/financements/${id}`);
    return response.data;
  },

  create: async (financementData: any) => {
    const response = await api.post('/financements', financementData);
    return response.data;
  },

  update: async (id: number, financementData: any) => {
    const response = await api.put(`/financements/${id}`, financementData);
    return response.data;
  },

  delete: async (id: number) => {
    await api.delete(`/financements/${id}`);
  },
};

// Documents API
export const documentsAPI = {
  getAll: async (params?: { skip?: number; limit?: number; projet_id?: number }) => {
    const response = await api.get('/documents', { params });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`/documents/${id}`);
    return response.data;
  },

  upload: async (file: File, projetId: number, description?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (description) {
      formData.append('description', description);
    }
    const response = await api.post(`/documents?projet_id=${projetId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  download: async (id: number) => {
    const response = await api.get(`/documents/${id}/download`);
    return response.data;
  },

  delete: async (id: number) => {
    await api.delete(`/documents/${id}`);
  },
};

// Stats API
export const statsAPI = {
  getKPIs: async () => {
    const response = await api.get('/stats/kpis');
    return response.data;
  },

  exportPDF: async () => {
    const response = await api.get('/stats/export/pdf', {
      responseType: 'blob',
    });
    return response.data;
  },

  exportExcel: async () => {
    const response = await api.get('/stats/export/excel', {
      responseType: 'blob',
    });
    return response.data;
  },
};

export default api;


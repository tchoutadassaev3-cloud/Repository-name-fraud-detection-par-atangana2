import api from './api';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user?: {
    id: string;
    username: string;
    email?: string;
    role?: string;
  };
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const formData = new FormData();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    const response = await api.post<AuthResponse>('/auth/login', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    if (response.data.access_token) {
      localStorage.setItem('afg_token', response.data.access_token);
      const user = response.data.user || { id: '1', username: credentials.username, role: 'analyst' };
      localStorage.setItem('afg_user', JSON.stringify(user));
    }

    return response.data;
  },

  logout() {
    localStorage.removeItem('afg_token');
    localStorage.removeItem('afg_user');
  },

  getToken(): string | null {
    return localStorage.getItem('afg_token');
  },

  getUser() {
    const user = localStorage.getItem('afg_user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('afg_token');
  },
};

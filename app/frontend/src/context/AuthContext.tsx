import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService, LoginCredentials } from '../services/authService';

interface User {
  id: string;
  username: string;
  email?: string;
  role?: string;
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  loginDemo: (username?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = authService.getUser();
    const token = authService.getToken();
    if (storedUser && token) {
      setUser(storedUser);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const response = await authService.login(credentials);
    const user = response.user || { id: '1', username: credentials.username, role: 'Analyste SOC' };
    setUser(user);
  }, []);

  const loginDemo = useCallback((username = 'admin1') => {
    const demoUser: User = {
      id: 'local-001',
      username,
      email: `${username}@afgbank.ga`,
      role: 'Analyste SOC',
    };
    localStorage.setItem('afg_token', `local-token-${username}-afg-soc`);
    localStorage.setItem('afg_user', JSON.stringify(demoUser));
    setUser(demoUser);
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, loginDemo, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return ctx;
}

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthResponse } from '../types';
import { login as apiLogin, register as apiRegister, getProfile } from '../services/auth.service';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, fullName: string, phone?: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('access_token'));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const restoreUser = async () => {
      if (token) {
        try {
          const userData = await getProfile();
          setUser(userData);
        } catch {
          localStorage.removeItem('access_token');
          setToken(null);
        }
      }
      setLoading(false);
    };
    restoreUser();
  }, [token]);

  const loginHandler = async (username: string, password: string) => {
    const res: AuthResponse = await apiLogin({ username, password });
    localStorage.setItem('access_token', res.access_token);
    setToken(res.access_token);
    setUser(res.user);
  };

  const registerHandler = async (username: string, password: string, fullName: string, phone?: string) => {
    const res: AuthResponse = await apiRegister({ username, password, fullName, phone });
    localStorage.setItem('access_token', res.access_token);
    setToken(res.access_token);
    setUser(res.user);
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login: loginHandler,
        register: registerHandler,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

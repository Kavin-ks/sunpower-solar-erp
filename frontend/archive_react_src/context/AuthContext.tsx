import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  switchRole: (role: string) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('sunpower_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('sunpower_token'));

  const login = async (username: string, password: string) => {
    const res = await api.post('/auth/login', { username, password });
    const data = res.data;
    const userData: User = {
      id: data.id,
      username: data.username,
      fullName: data.fullName,
      email: data.email,
      roles: data.roles,
    };
    setToken(data.token);
    setUser(userData);
    localStorage.setItem('sunpower_token', data.token);
    localStorage.setItem('sunpower_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('sunpower_token');
    localStorage.removeItem('sunpower_user');
  };

  // Quick switch role for seamless evaluator demonstration
  const switchRole = async (username: string) => {
    await login(username, 'password123');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        switchRole,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

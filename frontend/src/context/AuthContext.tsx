import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserAccount, AuthResponse } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: UserAccount | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoginModalOpen: boolean;
  isCredentialsModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  openCredentialsModal: () => void;
  closeCredentialsModal: () => void;
  loginWithGmail: (email: string, password: string, fullName?: string) => Promise<AuthResponse>;
  loginWithOAuth: (provider: 'google' | 'github', email: string, fullName: string, avatarUrl?: string) => Promise<AuthResponse>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_USER_KEY = 'upi_fraud_user_session';
const STORAGE_TOKEN_KEY = 'upi_fraud_auth_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_TOKEN_KEY) || null;
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_USER_KEY);
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      localStorage.setItem(STORAGE_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(STORAGE_TOKEN_KEY);
    }
  }, [token]);

  const openLoginModal = () => setIsLoginModalOpen(true);
  const closeLoginModal = () => setIsLoginModalOpen(false);
  const openCredentialsModal = () => setIsCredentialsModalOpen(true);
  const closeCredentialsModal = () => setIsCredentialsModalOpen(false);

  const loginWithGmail = async (email: string, password: string, fullName?: string) => {
    const res = await api.loginWithGmail(email, password, fullName);
    setUser(res.user);
    setToken(res.token);
    closeLoginModal();
    return res;
  };

  const loginWithOAuth = async (provider: 'google' | 'github', email: string, fullName: string, avatarUrl?: string) => {
    const res = await api.loginWithOAuth(provider, email, fullName, avatarUrl);
    setUser(res.user);
    setToken(res.token);
    closeLoginModal();
    return res;
  };

  const logout = () => {
    api.logout().catch(() => {});
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoginModalOpen,
        isCredentialsModalOpen,
        openLoginModal,
        closeLoginModal,
        openCredentialsModal,
        closeCredentialsModal,
        loginWithGmail,
        loginWithOAuth,
        logout,
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

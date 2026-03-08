'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  getToken,
  setToken,
  removeToken,
  setRefreshToken,
  isAuthenticated,
  getUser,
  type TokenUser,
} from '@/lib/auth';
import api from '@/lib/api';
import type { User } from '@/types';

interface AuthContextValue {
  user: TokenUser | null;
  fullUser: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<TokenUser | null>(null);
  const [fullUser, setFullUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      setFullUser(data);
    } catch {
      // token might be expired; refresh interceptor will handle it
    }
  }, []);

  useEffect(() => {
    const authenticated = isAuthenticated();
    setIsLoggedIn(authenticated);
    const tokenUser = authenticated ? getUser() : null;
    setUser(tokenUser);
    if (authenticated) {
      fetchMe().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [fetchMe]);

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await api.post('/auth/login', { email, password });
      const { accessToken, refreshToken, user: apiUser } = response.data;
      setToken(accessToken);
      setRefreshToken(refreshToken);
      const currentUser = getUser();
      setUser(currentUser);
      setFullUser(apiUser);
      setIsLoggedIn(true);
      router.push('/');
    },
    [router],
  );

  const logout = useCallback(async () => {
    const token = getToken();
    if (token) {
      try {
        await api.post('/auth/logout');
      } catch {
        // ignore
      }
    }
    removeToken();
    setUser(null);
    setFullUser(null);
    setIsLoggedIn(false);
    router.push('/login');
  }, [router]);

  return (
    <AuthContext.Provider
      value={{ user, fullUser, isLoggedIn, isLoading, login, logout, refreshMe: fetchMe }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

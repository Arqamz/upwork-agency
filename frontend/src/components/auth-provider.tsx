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
  getActiveOrg,
  setActiveOrg,
  removeActiveOrg,
  type TokenUser,
} from '@/lib/auth';
import api from '@/lib/api';
import type { User } from '@/types';
import { OrgSwitchOverlay } from '@/components/org-switch-overlay';

interface AuthContextValue {
  user: TokenUser | null;
  fullUser: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  activeOrganizationId: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
  switchOrg: (organizationId: string, orgName?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<TokenUser | null>(null);
  const [fullUser, setFullUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeOrganizationId, setActiveOrganizationId] = useState<string | null>(null);

  // Org switch overlay state
  const [switchingOrg, setSwitchingOrg] = useState(false);
  const [switchingOrgName, setSwitchingOrgName] = useState('');

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

    // Restore active org from localStorage or token
    const storedOrg = getActiveOrg();
    if (storedOrg) {
      setActiveOrganizationId(storedOrg);
    } else if (tokenUser?.organizationId) {
      setActiveOrganizationId(tokenUser.organizationId);
      setActiveOrg(tokenUser.organizationId);
    }

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

      // Set active org from token or first membership
      if (currentUser?.organizationId) {
        setActiveOrganizationId(currentUser.organizationId);
        setActiveOrg(currentUser.organizationId);
      }

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
    removeActiveOrg();
    setUser(null);
    setFullUser(null);
    setIsLoggedIn(false);
    setActiveOrganizationId(null);
    router.push('/login');
  }, [router]);

  const switchOrg = useCallback(
    async (organizationId: string, orgName?: string) => {
      if (organizationId === activeOrganizationId) return;

      // Use the name passed from the caller (org-switcher already knows it)
      const name = orgName ?? 'Organization';

      // Show overlay
      setSwitchingOrgName(name);
      setSwitchingOrg(true);

      try {
        const { data } = await api.post('/auth/switch-org', { organizationId });
        setToken(data.accessToken);
        setRefreshToken(data.refreshToken);
        const currentUser = getUser();
        setUser(currentUser);
        setActiveOrganizationId(organizationId);
        setActiveOrg(organizationId);
      } finally {
        // Keep overlay visible for a beat after switch completes
        setTimeout(() => setSwitchingOrg(false), 900);
      }
    },
    [activeOrganizationId],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        fullUser,
        isLoggedIn,
        isLoading,
        activeOrganizationId,
        login,
        logout,
        refreshMe: fetchMe,
        switchOrg,
      }}
    >
      {children}
      <OrgSwitchOverlay visible={switchingOrg} orgName={switchingOrgName} />
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

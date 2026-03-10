const TOKEN_KEY = 'aop_token';
const REFRESH_TOKEN_KEY = 'aop_refresh_token';
const ACTIVE_ORG_KEY = 'aop_active_org';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setRefreshToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

export function isAuthenticated(): boolean {
  const token = getToken();
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const isExpired = payload.exp * 1000 < Date.now();
    return !isExpired;
  } catch {
    return false;
  }
}

export interface TokenUser {
  id: string;
  email: string;
  role: string;
  teamId?: string;
  organizationId?: string;
}

export function getUser(): TokenUser | null {
  const token = getToken();
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      id: payload.sub || payload.id,
      email: payload.email,
      role: payload.role,
      teamId: payload.teamId,
      organizationId: payload.organizationId,
    };
  } catch {
    return null;
  }
}

export function getActiveOrg(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACTIVE_ORG_KEY);
}

export function setActiveOrg(orgId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACTIVE_ORG_KEY, orgId);
}

export function removeActiveOrg(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ACTIVE_ORG_KEY);
}

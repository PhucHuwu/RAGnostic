export type AppRole = "ADMIN" | "USER";

export interface AuthUser {
  id: string;
  username: string;
  role: AppRole;
}

interface SessionPayload {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

const AUTH_SESSION_KEY = "ragnostic.auth.session";

function canUseStorage() {
  return typeof window !== "undefined";
}

export function getAuthSession(): SessionPayload | null {
  if (!canUseStorage()) {
    return null;
  }

  const raw = window.localStorage.getItem(AUTH_SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as SessionPayload;
  } catch {
    window.localStorage.removeItem(AUTH_SESSION_KEY);
    return null;
  }
}

export function setAuthSession(session: SessionPayload) {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
}

export function clearAuthSession() {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.removeItem(AUTH_SESSION_KEY);
}

export function updateAccessToken(accessToken: string, refreshToken: string) {
  const current = getAuthSession();
  if (!current) {
    return;
  }
  setAuthSession({ ...current, accessToken, refreshToken });
}

export function getAccessToken(): string | null {
  return getAuthSession()?.accessToken ?? null;
}

export function getRefreshToken(): string | null {
  return getAuthSession()?.refreshToken ?? null;
}

export function getCurrentUser(): AuthUser | null {
  return getAuthSession()?.user ?? null;
}

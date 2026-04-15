"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import { apiClient } from "@/lib/api/client";
import { tokenStore } from "@/lib/token-store";
import type { AuthUser } from "@/lib/types";

type AuthContextValue = {
  isReady: boolean;
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [isReady, setIsReady] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  const refreshUser = useCallback(async () => {
    const tokens = tokenStore.get();

    if (!tokens) {
      setUser(null);
      return;
    }

    try {
      const profile = await apiClient.me();
      setUser(profile);
    } catch {
      tokenStore.clear();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const run = async () => {
      await refreshUser();
      setIsReady(true);
    };

    void run();
  }, [refreshUser]);

  const login = useCallback(async (username: string, password: string) => {
    const result = await apiClient.login({ username, password });
    tokenStore.set(result.tokens);
    setUser(result.user);
    return result.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.logout();
    } catch {
      // noop
    } finally {
      tokenStore.clear();
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isReady,
      user,
      isAuthenticated: Boolean(user),
      login,
      logout,
      refreshUser
    }),
    [isReady, login, logout, refreshUser, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};

import type { AuthTokens } from "@/lib/types";

const ACCESS_TOKEN_KEY = "ragnostic_access_token";
const REFRESH_TOKEN_KEY = "ragnostic_refresh_token";

const isBrowser = () => typeof window !== "undefined";

export const tokenStore = {
  get(): AuthTokens | null {
    if (!isBrowser()) {
      return null;
    }

    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

    if (!accessToken || !refreshToken) {
      return null;
    }

    return { accessToken, refreshToken };
  },

  set(tokens: AuthTokens) {
    if (!isBrowser()) {
      return;
    }

    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  },

  clear() {
    if (!isBrowser()) {
      return;
    }

    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
};

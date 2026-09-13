import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  loginRequest,
  logoutAllRequest,
  logoutRequest,
  refreshRequest,
  registerRequest,
  registerRefreshHandler,
  type AuthUser,
} from './api';

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  refresh: () => Promise<boolean>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setSession = useCallback((nextUser: AuthUser, nextAccessToken: string) => {
    setUser(nextUser);
    setAccessToken(nextAccessToken);
  }, []);

  const clearSession = useCallback(() => {
    setUser(null);
    setAccessToken(null);
  }, []);

  const refreshAccessToken = useCallback(async () => {
    try {
      const response = await refreshRequest();
      setSession(response.user, response.accessToken);
      return response.accessToken;
    } catch {
      clearSession();
      return null;
    }
  }, [clearSession, setSession]);

  const refresh = useCallback(async () => Boolean(await refreshAccessToken()), [refreshAccessToken]);

  useEffect(() => {
    registerRefreshHandler(refreshAccessToken);
    return () => registerRefreshHandler(null);
  }, [refreshAccessToken]);

  useEffect(() => {
    void refresh().finally(() => setIsLoading(false));
  }, [refresh]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      isLoading,
      login: async (email, password) => {
        const response = await loginRequest(email, password);
        setSession(response.user, response.accessToken);
      },
      register: async (email, password) => {
        const response = await registerRequest(email, password);
        setSession(response.user, response.accessToken);
      },
      refresh,
      logout: async () => {
        await logoutRequest().catch(() => undefined);
        clearSession();
      },
      logoutAll: async () => {
        if (accessToken) {
          await logoutAllRequest(accessToken);
        }
        clearSession();
      },
    }),
    [accessToken, clearSession, isLoading, refresh, setSession, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth phải được dùng bên trong AuthProvider');
  }
  return context;
}

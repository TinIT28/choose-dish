import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { refreshAccessToken, setAccessToken, setRefreshHandler } from '../../lib/http';
import { loginRequest, logoutAllRequest, logoutRequest, refreshRequest, registerRequest, type PublicUser } from './api';

interface AuthContextValue {
  user: PublicUser | null;
  isSignedIn: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  refresh: () => Promise<boolean>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setSession = useCallback((nextUser: PublicUser, nextAccessToken: string) => {
    setAccessToken(nextAccessToken);
    setUser(nextUser);
  }, []);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setUser(null);
  }, []);

  // The HTTP module owns the single-flight, so a 401 retry and the restore on
  // boot share one refresh request.
  useEffect(() => {
    setRefreshHandler(async () => {
      try {
        const response = await refreshRequest();
        setSession(response.user, response.accessToken);
        return response.accessToken;
      } catch {
        clearSession();
        return null;
      }
    });
    return () => setRefreshHandler(null);
  }, [clearSession, setSession]);

  const refresh = useCallback(async () => Boolean(await refreshAccessToken()), []);

  useEffect(() => {
    void refresh().finally(() => setIsLoading(false));
  }, [refresh]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isSignedIn: user !== null,
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
        await logoutAllRequest().catch(() => undefined);
        clearSession();
      },
    }),
    [clearSession, isLoading, refresh, setSession, user],
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

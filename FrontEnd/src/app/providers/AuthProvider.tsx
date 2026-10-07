import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getSupabaseClient, usesMockApi } from '../../lib/supabase';
import { useSkyNudgeApi } from './useSkyNudgeApi';
import { AuthContext } from './authContext';

interface AuthProviderProps { children: ReactNode; }

export function AuthProvider({ children }: AuthProviderProps): JSX.Element {
  const api = useSkyNudgeApi();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const refreshAuth = useCallback(async (): Promise<void> => {
    try {
      if (usesMockApi) {
        setIsAuthenticated((await api.getMyProfile()) !== null);
      } else {
        const { data, error } = await getSupabaseClient().auth.getSession();
        if (error) throw error;
        setIsAuthenticated(data.session !== null);
      }
    } catch {
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  useEffect(() => {
    void refreshAuth();
    if (usesMockApi) return undefined;

    const { data } = getSupabaseClient().auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(session !== null);
      setIsLoading(false);
    });
    return () => data.subscription.unsubscribe();
  }, [refreshAuth]);

  const value = useMemo(() => ({ isAuthenticated, isLoading, refreshAuth }), [isAuthenticated, isLoading, refreshAuth]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
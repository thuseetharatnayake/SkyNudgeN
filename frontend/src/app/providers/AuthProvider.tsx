import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getSupabaseClient, usesMockApi } from '../../lib/supabase';
import { useSkyNudgeApi } from './useSkyNudgeApi';
import { AuthContext } from './authContext';

interface AuthProviderProps { children: ReactNode; }

export function AuthProvider({ children }: AuthProviderProps): JSX.Element {
  const api = useSkyNudgeApi();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const resolveAuth = useCallback(async (): Promise<boolean> => {
    try {
      if (usesMockApi) {
        return (await api.getMyProfile()) !== null;
      } else {
        const { data, error } = await getSupabaseClient().auth.getSession();
        if (error) throw error;
        return data.session !== null;
      }
    } catch {
      return false;
    }
  }, [api]);

  const refreshAuth = useCallback(async (): Promise<void> => {
    const authenticated = await resolveAuth();
    setIsAuthenticated(authenticated);
    setIsLoading(false);
  }, [resolveAuth]);

  useEffect(() => {
    let active = true;
    let initialResolutionExpired = false;
    const timeout = window.setTimeout(() => {
      if (!active) return;
      initialResolutionExpired = true;
      setIsAuthenticated(false);
      setIsLoading(false);
    }, 4_000);
    void resolveAuth().then((authenticated) => {
      if (!active || initialResolutionExpired) return;
      setIsAuthenticated(authenticated);
      setIsLoading(false);
    }).finally(() => window.clearTimeout(timeout));
    if (usesMockApi) return () => { active = false; window.clearTimeout(timeout); };

    const { data } = getSupabaseClient().auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setIsAuthenticated(session !== null);
      setIsLoading(false);
    });
    return () => { active = false; window.clearTimeout(timeout); data.subscription.unsubscribe(); };
  }, [resolveAuth]);

  const value = useMemo(() => ({ isAuthenticated, isLoading, refreshAuth }), [isAuthenticated, isLoading, refreshAuth]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
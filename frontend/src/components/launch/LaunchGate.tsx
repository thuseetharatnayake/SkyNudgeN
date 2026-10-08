import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../app/providers/useAuth';
import { LaunchContext } from './launchContext';

const LaunchScreen = lazy(async () => ({ default: (await import('./LaunchScreen')).LaunchScreen }));
const standardMinimumMs = 1_900;
const reducedMotionMinimumMs = 900;
const fadeMs = 550;

function prefersReducedMotion(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

interface LaunchGateProps { children: ReactNode; }

export function LaunchGate({ children }: LaunchGateProps): JSX.Element {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [minimumElapsed, setMinimumElapsed] = useState(false);
  const [skipRequested, setSkipRequested] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const reducedMotion = prefersReducedMotion();

  useEffect(() => {
    const timer = window.setTimeout(() => setMinimumElapsed(true), reducedMotion ? reducedMotionMinimumMs : standardMinimumMs);
    return () => window.clearTimeout(timer);
  }, [reducedMotion]);

  useEffect(() => {
    if (isLoading || isLeaving || isComplete || (!minimumElapsed && !skipRequested)) return;
    if (isAuthenticated) navigate('/home', { replace: true });
    setIsLeaving(true);
  }, [isAuthenticated, isComplete, isLeaving, isLoading, minimumElapsed, navigate, skipRequested]);

  useEffect(() => {
    if (!isLeaving) return undefined;
    const timer = window.setTimeout(() => setIsComplete(true), fadeMs);
    return () => window.clearTimeout(timer);
  }, [isLeaving]);

  return <LaunchContext.Provider value={isComplete}>
    {children}
    {!isComplete ? <Suspense fallback={null}><LaunchScreen isLeaving={isLeaving} onSkip={() => setSkipRequested(true)} /></Suspense> : null}
  </LaunchContext.Provider>;
}
import type { ReactNode } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { BottomNav } from '../components/layout/BottomNav';
import { TopBar } from '../components/layout/TopBar';
import { useAuth } from './providers/useAuth';
import {
  AccountPage,
  ActiveMomentPage,
  CreateAccountPage,
  HomePage,
  LoginPage,
  MomentsCalendarPage,
  MomentsFeedPage,
  NudgeStepOnePage,
  NudgeStepTwoPage,
  NudgeSuccessPage,
  SelectedDayPage,
  SettingsPage,
  VerificationFormPage,
  VerificationIntroPage,
  VerificationStatusPage,
  WelcomePage,
} from '../pages/PlaceholderPages';

const mainRoutes = ['/', '/home', '/moments', '/moments/calendar', '/moments/day', '/account', '/settings'];

interface RouteGuardProps { children: ReactNode; }
function RouteLoading(): JSX.Element { return <div className="screen-page screen-page--centered"><p className="page-copy">Restoring your session…</p></div>; }
function NotFoundPage(): JSX.Element { return <div className="route-placeholder"><TopBar backTo="/home" /><div className="screen-page screen-page--centered"><div className="page-stack"><div><p className="page-eyebrow">Not found</p><h1 className="page-title">This sky view is unavailable.</h1><p className="page-copy">The page you asked for could not be found.</p></div></div></div></div>; }
function RequireAuth({ children }: RouteGuardProps): JSX.Element {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <RouteLoading />;
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}
function PublicOnly({ children }: RouteGuardProps): JSX.Element {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const isCreateFlowReturn = location.pathname === '/create-account' && (location.state as { flow?: string } | null)?.flow === 'create-return';
  if (isLoading) return <RouteLoading />;
  return isAuthenticated && !isCreateFlowReturn ? <Navigate to="/home" replace /> : <>{children}</>;
}

export function AppRoutes(): JSX.Element {
  const location = useLocation();
  const showBottomNav = mainRoutes.some((route) => location.pathname === route || location.pathname.startsWith(`${route}/`));
  return <div className="app-shell"><main className="app-shell__content"><Routes>
    <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />
    <Route path="/create-account" element={<PublicOnly><CreateAccountPage /></PublicOnly>} />
    <Route path="/verification" element={<RequireAuth><VerificationIntroPage /></RequireAuth>} />
    <Route path="/verification/form" element={<RequireAuth><VerificationFormPage /></RequireAuth>} />
    <Route path="/verification/pending" element={<RequireAuth><VerificationStatusPage /></RequireAuth>} />
    <Route path="/welcome" element={<RequireAuth><WelcomePage /></RequireAuth>} />
    <Route path="/" element={<RequireAuth><HomePage /></RequireAuth>} />
    <Route path="/home" element={<RequireAuth><HomePage /></RequireAuth>} />
    <Route path="/nudge/:nudgeId" element={<RequireAuth><ActiveMomentPage /></RequireAuth>} />
    <Route path="/nudge/new" element={<RequireAuth><NudgeStepOnePage /></RequireAuth>} />
    <Route path="/nudge/new/details" element={<RequireAuth><NudgeStepTwoPage /></RequireAuth>} />
    <Route path="/nudge/success" element={<RequireAuth><NudgeSuccessPage /></RequireAuth>} />
    <Route path="/moments" element={<RequireAuth><MomentsFeedPage /></RequireAuth>} />
    <Route path="/moments/calendar" element={<RequireAuth><MomentsCalendarPage /></RequireAuth>} />
    <Route path="/moments/day/:date" element={<RequireAuth><SelectedDayPage /></RequireAuth>} />
    <Route path="/account" element={<RequireAuth><AccountPage /></RequireAuth>} />
    <Route path="/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />
    <Route path="*" element={<RequireAuth><NotFoundPage /></RequireAuth>} />
  </Routes></main>{showBottomNav ? <BottomNav /> : null}</div>;
}
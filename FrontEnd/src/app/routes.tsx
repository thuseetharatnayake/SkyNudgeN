import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { BottomNav } from '../components/layout/BottomNav';
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
  WelcomePage,
} from '../pages/PlaceholderPages';

const mainRoutes = ['/home', '/moments', '/moments/calendar', '/moments/day', '/account', '/settings'];

export function AppRoutes(): JSX.Element {
  const location = useLocation();
  const showBottomNav = mainRoutes.some((route) => location.pathname === route || location.pathname.startsWith(`${route}/`));
  return <div className="app-shell"><main className="app-shell__content"><Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/create-account" element={<CreateAccountPage />} />
    <Route path="/verification" element={<VerificationIntroPage />} />
    <Route path="/verification/form" element={<VerificationFormPage />} />
    <Route path="/welcome" element={<WelcomePage />} />
    <Route path="/home" element={<HomePage />} />
    <Route path="/nudge/:nudgeId" element={<ActiveMomentPage />} />
    <Route path="/nudge/new" element={<NudgeStepOnePage />} />
    <Route path="/nudge/new/details" element={<NudgeStepTwoPage />} />
    <Route path="/nudge/success" element={<NudgeSuccessPage />} />
    <Route path="/moments" element={<MomentsFeedPage />} />
    <Route path="/moments/calendar" element={<MomentsCalendarPage />} />
    <Route path="/moments/day/:date" element={<SelectedDayPage />} />
    <Route path="/account" element={<AccountPage />} />
    <Route path="/settings" element={<SettingsPage />} />
    <Route path="*" element={<Navigate to="/login" replace />} />
  </Routes></main>{showBottomNav ? <BottomNav /> : null}</div>;
}
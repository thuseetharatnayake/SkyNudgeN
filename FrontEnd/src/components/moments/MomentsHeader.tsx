import { Link, useLocation } from 'react-router-dom';
import { SkyIcon } from '../ui/SkyIcon';

export function MomentsHeader(): JSX.Element {
  const { pathname } = useLocation();
  const isCalendar = pathname === '/moments/calendar';
  return <header className="moments-header">
    <div className="moments-header__title"><h1>My Sky Moments</h1><p><SkyIcon name="lock" size={15} strokeWidth={1.8} />Private. Only you can see these.</p></div>
    <nav className="moments-tabs" aria-label="My Sky Moments views" role="tablist">
      <Link to="/moments" role="tab" aria-selected={!isCalendar}>Feed</Link>
      <Link to="/moments/calendar" role="tab" aria-selected={isCalendar}>Calendar</Link>
    </nav>
  </header>;
}

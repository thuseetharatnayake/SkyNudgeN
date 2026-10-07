import { NavLink } from 'react-router-dom';
import { SkyIcon } from '../ui/SkyIcon';

const items = [{ to: '/home', label: 'Home', icon: 'home' as const }, { to: '/moments', label: 'My Sky Moments', icon: 'archive' as const }, { to: '/account', label: 'Account', icon: 'account' as const }];
export function BottomNav(): JSX.Element { return <nav className="bottom-nav" aria-label="Main navigation">{items.map((item) => <NavLink key={item.to} to={item.to} className={({ isActive }) => `bottom-nav__item${isActive ? ' bottom-nav__item--active' : ''}`}><SkyIcon name={item.icon} size={21} /><span>{item.label}</span></NavLink>)}</nav>; }
import type { Category } from '../../types/sky';

type IconName = Category | 'home' | 'archive' | 'account' | 'arrow' | 'check' | 'lock' | 'shield' | 'location' | 'clock' | 'camera' | 'chevron-left' | 'chevron-right' | 'more';

interface SkyIconProps { name: IconName; size?: number; strokeWidth?: number; title?: string; }

export function SkyIcon({ name, size = 24, strokeWidth = 1.8, title }: SkyIconProps): JSX.Element {
  const shared = { fill: 'none', stroke: 'currentColor', strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  let paths: JSX.Element;
  switch (name) {
    case 'sunset': paths = <><path {...shared} d="M3 18h18M5 14a7 7 0 0 1 14 0M12 3v3M5.6 6.6l2.1 2.1M18.4 6.6l-2.1 2.1" /><path {...shared} d="M12 11v3" /></>; break;
    case 'sunrise': paths = <><path {...shared} d="M3 18h18M5 14a7 7 0 0 1 14 0M12 3v3M5.6 6.6l2.1 2.1M18.4 6.6l-2.1 2.1" /><path {...shared} d="m9 12 3-3 3 3M12 9v7" /></>; break;
    case 'rainbow': paths = <><path {...shared} d="M3 17a9 9 0 0 1 18 0M6 17a6 6 0 0 1 12 0M9 17a3 3 0 0 1 6 0" /></>; break;
    case 'clouds': paths = <path {...shared} d="M7 18h10a4 4 0 0 0 .4-8 5.5 5.5 0 0 0-10.6 1.7A3.2 3.2 0 0 0 7 18Z" />; break;
    case 'moon': paths = <path {...shared} d="M19.2 15.4A7.5 7.5 0 0 1 8.6 4.8 7.5 7.5 0 1 0 19.2 15.4Z" />; break;
    case 'other': paths = <path {...shared} d="m12 3 1.8 7.2L21 12l-7.2 1.8L12 21l-1.8-7.2L3 12l7.2-1.8L12 3Z" />; break;
    case 'home': paths = <><path {...shared} d="m3 10 9-7 9 7" /><path {...shared} d="M5 9v11h14V9M9 20v-6h6v6" /></>; break;
    case 'archive': paths = <><path {...shared} d="M4 7h16v13H4zM3 4h18v3H3z" /><path {...shared} d="M9 11h6" /></>; break;
    case 'account': paths = <><circle {...shared} cx="12" cy="8" r="3.5" /><path {...shared} d="M4.5 20a7.5 7.5 0 0 1 15 0" /></>; break;
    case 'arrow': paths = <><path {...shared} d="M12 20V4" /><path {...shared} d="m6 10 6-6 6 6" /></>; break;
    case 'check': paths = <path {...shared} d="m5 12 4.2 4.2L19 6.5" />; break;
    case 'lock': paths = <><rect {...shared} x="5" y="10" width="14" height="10" rx="2" /><path {...shared} d="M8 10V7a4 4 0 0 1 8 0v3" /></>; break;
    case 'shield': paths = <path {...shared} d="M12 3 19 6v5c0 4.4-2.8 7.8-7 10-4.2-2.2-7-5.6-7-10V6l7-3Z" />; break;
    case 'location': paths = <><path {...shared} d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle {...shared} cx="12" cy="10" r="2.5" /></>; break;
    case 'clock': paths = <><circle {...shared} cx="12" cy="12" r="8.5" /><path {...shared} d="M12 7v5l3.5 2" /></>; break;
    case 'camera': paths = <><path {...shared} d="M4 8h3l1.5-2h7L17 8h3v11H4z" /><circle {...shared} cx="12" cy="13" r="3.5" /></>; break;
    case 'chevron-left': paths = <path {...shared} d="m14 6-6 6 6 6" />; break;
    case 'chevron-right': paths = <path {...shared} d="m10 6 6 6-6 6" />; break;
    case 'more': paths = <><circle cx="5" cy="12" r="1.3" fill="currentColor" /><circle cx="12" cy="12" r="1.3" fill="currentColor" /><circle cx="19" cy="12" r="1.3" fill="currentColor" /></>; break;
  }
  return <svg aria-hidden={title ? undefined : true} aria-label={title} width={size} height={size} viewBox="0 0 24 24" focusable="false">{title ? <title>{title}</title> : null}{paths}</svg>;
}
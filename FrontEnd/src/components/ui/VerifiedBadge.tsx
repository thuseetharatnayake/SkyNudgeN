import { SkyIcon } from './SkyIcon';

export function VerifiedBadge(): JSX.Element { return <span className="verified-badge" aria-label="Identity verified"><SkyIcon name="check" size={12} strokeWidth={3} /></span>; }
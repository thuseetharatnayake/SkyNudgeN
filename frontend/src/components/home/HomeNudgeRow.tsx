import { distanceKm, relativeNudgeTime } from '../../lib/homeNudges';
import type { Coordinates, Nudge } from '../../types/sky';
import { SkyIcon } from '../ui/SkyIcon';

interface HomeNudgeRowProps { nudge: Nudge; location: Coordinates; onClick: () => void; }

const titleFor = (nudge: Nudge): string => nudge.category.charAt(0).toUpperCase() + nudge.category.slice(1);
const intensityLabel: Record<Nudge['intensity'], string> = { look_now: 'Look now', wow: 'Wow', beautiful: 'Beautiful' };

export function HomeNudgeRow({ nudge, location, onClick }: HomeNudgeRowProps): JSX.Element {
  const relativeTime = relativeNudgeTime(nudge.created_at) ?? '30 min ago';
  const distance = distanceKm(location, nudge.coordinates).toFixed(1);
  return <button type="button" className="home-nudge-row" onClick={onClick} aria-label={`${titleFor(nudge)}. Look ${nudge.direction}, ${distance} kilometres away, ${relativeTime}, ${nudge.watcher_count} watching.`}>
    <span className="home-nudge-row__tile"><SkyIcon name={nudge.category} size={24} /></span>
    <span className="home-nudge-row__content"><strong>{titleFor(nudge)}</strong><small>Look {nudge.direction} · {distance} km · {relativeTime}</small></span>
    <span className="home-nudge-row__side"><span className={`home-pill home-pill--${nudge.intensity}`}>{intensityLabel[nudge.intensity]}</span><small>{nudge.watcher_count} watching</small></span>
  </button>;
}
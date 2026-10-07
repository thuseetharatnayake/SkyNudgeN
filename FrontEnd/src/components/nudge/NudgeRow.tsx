import type { Nudge } from '../../types/sky';
import { SkyIcon } from '../ui/SkyIcon';

interface NudgeRowProps { nudge: Nudge; onClick?: () => void; }
export function NudgeRow({ nudge, onClick }: NudgeRowProps): JSX.Element { const content = <><span className="nudge-row__icon"><SkyIcon name={nudge.category} size={24} /></span><span className="nudge-row__content"><strong>{nudge.category}</strong><small>Look {nudge.direction} · {nudge.watcher_count} watching</small></span></>; return onClick ? <button type="button" className="nudge-row" onClick={onClick}>{content}</button> : <div className="nudge-row">{content}</div>; }
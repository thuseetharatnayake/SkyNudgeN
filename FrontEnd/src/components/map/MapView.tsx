import type { Nudge } from '../../types/sky';

interface MapViewProps { nudges: Nudge[]; onNudgeClick?: (id: string) => void; }
export function MapView({ nudges, onNudgeClick }: MapViewProps): JSX.Element { return <section className="map-placeholder" aria-label="Map of active SkyNudges near you"><strong>Map foundation</strong><p>{nudges.length} active SkyNudges will appear here in Phase 3.</p>{onNudgeClick ? <button type="button" onClick={() => onNudgeClick(nudges[0]?.id ?? '')} disabled={nudges.length === 0}>Preview nearby nudge</button> : null}</section>; }
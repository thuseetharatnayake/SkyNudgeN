import type { Direction } from '../../types/sky';
import { SkyIcon } from './SkyIcon';

const rotations: Record<Direction, number> = { north: 0, east: 90, south: 180, west: 270, above: 0 };
interface CompassProps { direction: Direction; distanceKm?: number; }
export function Compass({ direction, distanceKm }: CompassProps): JSX.Element { const label = direction === 'above' ? 'Look above' : `Look ${direction}`; return <section className="compass" aria-label={`${label}${distanceKm ? `, approximately ${distanceKm} kilometres away` : ''}`}><div className="compass__circle"><span>N</span><span>E</span><span>S</span><span>W</span><i className="compass__arrow" style={{ transform: `translate(-50%, -50%) rotate(${rotations[direction]}deg)` }}><SkyIcon name="arrow" size={42} /></i></div><strong>{label}</strong>{distanceKm ? <small>About {distanceKm.toFixed(1)} km away</small> : null}</section>; }
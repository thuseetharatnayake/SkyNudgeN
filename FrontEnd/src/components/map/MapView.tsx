import { divIcon } from 'leaflet';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import { renderToStaticMarkup } from 'react-dom/server';
import 'leaflet/dist/leaflet.css';
import type { Coordinates, Nudge } from '../../types/sky';
import { SkyIcon } from '../ui/SkyIcon';

interface MapViewProps { nudges: Nudge[]; userLocation: Coordinates; currentUserId?: string; onNudgeClick: (id: string) => void; }
interface MapPinContentProps { nudge: Nudge; isMine: boolean; }

export function MapPinContent({ nudge, isMine }: MapPinContentProps): JSX.Element {
  const title = nudge.category.charAt(0).toUpperCase() + nudge.category.slice(1);
  return <span className={`map-pin${nudge.intensity === 'look_now' ? ' map-pin--hot' : ''}${isMine ? ' map-pin--mine' : ''}`} role="button" aria-label={`${title}, ${nudge.watcher_count} can see it`} tabIndex={0}><SkyIcon name={nudge.category} size={20} /><span className="map-pin__badge">{nudge.watcher_count}</span></span>;
}

function nudgeIcon(nudge: Nudge, isMine: boolean) { return divIcon({ className: 'map-marker-shell', html: renderToStaticMarkup(<MapPinContent nudge={nudge} isMine={isMine} />), iconSize: [40, 40], iconAnchor: [20, 20] }); }
function userIcon() { return divIcon({ className: 'map-marker-shell', html: '<span class="map-you" aria-label="You"><i></i><b>You</b></span>', iconSize: [44, 44], iconAnchor: [22, 22] }); }

function MapBase(): JSX.Element { return <svg className="map-base" viewBox="0 0 390 270" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="390" height="270" fill="var(--color-very-light-blue)" /><g stroke="var(--color-white)" strokeWidth="2.4" fill="none" strokeLinecap="round"><path d="M0 58 390 30M0 108 390 84M0 160 390 140M0 214 390 196" /><path d="M58 0 90 270M128 0 163 270M198 0 234 270M268 0 304 270M338 0 368 270" /></g><path d="M390 120C330 104 300 142 250 118 210 100 190 126 150 110 120 100 100 92 70 100" stroke="var(--color-pale-blue)" strokeWidth="7" fill="none" strokeLinecap="round" /><path d="M0 140C40 150 70 178 98 205 120 226 150 238 188 252 205 258 215 264 222 270L0 270Z" fill="var(--color-pale-blue)" /><text x="18" y="250" fontFamily="var(--font-serif)" fontStyle="italic" fontSize="12" fill="var(--color-text-muted)">Port Phillip Bay</text></svg>; }

export function MapView({ nudges, userLocation, currentUserId, onNudgeClick }: MapViewProps): JSX.Element {
  return <section className="nearby-map" role="group" aria-label="Map of active SkyNudges near you"><MapBase /><MapContainer center={[userLocation.lat, userLocation.lng]} zoom={13} zoomControl={false} attributionControl={false} className="nearby-map__leaflet"><TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /><Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon()} interactive={false} />{nudges.map((nudge) => <Marker key={nudge.id} position={[nudge.coordinates.lat, nudge.coordinates.lng]} icon={nudgeIcon(nudge, nudge.poster.id === currentUserId)} eventHandlers={{ click: () => onNudgeClick(nudge.id) }} />)}</MapContainer></section>;
}
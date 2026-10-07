import type { Coordinates, Nudge, SkyUser } from '../../types/sky';
import { MapView } from '../map/MapView';
import { SkyIcon } from '../ui/SkyIcon';
import { VerifiedBadge } from '../ui/VerifiedBadge';
import { HomeNudgeRow } from './HomeNudgeRow';

interface HomeScreenProps {
  nudges: Nudge[];
  profile: SkyUser | null;
  location: Coordinates;
  hasLocation: boolean;
  isLoading: boolean;
  error: string;
  onAccount: () => void;
  onCreate: () => void;
  onOpenNudge: (id: string) => void;
  onEnableLocation: () => void;
  onRetry: () => void;
}

export function HomeScreen({ nudges, profile, location, hasLocation, isLoading, error, onAccount, onCreate, onOpenNudge, onEnableLocation, onRetry }: HomeScreenProps): JSX.Element {
  const city = 'Melbourne';
  return <div className="home-page">
    <header className="home-topbar"><div className="home-brand"><SkyIcon name="other" size={22} strokeWidth={2} /><span>SkyNudge</span></div><button className="home-user-chip" type="button" onClick={onAccount} aria-label="Account">{profile?.username ?? 'Account'}{profile?.verification_status === 'verified' ? <VerifiedBadge /> : null}</button></header>
    <main className="home-content">
      <p className="home-location"><SkyIcon name="location" size={16} strokeWidth={1.8} />{hasLocation ? `Near ${city} · approximate area` : <><span>Location off · tap to enable</span><button type="button" onClick={onEnableLocation}>Enable</button></>}</p>
      <section className="home-intro"><p className="home-eyebrow"><i />RIGHT NOW IN {city}</p><h1>Something beautiful is happening.</h1><p>Tap a glow. Then put your phone down and look up.</p></section>
      <div className="home-map-wrap">{isLoading ? <div className="home-map-skeleton" aria-label="Loading nearby SkyNudges" /> : <MapView nudges={nudges} userLocation={location} currentUserId={profile?.id} onNudgeClick={onOpenNudge} />}</div>
      <button className="home-nudge-button" type="button" onClick={onCreate}>Nudge the Sky</button>
      <div className="home-section-head"><h2>Currently Near You</h2><span>{nudges.length} active</span></div>
      {error ? <section className="home-error" role="alert"><p>{error}</p><button type="button" onClick={onRetry}>Retry</button></section> : null}
      {isLoading ? <div className="home-list-skeleton" aria-label="Loading nearby SkyNudges"><i /><i /><i /></div> : null}
      {!isLoading && !error && nudges.length === 0 ? <p className="home-empty">No SkyNudges nearby right now. Be the first to share what you see.</p> : null}
      {!isLoading && !error && nudges.length > 0 ? <section className="home-rows" aria-label="Currently nearby SkyNudges">{nudges.map((nudge) => <HomeNudgeRow key={nudge.id} nudge={nudge} location={location} onClick={() => onOpenNudge(nudge.id)} />)}</section> : null}
      <p className="home-footer-note">SkyNudges disappear after about 30 minutes.</p>
    </main>
  </div>;
}
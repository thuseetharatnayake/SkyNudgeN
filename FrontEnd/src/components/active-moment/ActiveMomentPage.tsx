import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSkyNudgeApi } from '../../app/providers/useSkyNudgeApi';
import type { Direction, Nudge } from '../../types/sky';
import { SkyIcon } from '../ui/SkyIcon';
import { VerifiedBadge } from '../ui/VerifiedBadge';
import { TopBar } from '../layout/TopBar';
import { clampMinutes, expiryMinutes, peopleText, progressPercent } from './activeMomentHelpers';

const rotations: Record<Direction, number> = { north: 0, east: 90, south: 180, west: 270, above: 0 };

function categoryTitle(category: string): string { return category.charAt(0).toUpperCase() + category.slice(1); }
function lookText(direction: Direction): string { return `Look ${direction}`; }
function remainingMinutes(nudge: Nudge, now: number): number {
  const expiresAt = nudge.expires_at ? Date.parse(nudge.expires_at) : Date.parse(nudge.created_at) + expiryMinutes * 60_000;
  return clampMinutes(Math.ceil((expiresAt - now) / 60_000));
}
function relativeTime(createdAt: string, now: number): string {
  const minutes = Math.max(0, Math.floor((now - Date.parse(createdAt)) / 60_000));
  return minutes === 0 ? 'just now' : `${minutes} min ago`;
}
function locationCopy(nudge: Nudge): string {
  const distance = nudge.distance_km ?? 0;
  return `Roughly ${distance.toFixed(1)} km from you, around ${nudge.place_name ?? nudge.landmark ?? 'your area'}.`;
}
function userName(nudge: Nudge): string { return nudge.username ?? nudge.poster.username; }
function isVerified(nudge: Nudge): boolean { return nudge.verified ?? nudge.poster.verification_status === 'verified'; }

function CompassPanel({ nudge }: { nudge: Nudge }): JSX.Element {
  const isAbove = nudge.direction === 'above';
  return <section className="active-moment__hero-panel">
    <svg className="active-moment__compass" width="96" height="96" viewBox="0 0 96 96" role="img" aria-label={lookText(nudge.direction)}>
      <circle cx="48" cy="48" r="44" fill="white" stroke="var(--color-border)" strokeWidth="1.5" />
      {isAbove ? <path d="M48 68V28M34 42l14-14 14 14" stroke="var(--color-primary)" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" /> : <>
        <text x="48" y="17" textAnchor="middle">N</text><text x="81" y="52" textAnchor="middle">E</text><text x="48" y="87" textAnchor="middle">S</text><text x="15" y="52" textAnchor="middle">W</text>
        <g transform={`rotate(${rotations[nudge.direction]} 48 48)`}><path d="M48 22L55 54L48 49L41 54Z" fill="var(--color-primary)" /></g><circle cx="48" cy="48" r="3" fill="white" stroke="var(--color-primary)" strokeWidth="1.5" />
      </>}
    </svg>
    <div className="active-moment__hero-copy"><p>{lookText(nudge.direction)}</p><small>{locationCopy(nudge)}</small></div>
  </section>;
}

function IntensityPill({ intensity }: { intensity: Nudge['intensity'] }): JSX.Element {
  const labels = { look_now: 'Look now', wow: 'Wow', beautiful: 'Beautiful' };
  return <span className={`active-moment__pill active-moment__pill--${intensity}`}>{labels[intensity]}</span>;
}

type Sheet = 'closed' | 'menu' | 'report' | 'block';

interface ActiveMomentContentProps {
  nudge: Nudge;
  currentUserId: string | null;
  onCreate: () => void;
  onConfirm: (nudge: Nudge) => Promise<void>;
  onReport: (reason: string) => Promise<void>;
  onBlock: () => Promise<void>;
}

export function ActiveMomentContent({ nudge, currentUserId, onCreate, onConfirm, onReport, onBlock }: ActiveMomentContentProps): JSX.Element {
  const [now, setNow] = useState(Date.now());
  const [imageFailed, setImageFailed] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [sheet, setSheet] = useState<Sheet>('closed');
  const [reason, setReason] = useState('Inappropriate or unsafe content');
  const [isSafetyWorking, setIsSafetyWorking] = useState(false);
  const [error, setError] = useState('');
  const ownNudge = currentUserId === nudge.poster.id;
  const minutes = remainingMinutes(nudge, now);
  const ended = minutes === 0;
  const confirmed = nudge.i_can_see_it ?? nudge.confirmed_by_me;

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  async function confirm(): Promise<void> {
    if (ended || confirmed || isConfirming) return;
    setError('');
    setIsConfirming(true);
    try { await onConfirm(nudge); } catch (caughtError) { setError(caughtError instanceof Error ? caughtError.message : 'Unable to confirm your sighting. Please try again.'); } finally { setIsConfirming(false); }
  }
  async function completeSafetyAction(): Promise<void> {
    setError('');
    setIsSafetyWorking(true);
    try {
      if (sheet === 'report') await onReport(reason);
      if (sheet === 'block') await onBlock();
      setSheet('closed');
    } catch (caughtError) { setError(caughtError instanceof Error ? caughtError.message : 'Something went wrong. Please try again.'); } finally { setIsSafetyWorking(false); }
  }

  return <div className="active-moment">
    <TopBar backTo="/moments" right={<div className="active-moment__topbar-actions"><IntensityPill intensity={nudge.intensity} />{!ownNudge ? <button className="active-moment__icon-button" type="button" onClick={() => setSheet('menu')} aria-label="More SkyNudge actions"><SkyIcon name="more" /></button> : null}</div>} />
    <main className="active-moment__body">
      <section className="active-moment__heading"><h1>{categoryTitle(nudge.category)}</h1><p><span>{userName(nudge)}</span>{isVerified(nudge) ? <VerifiedBadge /> : null}<span> · {relativeTime(nudge.created_at, now)}</span></p></section>
      {nudge.photo_url && !imageFailed ? <section className="active-moment__photo-group"><div className="active-moment__photo" role="img" aria-label={`Photo shared by ${userName(nudge)}`}><img src={nudge.photo_url} alt="" onError={() => setImageFailed(true)} /><span className="active-moment__look-chip"><span className="active-moment__direction-arrow" style={{ transform: `rotate(${rotations[nudge.direction]}deg)` }}><SkyIcon name="arrow" size={18} strokeWidth={2.5} /></span>{lookText(nudge.direction)}</span></div><p className="active-moment__small">{locationCopy(nudge)}</p></section> : <CompassPanel nudge={nudge} />}
      {nudge.note ? <p className="active-moment__quote">“{nudge.note}”</p> : null}
      <section className="active-moment__time"><div><span>Time left</span><strong>{ended ? 'Ended' : `${minutes} min`}</strong></div><div className="active-moment__bar" role="progressbar" aria-label="Time left" aria-valuenow={minutes} aria-valuemin={0} aria-valuemax={expiryMinutes}><span style={{ width: `${progressPercent(minutes)}%` }} /></div>{ended ? <p>This SkyNudge has ended.</p> : null}</section>
      <section className="active-moment__facts" aria-label="SkyNudge facts"><div><span>Landmark</span><strong>{nudge.landmark || 'None given'}</strong></div><div><span>Can see it</span><strong>{peopleText(nudge.seen_count ?? nudge.watcher_count)}</strong></div><div><span>Shared with</span><strong>Within {nudge.radius_km} km</strong></div></section>
      <p className="active-moment__look-up">Then put your phone down and look up.</p>
    </main>
    <footer className="active-moment__sticky">
      {ownNudge ? <p className="active-moment__own-note">This is your SkyNudge</p> : confirmed ? <button className="active-moment__see-button active-moment__see-button--done" type="button" disabled><SkyIcon name="check" size={20} strokeWidth={2.6} />You can see it too</button> : <button className="active-moment__see-button" type="button" disabled={ended || isConfirming} onClick={() => void confirm()}>{isConfirming ? 'Confirming…' : 'I can see it too'}</button>}
      <button className="active-moment__text-button" type="button" disabled={ended} onClick={onCreate}>Nudge the sky yourself</button>
      {error ? <p className="active-moment__action-error" role="alert">{error}</p> : null}
    </footer>
    {sheet !== 'closed' ? <div className="active-moment__sheet-backdrop" role="presentation" onMouseDown={() => !isSafetyWorking && setSheet('closed')}><section className="active-moment__sheet" role="dialog" aria-modal="true" aria-labelledby="active-moment-sheet-title" onMouseDown={(event) => event.stopPropagation()}>
      {sheet === 'menu' ? <><h2 id="active-moment-sheet-title">SkyNudge safety</h2><button className="active-moment__sheet-danger" type="button" onClick={() => setSheet('report')}>Report this SkyNudge</button><button className="active-moment__sheet-danger" type="button" onClick={() => setSheet('block')}>Block {userName(nudge)}</button></> : sheet === 'report' ? <><h2 id="active-moment-sheet-title">Report this SkyNudge?</h2><p>Tell us what is wrong so we can review it.</p><label>Reason<textarea value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} /></label><button className="active-moment__sheet-danger" type="button" disabled={isSafetyWorking || reason.trim().length === 0} onClick={() => void completeSafetyAction()}>{isSafetyWorking ? 'Sending…' : 'Confirm report'}</button></> : <><h2 id="active-moment-sheet-title">Block {userName(nudge)}?</h2><p>You will no longer see SkyNudges from this person.</p><button className="active-moment__sheet-danger" type="button" disabled={isSafetyWorking} onClick={() => void completeSafetyAction()}>{isSafetyWorking ? 'Blocking…' : `Block ${userName(nudge)}`}</button></>}
      <button className="active-moment__text-button" type="button" disabled={isSafetyWorking} onClick={() => setSheet('closed')}>Cancel</button>
    </section></div> : null}
  </div>;
}

export function ActiveMomentPage(): JSX.Element {
  const api = useSkyNudgeApi();
  const navigate = useNavigate();
  const { nudgeId } = useParams();
  const [nudge, setNudge] = useState<Nudge | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const loadNudge = useCallback(async (): Promise<void> => {
    if (!nudgeId) { setIsLoading(false); return; }
    setIsLoading(true);
    setError('');
    try {
      const [loaded, profile] = await Promise.all([api.getNudge(nudgeId), api.getMyProfile()]);
      setNudge(loaded);
      setCurrentUserId(profile?.id ?? null);
    } catch (caughtError) { setError(caughtError instanceof Error ? caughtError.message : 'Unable to load this SkyNudge.'); } finally { setIsLoading(false); }
  }, [api, nudgeId]);
  useEffect(() => { void loadNudge(); }, [loadNudge]);
  const confirm = useCallback(async (current: Nudge): Promise<void> => {
    const previous = current;
    const count = (previous.seen_count ?? previous.watcher_count) + 1;
    setNudge({ ...previous, confirmed_by_me: true, i_can_see_it: true, watcher_count: count, seen_count: count });
    try { setNudge(await api.confirmSighting(current.id)); } catch (caughtError) { setNudge(previous); throw caughtError; }
  }, [api]);
  if (isLoading) return <div className="active-moment active-moment--skeleton" aria-label="Loading SkyNudge"><TopBar backTo="/moments" /><i /><i /><i /><i /></div>;
  if (error) return <div className="active-moment"><TopBar backTo="/moments" /><div className="active-moment__state"><p role="alert">{error}</p><button className="sky-button sky-button--secondary" type="button" onClick={() => void loadNudge()}>Retry</button></div></div>;
  if (!nudge) return <div className="active-moment"><TopBar backTo="/moments" /><div className="active-moment__state"><p>This SkyNudge is no longer active or is unavailable.</p></div></div>;
  return <ActiveMomentContent nudge={nudge} currentUserId={currentUserId} onCreate={() => navigate('/nudge/new')} onConfirm={confirm} onReport={(reason) => api.reportNudge(nudge.id, reason)} onBlock={async () => { await api.blockUser(nudge.poster.id); navigate('/home', { replace: true }); }} />;
}
import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useSkyNudgeApi } from '../app/providers/useSkyNudgeApi';
import { useAuth } from '../app/providers/useAuth';
import { MomentEntry } from '../components/moments/MomentEntry';
import { NudgeRow } from '../components/nudge/NudgeRow';
import { RoutePlaceholder } from './RoutePlaceholder';
import type { Category, Direction, Intensity, Nudge, RadiusKm, SkyMoment, SkyUser, VerificationStatus } from '../types/sky';

const melbourneFallback = { lat: -37.8136, lng: 144.9631 };
const categories: Category[] = ['sunset', 'sunrise', 'rainbow', 'clouds', 'moon', 'other'];
const directions: Direction[] = ['west', 'east', 'north', 'south', 'above'];
const intensities: Intensity[] = ['beautiful', 'wow', 'look_now'];
const radii: RadiusKm[] = [2, 5, 10];

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}

export function LoginPage(): JSX.Element {
  const api = useSkyNudgeApi();
  const { refreshAuth } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await api.signIn(email, password);
      await refreshAuth();
      navigate('/home', { replace: true });
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return <AuthPage eyebrow="SkyNudge" title="Look up before it is gone." description="Log in to see what is happening in the sky around you.">
    <form className="auth-form" onSubmit={handleSubmit}>
      <label className="auth-field"><span>Email</span><input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required /></label>
      <label className="auth-field"><span>Password</span><input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Your password" required /></label>
      {error ? <p className="auth-error" role="alert">{error}</p> : null}
      <button className="auth-button" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Logging in…' : 'Log in'}</button>
    </form>
    <p className="auth-switch">New here? <Link to="/create-account">Create an account</Link></p>
  </AuthPage>;
}

export function CreateAccountPage(): JSX.Element {
  const api = useSkyNudgeApi();
  const { refreshAuth } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);
    try {
      await api.signUp(email, password);
      await refreshAuth();
      navigate('/welcome', { replace: true });
    } catch (caughtError) {
      const nextMessage = getErrorMessage(caughtError);
      if (nextMessage.startsWith('Check your email')) setMessage(nextMessage);
      else setError(nextMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  return <AuthPage eyebrow="Create account" title="A name just for the sky." description="Your SkyNudge username is anonymous and auto-generated.">
    <form className="auth-form" onSubmit={handleSubmit}>
      <label className="auth-field"><span>Email</span><input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required /></label>
      <label className="auth-field"><span>Password</span><input type="password" autoComplete="new-password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" required /></label>
      {error ? <p className="auth-error" role="alert">{error}</p> : null}
      {message ? <p className="auth-message" role="status">{message}</p> : null}
      <button className="auth-button" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creating account…' : 'Create account'}</button>
    </form>
    <p className="auth-switch">Already have an account? <Link to="/login">Log in</Link></p>
  </AuthPage>;
}

interface AuthPageProps { eyebrow: string; title: string; description: string; children: ReactNode; }
function AuthPage({ eyebrow, title, description, children }: AuthPageProps): JSX.Element {
  return <div className="screen-page screen-page--centered"><div className="page-stack"><div><p className="page-eyebrow">{eyebrow}</p><h1 className="page-title">{title}</h1><p className="page-copy">{description}</p></div>{children}</div></div>;
}

export function VerificationIntroPage(): JSX.Element {
  const api = useSkyNudgeApi();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<SkyUser | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try { setProfile(await api.getMyProfile()); }
      catch (caughtError) { setError(getErrorMessage(caughtError)); }
      finally { setIsLoading(false); }
    })();
  }, [api]);

  if (isLoading) return <div className="screen-page"><p className="page-copy">Loading your verification status…</p></div>;
  if (error) return <div className="screen-page"><p className="auth-error" role="alert">{error}</p></div>;
  const status = profile?.verification_status ?? 'not_verified';
  const statusCopy = verificationStatusCopy(status);
  return <div className="screen-page screen-page--centered"><div className="page-stack"><div><p className="page-eyebrow">Identity</p><h1 className="page-title">A quieter way to know who is nearby.</h1><p className="page-copy">Verification is optional. Your legal name and phone number are submitted privately and are never shown on SkyNudges.</p></div>
    <div className="placeholder-note"><strong>{statusCopy.title}</strong><p>{statusCopy.description}</p></div>
    {status === 'not_verified' || status === 'rejected' ? <button className="sky-button sky-button--primary sky-button--full" type="button" onClick={() => navigate('/verification/form')}>{status === 'rejected' ? 'Submit a new request' : 'Start verification'}</button> : null}
    <button className="sky-button sky-button--secondary sky-button--full" type="button" onClick={() => navigate('/account')}>Back to account</button>
  </div></div>;
}

export function VerificationFormPage(): JSX.Element {
  const api = useSkyNudgeApi();
  const { refreshAuth } = useAuth();
  const navigate = useNavigate();
  const [fullLegalName, setFullLegalName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!consent) { setError('Consent is required to submit verification.'); return; }
    setError('');
    setIsSubmitting(true);
    try {
      await api.submitVerification({ full_legal_name: fullLegalName.trim(), phone_number: phoneNumber.trim(), consent });
      await refreshAuth();
      navigate('/verification', { replace: true });
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return <div className="screen-page"><div className="page-stack"><div><p className="page-eyebrow">Identity</p><h1 className="page-title">Verify your account.</h1><p className="page-copy">Your details are used only for this private verification request.</p></div>
    <form className="auth-form" onSubmit={submit}>
      <label className="auth-field"><span>Legal name</span><input autoComplete="name" value={fullLegalName} onChange={(event) => setFullLegalName(event.target.value)} maxLength={200} placeholder="Your full legal name" required /></label>
      <label className="auth-field"><span>Phone number</span><input type="tel" autoComplete="tel" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} maxLength={50} placeholder="e.g. +61 400 000 000" required /></label>
      <label className="nudge-checkbox"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /> I consent to SkyNudge using these details to review my verification request.</label>
      {error ? <p className="auth-error" role="alert">{error}</p> : null}
      <button className="auth-button" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Submitting…' : 'Submit verification'}</button>
    </form>
  </div></div>;
}
export const WelcomePage = (): JSX.Element => <RoutePlaceholder eyebrow="Welcome" title="The sky is waiting." description="Your anonymous account is ready." />;
export function HomePage(): JSX.Element {
  const api = useSkyNudgeApi();
  const navigate = useNavigate();
  const [nudges, setNudges] = useState<Nudge[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadNudges = useCallback(async (): Promise<void> => {
    setError('');
    try {
      const position = await getCurrentLocation();
      setNudges(await api.getNearbyNudges(position.lat, position.lng));
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  useEffect(() => { void loadNudges(); }, [loadNudges]);
  useEffect(() => api.subscribeToNudges(() => { void loadNudges(); }), [api, loadNudges]);

  return <div className="screen-page"><div className="page-stack"><div><p className="page-eyebrow">Right now near you</p><h1 className="page-title">SkyNudges</h1><p className="page-copy">Temporary moments shared by people nearby.</p></div>
    <button className="sky-button sky-button--primary sky-button--full" type="button" onClick={() => navigate('/nudge/new')}>Share a SkyNudge</button>
    {error ? <p className="auth-error" role="alert">{error}</p> : null}
    {isLoading ? <p className="page-copy">Finding nearby moments…</p> : null}
    {!isLoading && !error && nudges.length === 0 ? <div className="placeholder-note">No active SkyNudges are nearby right now. Be the first to share what you see.</div> : null}
    <section aria-label="Nearby SkyNudges">{nudges.map((nudge) => <NudgeRow key={nudge.id} nudge={nudge} onClick={() => navigate(`/nudge/${nudge.id}`)} />)}</section>
  </div></div>;
}

export function ActiveMomentPage(): JSX.Element {
  const api = useSkyNudgeApi();
  const navigate = useNavigate();
  const { nudgeId } = useParams();
  const [nudge, setNudge] = useState<Nudge | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');
  const [reportReason, setReportReason] = useState('');
  const [isReporting, setIsReporting] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);

  const loadNudge = useCallback(async (): Promise<void> => {
    if (!nudgeId) return;
    setError('');
    try { setNudge(await api.getNudge(nudgeId)); }
    catch (caughtError) { setError(getErrorMessage(caughtError)); }
    finally { setIsLoading(false); }
  }, [api, nudgeId]);

  useEffect(() => { void loadNudge(); }, [loadNudge]);

  async function confirm(): Promise<void> {
    if (!nudge) return;
    setIsConfirming(true);
    setError('');
    try { setNudge(await api.confirmSighting(nudge.id)); }
    catch (caughtError) { setError(getErrorMessage(caughtError)); }
    finally { setIsConfirming(false); }
  }

  async function saveAsMoment(): Promise<void> {
    if (!nudge) return;
    setIsSaving(true);
    setError('');
    setSavedMessage('');
    try {
      const moment = await api.saveMoment({ nudge_id: nudge.id });
      if (!nudge.photo_url) {
        setSavedMessage('Saved to your private Sky Moments archive.');
        return;
      }
      try {
        await api.addMomentPhotos(moment.id, [await fetchNudgePhoto(nudge.photo_url)]);
        setSavedMessage('Saved to your private Sky Moments archive with its photo.');
      } catch {
        setSavedMessage('Saved to your private Sky Moments archive. The shared photo could not be copied, but you can add it manually.');
      }
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    } finally {
      setIsSaving(false);
    }
  }

  async function report(): Promise<void> {
    if (!nudge) return;
    setIsReporting(true);
    setError('');
    try {
      await api.reportNudge(nudge.id, reportReason);
      setReportReason('');
      setShowReportForm(false);
      setSavedMessage('Thanks. Your report has been submitted for review.');
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    } finally {
      setIsReporting(false);
    }
  }

  async function blockPoster(): Promise<void> {
    if (!nudge) return;
    setIsBlocking(true);
    setError('');
    try {
      await api.blockUser(nudge.poster.id);
      navigate('/home', { replace: true });
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    } finally {
      setIsBlocking(false);
    }
  }

  if (isLoading) return <div className="screen-page"><p className="page-copy">Loading SkyNudge…</p></div>;
  if (error) return <div className="screen-page"><p className="auth-error" role="alert">{error}</p></div>;
  if (!nudge) return <div className="screen-page"><p className="placeholder-note">This SkyNudge is no longer active or is unavailable.</p></div>;
  return <div className="screen-page"><div className="page-stack"><div><p className="page-eyebrow">Active moment</p><h1 className="page-title">Look {nudge.direction}</h1><p className="page-copy">{nudge.category} shared by {nudge.poster.username}. {nudge.landmark ? `Near ${nudge.landmark}.` : ''}</p></div>
    {nudge.photo_url ? <img className="nudge-photo" src={nudge.photo_url} alt="Shared sky moment" /> : null}
    <div className="nudge-detail"><strong>{nudge.intensity.replace('_', ' ')}</strong><span>{nudge.watcher_count} people can see it</span>{nudge.note ? <p>{nudge.note}</p> : null}</div>
    {nudge.confirmed_by_me ? <p className="auth-message">You confirmed this SkyNudge.</p> : <button className="sky-button sky-button--primary sky-button--full" type="button" disabled={isConfirming} onClick={() => void confirm()}>{isConfirming ? 'Confirming…' : 'I can see it too'}</button>}
    {savedMessage ? <p className="auth-message">{savedMessage}</p> : null}
    <button className="sky-button sky-button--secondary sky-button--full" type="button" disabled={isSaving} onClick={() => void saveAsMoment()}>{isSaving ? 'Saving…' : 'Save as Sky Moment'}</button>
    <div className="safety-actions"><button className="sky-button sky-button--text" type="button" onClick={() => setShowReportForm((visible) => !visible)}>Report this SkyNudge</button><button className="sky-button sky-button--danger" type="button" disabled={isBlocking} onClick={() => void blockPoster()}>{isBlocking ? 'Blocking…' : `Block ${nudge.poster.username}`}</button></div>
    {showReportForm ? <form className="report-form" onSubmit={(event) => { event.preventDefault(); void report(); }}><label className="sky-field"><span className="sky-field__label">Why are you reporting this?</span><textarea className="sky-field__input report-form__textarea" value={reportReason} onChange={(event) => setReportReason(event.target.value)} maxLength={500} placeholder="Describe the issue" required /></label><button className="sky-button sky-button--danger" type="submit" disabled={isReporting}>{isReporting ? 'Sending report…' : 'Submit report'}</button></form> : null}
  </div></div>;
}

export function NudgeStepOnePage(): JSX.Element {
  const api = useSkyNudgeApi();
  const navigate = useNavigate();
  const [category, setCategory] = useState<Category>('sunset');
  const [intensity, setIntensity] = useState<Intensity>('beautiful');
  const [direction, setDirection] = useState<Direction>('west');
  const [radiusKm, setRadiusKm] = useState<RadiusKm>(5);
  const [landmark, setLandmark] = useState('');
  const [shareExactLocation, setShareExactLocation] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const position = await getCurrentLocation();
      const nudge = await api.createNudge({ category, intensity, direction, radius_km: radiusKm, landmark: landmark.trim() || null, coordinates: position, exact_location_shared: shareExactLocation, photo_file: photoFile });
      navigate(`/nudge/${nudge.id}`, { replace: true });
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return <div className="screen-page"><div className="page-stack"><div><p className="page-eyebrow">New SkyNudge</p><h1 className="page-title">What are you seeing?</h1><p className="page-copy">Your location is rounded to about 1 km unless you choose to share it exactly.</p></div>
    <form className="nudge-form" onSubmit={handleSubmit}>
      <label className="sky-field"><span className="sky-field__label">Sky moment</span><select className="sky-field__input" value={category} onChange={(event) => setCategory(event.target.value as Category)}>{categories.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
      <label className="sky-field"><span className="sky-field__label">How does it feel?</span><select className="sky-field__input" value={intensity} onChange={(event) => setIntensity(event.target.value as Intensity)}>{intensities.map((value) => <option key={value} value={value}>{value.replace('_', ' ')}</option>)}</select></label>
      <label className="sky-field"><span className="sky-field__label">Direction to look</span><select className="sky-field__input" value={direction} onChange={(event) => setDirection(event.target.value as Direction)}>{directions.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
      <label className="sky-field"><span className="sky-field__label">Share with people within</span><select className="sky-field__input" value={radiusKm} onChange={(event) => setRadiusKm(Number(event.target.value) as RadiusKm)}>{radii.map((value) => <option key={value} value={value}>{value} km</option>)}</select></label>
      <label className="sky-field"><span className="sky-field__label">Nearby landmark <span className="sky-field__hint">optional</span></span><input className="sky-field__input" value={landmark} onChange={(event) => setLandmark(event.target.value)} maxLength={100} placeholder="e.g. St Kilda Beach" /></label>
      <label className="sky-field"><span className="sky-field__label">Photo <span className="sky-field__hint">optional · JPEG/PNG, up to 5 MB</span></span><input className="sky-field__input sky-field__input--file" type="file" accept="image/jpeg,image/png" onChange={(event) => setPhotoFile(event.target.files?.[0] ?? null)} /></label>
      {photoFile ? <p className="file-summary">Selected: {photoFile.name}</p> : null}
      <label className="nudge-checkbox"><input type="checkbox" checked={shareExactLocation} onChange={(event) => setShareExactLocation(event.target.checked)} /> Share my exact location for this nudge</label>
      {error ? <p className="auth-error" role="alert">{error}</p> : null}
      <button className="sky-button sky-button--primary sky-button--full" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Sharing…' : 'Share SkyNudge'}</button>
    </form>
  </div></div>;
}
export const NudgeStepTwoPage = (): JSX.Element => <RoutePlaceholder eyebrow="New SkyNudge · 2 of 2" title="Help people find it." description="Share an approximate direction and location." />;
export const NudgeSuccessPage = (): JSX.Element => <RoutePlaceholder eyebrow="Sent" title="Your SkyNudge is live." description="Now put your phone down and look up." />;
export function MomentsFeedPage(): JSX.Element {
  const api = useSkyNudgeApi();
  const [moments, setMoments] = useState<SkyMoment[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingMomentId, setUploadingMomentId] = useState<string | null>(null);

  const loadMoments = useCallback(async (): Promise<void> => {
    setError('');
    try {
      setMoments(await api.listMyMoments());
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  useEffect(() => { void loadMoments(); }, [loadMoments]);

  async function addPhotos(moment: SkyMoment, files: FileList | null): Promise<void> {
    if (!files || files.length === 0) return;
    setUploadingMomentId(moment.id);
    setError('');
    try {
      const updatedMoment = await api.addMomentPhotos(moment.id, Array.from(files));
      setMoments((current) => current.map((candidate) => candidate.id === updatedMoment.id ? updatedMoment : candidate));
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    } finally {
      setUploadingMomentId(null);
    }
  }

  return <div className="screen-page"><div className="page-stack"><div><p className="page-eyebrow">Private archive</p><h1 className="page-title">My Sky Moments</h1><p className="page-copy">Only you can view saved moments and their photos.</p></div>
    {error ? <p className="auth-error" role="alert">{error}</p> : null}
    {isLoading ? <p className="page-copy">Loading your private archive…</p> : null}
    {!isLoading && !error && moments.length === 0 ? <div className="placeholder-note">Save an active SkyNudge to begin your private archive.</div> : null}
    <section className="moments-list" aria-label="My Sky Moments">{moments.map((moment) => <article key={moment.id} className="moment-archive-item"><MomentEntry moment={moment} />
      <div className="moment-archive-item__actions"><label className="sky-button sky-button--secondary moment-upload-button">{uploadingMomentId === moment.id ? 'Uploading…' : `Add photos (${moment.photo_urls.length}/6)`}<input type="file" accept="image/jpeg,image/png" multiple disabled={uploadingMomentId !== null || moment.photo_urls.length >= 6} onChange={(event) => { void addPhotos(moment, event.target.files); event.currentTarget.value = ''; }} /></label></div>
    </article>)}</section>
  </div></div>;
}
export const MomentsCalendarPage = (): JSX.Element => <RoutePlaceholder eyebrow="Private archive" title="My Sky Moments" description="Browse your private moments by day." />;
export const SelectedDayPage = (): JSX.Element => <RoutePlaceholder eyebrow="Private archive" title="A day in the sky." description="Your saved moments from this selected day." />;
export function AccountPage(): JSX.Element {
  const api = useSkyNudgeApi();
  const { refreshAuth } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [profile, setProfile] = useState<SkyUser | null>(null);

  useEffect(() => {
    void (async () => {
      try { setProfile(await api.getMyProfile()); }
      catch (caughtError) { setError(getErrorMessage(caughtError)); }
    })();
  }, [api]);

  async function signOut(): Promise<void> {
    setError('');
    setIsSigningOut(true);
    try {
      await api.signOut();
      await refreshAuth();
      navigate('/login', { replace: true });
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    } finally {
      setIsSigningOut(false);
    }
  }

  const status = profile?.verification_status ?? 'not_verified';
  const statusCopy = verificationStatusCopy(status);
  return <div className="screen-page screen-page--centered"><div className="page-stack"><div><p className="page-eyebrow">Account</p><h1 className="page-title">Your sky identity.</h1><p className="page-copy">Your anonymous username and verification status are private to your account.</p></div>
    {profile ? <div className="placeholder-note"><strong>{profile.username}</strong><p><strong>Verification: {statusCopy.title}</strong><br />{statusCopy.description}</p></div> : null}
    {error ? <p className="auth-error" role="alert">{error}</p> : null}
    <button className="sky-button sky-button--primary sky-button--full" type="button" onClick={() => navigate('/verification')}>{status === 'not_verified' || status === 'rejected' ? 'Verify account' : 'View verification status'}</button>
    <button className="sky-button sky-button--secondary sky-button--full" type="button" disabled={isSigningOut} onClick={() => void signOut()}>{isSigningOut ? 'Signing out…' : 'Sign out'}</button>
  </div></div>;
}
export const SettingsPage = (): JSX.Element => <RoutePlaceholder eyebrow="Settings" title="Your preferences." description="Control location sharing, alerts, and your default radius." />;

function getCurrentLocation(): Promise<{ lat: number; lng: number }> {
  if (!navigator.geolocation) return Promise.resolve(melbourneFallback);
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
      () => resolve(melbourneFallback),
      { enableHighAccuracy: false, timeout: 8_000, maximumAge: 60_000 },
    );
  });
}

async function fetchNudgePhoto(url: string): Promise<File> {
  const response = await fetch(url);
  if (!response.ok) throw new Error('The shared photo could not be downloaded.');
  const photo = await response.blob();
  if (photo.type !== 'image/jpeg' && photo.type !== 'image/png') {
    throw new Error('The shared photo is not a JPEG or PNG image.');
  }
  const extension = photo.type === 'image/png' ? 'png' : 'jpg';
  return new File([photo], `saved-sky-moment.${extension}`, { type: photo.type });
}

function verificationStatusCopy(status: VerificationStatus): { title: string; description: string } {
  switch (status) {
    case 'pending': return { title: 'Pending review', description: 'Your private verification request has been submitted and is awaiting review.' };
    case 'verified': return { title: 'Verified', description: 'Your account has completed verification.' };
    case 'rejected': return { title: 'Not approved', description: 'Your previous request was not approved. You can submit a new request with accurate details.' };
    default: return { title: 'Not verified', description: 'Verification is optional and helps build trust in the SkyNudge community.' };
  }
}
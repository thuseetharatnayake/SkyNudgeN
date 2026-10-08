import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useSkyNudgeApi } from '../app/providers/useSkyNudgeApi';
import { useAuth } from '../app/providers/useAuth';
import { ActiveMomentPage as ActiveMomentScreen } from '../components/active-moment/ActiveMomentPage';
import { MomentEntry } from '../components/moments/MomentEntry';
import { MomentsHeader } from '../components/moments/MomentsHeader';
import { CalendarGrid } from '../components/calendar/CalendarGrid';
import { SkyIcon } from '../components/ui/SkyIcon';
import { TopBar } from '../components/layout/TopBar';
import { useLaunchComplete } from '../components/launch/launchContext';
import { localDateKey } from '../lib/moments';
import { HomeScreen } from '../components/home/HomeScreen';
import { useNearbyNudges } from '../hooks/useNearbyNudges';
import { AccountPage as AccountScreen, SettingsPage as SettingsScreen } from '../components/account/AccountScreens';
import { RoutePlaceholder } from './RoutePlaceholder';
import type { Category, Direction, Intensity, RadiusKm, SkyMoment, SkyUser } from '../types/sky';

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
  const location = useLocation();
  const successMessage = (location.state as { message?: string } | null)?.message;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const emailInput = useRef<HTMLInputElement>(null);
  const launchComplete = useLaunchComplete();

  useEffect(() => { if (launchComplete) emailInput.current?.focus(); }, [launchComplete]);

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

  return <AuthPage variant="login" title="Look up before it is gone." description="Someone nearby saw something beautiful. Log in to see what is happening in the sky around you." hideBack footer={<><p className="auth-switch">New here? <Link to="/create-account">Create an account</Link></p><p className="auth-privacy">Your real name never appears publicly.</p></>}>
    <form className="auth-form" onSubmit={handleSubmit}>
      <label className="auth-field"><span>Email</span><input ref={emailInput} type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required /></label>
      <label className="auth-field"><span>Password</span><span className="auth-password"><input type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Your password" required /><button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? 'Hide' : 'Show'}</button></span></label>
      {successMessage ? <p className="auth-message" role="status">{successMessage}</p> : null}
      {error ? <p className="auth-error" role="alert">{error}</p> : null}
      <button className="auth-button" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Logging in…' : 'Log in'}</button>
    </form>
  </AuthPage>;
}

export function CreateAccountPage(): JSX.Element {
  const api = useSkyNudgeApi();
  const { refreshAuth } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

  return <AuthPage variant="create" eyebrow="Create account" title="A name just for the sky." description="Your SkyNudge username is anonymous and auto-generated." backTo="/login" footer={<p className="auth-switch">Already have an account? <Link to="/login">Log in</Link></p>}>
    <form className="auth-form" onSubmit={handleSubmit}>
      <label className="auth-field"><span>Email</span><input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required /></label>
      <label className="auth-field"><span>Password</span><span className="auth-password"><input type={showPassword ? 'text' : 'password'} autoComplete="new-password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" required /><button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? 'Hide' : 'Show'}</button></span></label>
      {error ? <p className="auth-error" role="alert">{error}</p> : null}
      {message ? <p className="auth-message" role="status">{message}</p> : null}
      <button className="auth-button" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creating account…' : 'Create account'}</button>
    </form>
  </AuthPage>;
}

interface AuthPageProps { variant: 'login' | 'create'; eyebrow?: string; title: string; description: string; children: ReactNode; footer?: ReactNode; backTo?: string | -1; hideBack?: boolean; }
function AuthPage({ variant, eyebrow, title, description, children, footer, backTo, hideBack }: AuthPageProps): JSX.Element {
  const isLogin = variant === 'login';
  return <div className={`auth-page auth-page--${variant}`}>{isLogin ? <><svg className="auth-cloud auth-cloud--one" viewBox="0 0 180 62" aria-hidden="true"><path d="M12 50h150c12 0 18-7 18-16 0-10-8-18-18-18-3 0-6 1-9 2C147 8 137 2 125 2c-15 0-27 10-30 24-5-4-11-6-18-6-14 0-25 10-27 23h-2c-10 0-18 6-18 14 0 8 7 13 18 13Z" /></svg><svg className="auth-cloud auth-cloud--two" viewBox="0 0 180 62" aria-hidden="true"><path d="M12 50h150c12 0 18-7 18-16 0-10-8-18-18-18-3 0-6 1-9 2C147 8 137 2 125 2c-15 0-27 10-30 24-5-4-11-6-18-6-14 0-25 10-27 23h-2c-10 0-18 6-18 14 0 8 7 13 18 13Z" /></svg></> : null}{hideBack ? null : <TopBar backTo={backTo} />}<main className="auth-page__content"><div className={`auth-lockup${isLogin ? ' rise rise--one' : ''}`}><span className="auth-lockup__mark"><SkyIcon name="other" size={49} strokeWidth={1.65} /></span><span>SkyNudge</span></div><div className={`auth-heading${isLogin ? ' rise rise--two' : ''}`}>{eyebrow ? <p className="page-eyebrow">{eyebrow}</p> : null}<h1 className="page-title">{title}</h1><p className="page-copy">{description}</p></div><div className={`auth-card${isLogin ? ' rise rise--three' : ''}`}>{children}</div>{footer ? <div className={`auth-footer${isLogin ? ' rise rise--four' : ''}`}>{footer}</div> : null}</main></div>;
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

  if (isLoading) return <main className="verification-page"><TopBar backTo="/account" /><p className="page-copy">Loading your verification status…</p></main>;
  if (error) return <main className="verification-page"><TopBar backTo="/account" /><p className="auth-error" role="alert">{error}</p></main>;
  const status = profile?.verification_status ?? 'not_verified';
  if (status === 'pending' || status === 'verified' || status === 'rejected') return <main className="verification-page"><TopBar backTo="/account" /><div className="verification-status"><p className="verification-eyebrow">Optional</p><h1>{status === 'pending' ? 'We are reviewing your details.' : status === 'verified' ? 'You are verified.' : 'We could not verify you this time.'}</h1>{status === 'rejected' ? <button className="verification-primary-button" type="button" onClick={() => navigate('/verification/form')}>Try again</button> : null}</div></main>;
  return <main className="verification-page"><TopBar backTo="/account" /><div className="verification-content"><div><p className="verification-eyebrow">Optional</p><h1>What verification means</h1></div><section className="verification-rows" aria-label="What verification means"><div className="verification-row"><span className="verification-tile"><SkyIcon name="shield" size={22} /></span><div><strong>An identity check</strong><p>We check your full legal name and phone number once to confirm you are a real person.</p></div></div><div className="verification-row"><span className="verification-tile"><SkyIcon name="lock" size={22} /></span><div><strong>Your details stay private</strong><p>Your name and number are never shown to anyone. You keep your anonymous username.</p></div></div><div className="verification-row"><span className="verification-tile"><SkyIcon name="check" size={22} strokeWidth={2.2} /></span><div><strong>A small check beside your name</strong><p>The badge only means the identity check was completed. It does not guarantee anyone&apos;s behaviour or that a SkyNudge is accurate.</p></div></div></section><div className="verification-actions"><button className="verification-primary-button" type="button" onClick={() => navigate('/verification/form')}>Continue</button><button className="verification-text-button" type="button" onClick={() => navigate('/account')}>Not now</button></div></div></main>;
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
  const isNameValid = fullLegalName.trim().length > 0;
  const isPhoneValid = phoneNumber.replace(/\D/g, '').length >= 8;
  const canSubmit = isNameValid && isPhoneValid && consent && !isSubmitting;

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!canSubmit) return;
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

  return <main className="verification-page"><TopBar backTo="/verification" /><div className="verification-content verification-content--form"><div><h1>Verify your account</h1><p className="verification-subtitle">This takes a minute. Only our team sees these details.</p></div><form className="verification-form" onSubmit={submit} noValidate><label><span>Full legal name</span><input autoComplete="name" value={fullLegalName} onChange={(event) => setFullLegalName(event.target.value)} maxLength={200} placeholder="As shown on your ID" /></label><label><span>Phone number</span><input type="tel" autoComplete="tel" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} maxLength={50} placeholder="04xx xxx xxx" /></label><label className="verification-consent"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>I agree to SkyNudge checking my name and phone number to confirm my identity. This information is never shown publicly.</span></label>{error ? <p className="auth-error" role="alert">{error}</p> : null}<button className="verification-primary-button" type="submit" disabled={!canSubmit}>{isSubmitting ? 'Submitting…' : 'Submit verification'}</button></form></div></main>;
}
export const WelcomePage = (): JSX.Element => <RoutePlaceholder eyebrow="Welcome" title="The sky is waiting." description="Your anonymous account is ready." backTo="/home" />;
export function HomePage(): JSX.Element {
  const navigate = useNavigate();
  const nearby = useNearbyNudges();
  return <HomeScreen {...nearby} onAccount={() => navigate('/account')} onCreate={() => navigate('/nudge/new')} onOpenNudge={(id) => navigate(`/nudge/${id}`)} onEnableLocation={() => void nearby.requestLocation()} onRetry={() => void nearby.retry()} />;
}

export function ActiveMomentPage(): JSX.Element { return <ActiveMomentScreen />; }

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

  useEffect(() => {
    void (async () => {
      try {
        const profile = await api.getMyProfile();
        if (!profile) return;
        setRadiusKm(profile.default_radius_km);
        setShareExactLocation(profile.share_exact_location);
      } catch (caughtError) {
        setError(getErrorMessage(caughtError));
      }
    })();
  }, [api]);

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

  return <div className="nudge-page"><TopBar backTo="/home" /><div className="screen-page"><div className="page-stack"><div><p className="page-eyebrow">New SkyNudge · 1 of 2</p><h1 className="page-title">What is happening?</h1><p className="page-copy">Share only an approximate location. You are always in control.</p></div>
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
  </div></div></div>;
}
export const NudgeStepTwoPage = (): JSX.Element => <RoutePlaceholder eyebrow="New SkyNudge · 2 of 2" title="Help people find it." description="Share an approximate direction and location." backTo="/nudge/new" />;
export const NudgeSuccessPage = (): JSX.Element => <RoutePlaceholder eyebrow="Sent" title="Your SkyNudge is live." description="Now put your phone down and look up." backTo="/home" />;
function MomentsSkeleton(): JSX.Element { return <div className="moments-skeleton" aria-label="Loading Sky Moments"><i /><i /><i /></div>; }

export function MomentsFeedPage(): JSX.Element {
  const api = useSkyNudgeApi();
  const navigate = useNavigate();
  const [moments, setMoments] = useState<SkyMoment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { void (async () => { try { setMoments(await api.getMyMoments()); } catch (caughtError) { setError(getErrorMessage(caughtError)); } finally { setIsLoading(false); } })(); }, [api]);

  return <div className="moments-page"><TopBar backTo="/home" /><MomentsHeader /><main className="moments-content">{isLoading ? <MomentsSkeleton /> : null}{error ? <p className="auth-error" role="alert">{error}</p> : null}{!isLoading && !error && moments.length === 0 ? <section className="moments-empty"><p>Save the sky moments you want to remember.</p><button type="button" className="sky-button sky-button--primary" onClick={() => navigate('/home')}>Nudge the Sky</button></section> : null}<section className="moments-feed" aria-label="My Sky Moments">{moments.map((moment) => <MomentEntry key={moment.id} moment={moment} onOpen={() => navigate(`/moments/day/${localDateKey(moment.occurred_at)}`)} />)}</section></main></div>;
}

export function MomentsCalendarPage(): JSX.Element {
  const api = useSkyNudgeApi();
  const navigate = useNavigate();
  const currentDate = new Date();
  const [viewDate, setViewDate] = useState(() => new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));
  const [moments, setMoments] = useState<SkyMoment[]>([]);
  const [photosByDay, setPhotosByDay] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const atCurrentMonth = year === currentDate.getFullYear() && month === currentDate.getMonth();

  useEffect(() => { void (async () => { setIsLoading(true); setError(''); try { const [nextMoments, nextPhotos] = await Promise.all([api.getMyMoments(), api.getMomentPhotosForMonth(year, month)]); setMoments(nextMoments); setPhotosByDay(nextPhotos); } catch (caughtError) { setError(getErrorMessage(caughtError)); } finally { setIsLoading(false); } })(); }, [api, month, year]);

  return <div className="moments-page"><TopBar backTo="/home" /><MomentsHeader /><main className="moments-content"><div className="moments-calendar__head"><button type="button" aria-label="Previous month" className="moments-icon-button" onClick={() => setViewDate((date) => new Date(date.getFullYear(), date.getMonth() - 1, 1))}><SkyIcon name="chevron-left" size={22} strokeWidth={2} /></button><h2>{new Intl.DateTimeFormat('en-AU', { month: 'long', year: 'numeric' }).format(viewDate)}</h2><button type="button" aria-label="Next month" className="moments-icon-button" disabled={atCurrentMonth} onClick={() => setViewDate((date) => new Date(date.getFullYear(), date.getMonth() + 1, 1))}><SkyIcon name="chevron-right" size={22} strokeWidth={2} /></button></div>{isLoading ? <MomentsSkeleton /> : null}{error ? <p className="auth-error" role="alert">{error}</p> : null}{!isLoading && !error ? <CalendarGrid year={year} month={month} moments={moments} photosByDay={photosByDay} onSelectDay={(date) => navigate(`/moments/day/${date}`)} /> : null}</main></div>;
}

export function SelectedDayPage(): JSX.Element {
  const api = useSkyNudgeApi();
  const { date } = useParams();
  const [moments, setMoments] = useState<SkyMoment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const dayMoments = moments.filter((moment) => localDateKey(moment.occurred_at) === date);

  useEffect(() => { void (async () => { try { setMoments(await api.getMyMoments()); } catch (caughtError) { setError(getErrorMessage(caughtError)); } finally { setIsLoading(false); } })(); }, [api]);

  return <div className="moments-day-page"><TopBar backTo="/moments/calendar" /><main className="moments-content"><p className="page-eyebrow">Selected day</p><h1 className="moments-day-page__title">{date ? new Intl.DateTimeFormat('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${date}T12:00:00`)) : 'Sky Moments'}</h1>{isLoading ? <MomentsSkeleton /> : null}{error ? <p className="auth-error" role="alert">{error}</p> : null}{!isLoading && !error && dayMoments.length === 0 ? <p className="moments-day-page__empty">No moments saved on this day.</p> : <section className="moments-feed" aria-label="Sky Moments on selected day">{dayMoments.map((moment) => <MomentEntry key={moment.id} moment={moment} />)}</section>}</main></div>;
}
export function AccountPage(): JSX.Element { return <AccountScreen />; }
export function SettingsPage(): JSX.Element { return <SettingsScreen />; }

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

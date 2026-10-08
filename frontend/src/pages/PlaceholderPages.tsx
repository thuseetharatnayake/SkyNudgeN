import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
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
import { AccountPage as AccountScreen, AnonymousName, SettingsPage as SettingsScreen, VerificationStatusPill } from '../components/account/AccountScreens';
import { RoutePlaceholder } from './RoutePlaceholder';
import { SaveNudgeButton } from '../components/moments/SaveNudgeButton';
import { momentsUpdatedEvent } from '../lib/momentUpdates';
import { showToast } from '../lib/toast';
import type { Category, Direction, Intensity, Nudge, RadiusKm, SkyMoment, SkyUser } from '../types/sky';

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
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [submissionError, setSubmissionError] = useState('');
  const [submittedAction, setSubmittedAction] = useState<'verify' | 'general' | null>(null);
  const [confirmationRequired, setConfirmationRequired] = useState(false);

  function validate(): boolean {
    const nextEmailError = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? '' : 'Enter a valid email address.';
    const nextPasswordError = password.length >= 8 ? '' : 'Use at least 8 characters.';
    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    return !nextEmailError && !nextPasswordError;
  }

  function friendlySignUpError(error: unknown): string {
    const message = error instanceof Error ? error.message.toLowerCase() : '';
    if (message.includes('already') || message.includes('registered') || message.includes('exists')) return 'An account already exists for this email. Try logging in instead.';
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) return 'We could not reach SkyNudge. Check your connection and try again.';
    return 'We could not create your account just now. Please try again.';
  }

  async function submit(action: 'verify' | 'general'): Promise<void> {
    if (submittedAction || !validate()) return;
    setSubmissionError('');
    setSubmittedAction(action);
    try {
      const result = await api.signUp(email.trim(), password);
      if (result.status === 'confirmation_required') {
        setConfirmationRequired(true);
        return;
      }
      await refreshAuth();
      if (action === 'verify') navigate('/verification', { state: { flow: 'create' } });
      else navigate('/welcome', { replace: true });
    } catch (caughtError) {
      setSubmissionError(friendlySignUpError(caughtError));
    } finally {
      setSubmittedAction(null);
    }
  }

  if (confirmationRequired) return <main className="create-account-page"><TopBar backTo="/login" /><div className="create-account-page__content create-account-page__confirmation"><div><h1>Check your email to confirm your account, then log in.</h1><p>We sent a confirmation link to your email address.</p></div><button className="create-account-button create-account-button--primary" type="button" onClick={() => navigate('/login', { replace: true })}>Back to log in</button></div></main>;

  return <main className="create-account-page"><TopBar backTo="/login" /><div className="create-account-page__content"><div className="create-account-page__intro"><h1>Create your account</h1><p>You will get an anonymous name. Nobody sees your real one.</p></div><form className="create-account-form" noValidate onSubmit={(event) => event.preventDefault()}><label className="create-account-field"><span>Email</span><input type="email" autoComplete="email" value={email} onChange={(event) => { setEmail(event.target.value); if (emailError) setEmailError(''); }} placeholder="you@example.com" aria-invalid={Boolean(emailError)} aria-describedby={emailError ? 'create-email-error' : undefined} />{emailError ? <small id="create-email-error" role="alert">{emailError}</small> : null}</label><label className="create-account-field"><span>Password</span><span className="create-account-password"><input type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={password} onChange={(event) => { setPassword(event.target.value); if (passwordError) setPasswordError(''); }} placeholder="At least 8 characters" aria-invalid={Boolean(passwordError)} aria-describedby={passwordError ? 'create-password-error' : undefined} /><button type="button" onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? 'Hide' : 'Show'}</button></span>{passwordError ? <small id="create-password-error" role="alert">{passwordError}</small> : null}</label></form>{submissionError ? <p className="create-account-error" role="alert">{submissionError}</p> : null}<hr className="create-account-divider" /><section className="create-account-options" aria-label="Account options"><h2>How would you like to continue?</h2><button className="create-account-button create-account-button--primary" type="button" onClick={() => void submit('verify')} disabled={submittedAction !== null}>{submittedAction === 'verify' ? 'Verifying account…' : 'Verify my account'}</button><button className="create-account-button create-account-button--outline" type="button" onClick={() => void submit('general')} disabled={submittedAction !== null}>{submittedAction === 'general' ? 'Creating account…' : 'Continue with a general account'}</button><p>Verification is optional. You can do it later from your account.</p></section></div></main>;
}

interface AuthPageProps { variant: 'login' | 'create'; eyebrow?: string; title: string; description: string; children: ReactNode; footer?: ReactNode; backTo?: string | -1; hideBack?: boolean; }
function AuthPage({ variant, eyebrow, title, description, children, footer, backTo, hideBack }: AuthPageProps): JSX.Element {
  const isLogin = variant === 'login';
  return <div className={`auth-page auth-page--${variant}`}>{isLogin ? <><svg className="auth-cloud auth-cloud--one" viewBox="0 0 180 62" aria-hidden="true"><path d="M12 50h150c12 0 18-7 18-16 0-10-8-18-18-18-3 0-6 1-9 2C147 8 137 2 125 2c-15 0-27 10-30 24-5-4-11-6-18-6-14 0-25 10-27 23h-2c-10 0-18 6-18 14 0 8 7 13 18 13Z" /></svg><svg className="auth-cloud auth-cloud--two" viewBox="0 0 180 62" aria-hidden="true"><path d="M12 50h150c12 0 18-7 18-16 0-10-8-18-18-18-3 0-6 1-9 2C147 8 137 2 125 2c-15 0-27 10-30 24-5-4-11-6-18-6-14 0-25 10-27 23h-2c-10 0-18 6-18 14 0 8 7 13 18 13Z" /></svg></> : null}{hideBack ? null : <TopBar backTo={backTo} />}<main className="auth-page__content"><div className={`auth-lockup${isLogin ? ' rise rise--one' : ''}`}><span className="auth-lockup__mark"><SkyIcon name="other" size={49} strokeWidth={1.65} /></span><span>SkyNudge</span></div><div className={`auth-heading${isLogin ? ' rise rise--two' : ''}`}>{eyebrow ? <p className="page-eyebrow">{eyebrow}</p> : null}<h1 className="page-title">{title}</h1><p className="page-copy">{description}</p></div><div className={`auth-card${isLogin ? ' rise rise--three' : ''}`}>{children}</div>{footer ? <div className={`auth-footer${isLogin ? ' rise rise--four' : ''}`}>{footer}</div> : null}</main></div>;
}

export function VerificationIntroPage(): JSX.Element {
  const api = useSkyNudgeApi();
  const navigate = useNavigate();
  const location = useLocation();
  const createdFromSignUp = (location.state as { flow?: string } | null)?.flow === 'create';
  const backTo = createdFromSignUp ? '/create-account' : '/account';
  const handleBack = createdFromSignUp ? () => navigate('/create-account', { state: { flow: 'create-return' } }) : undefined;
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

  if (isLoading) return <main className="verification-page"><TopBar backTo={backTo} onBack={handleBack} /><p className="page-copy">Loading your verification status…</p></main>;
  if (error) return <main className="verification-page"><TopBar backTo={backTo} onBack={handleBack} /><p className="auth-error" role="alert">{error}</p></main>;
  const status = profile?.verification_status ?? 'not_verified';
  if (status === 'pending' || status === 'verified' || status === 'rejected') return <VerificationStatusPage />;
  return <main className="verification-page"><TopBar backTo={backTo} onBack={handleBack} /><div className="verification-content"><div><p className="verification-eyebrow">Optional</p><h1>What verification means</h1></div><section className="verification-rows" aria-label="What verification means"><div className="verification-row"><span className="verification-tile"><SkyIcon name="shield" size={22} /></span><div><strong>An identity check</strong><p>We check your full legal name and phone number once to confirm you are a real person.</p></div></div><div className="verification-row"><span className="verification-tile"><SkyIcon name="lock" size={22} /></span><div><strong>Your details stay private</strong><p>Your name and number are never shown to anyone. You keep your anonymous username.</p></div></div><div className="verification-row"><span className="verification-tile"><SkyIcon name="check" size={22} strokeWidth={2.2} /></span><div><strong>A small check beside your name</strong><p>The badge only means the identity check was completed. It does not guarantee anyone&apos;s behaviour or that a SkyNudge is accurate.</p></div></div></section><div className="verification-actions"><button className="verification-primary-button" type="button" onClick={() => navigate('/verification/form')}>Continue</button><button className="verification-text-button" type="button" onClick={() => navigate(createdFromSignUp ? '/welcome' : '/account', { replace: createdFromSignUp })}>Not now</button></div></div></main>;
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
      showToast('Verification submitted. Status: Pending.');
      navigate('/verification/pending', { replace: true });
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return <main className="verification-page"><TopBar backTo="/verification" /><div className="verification-content verification-content--form"><div><h1>Verify your account</h1><p className="verification-subtitle">This takes a minute. Only our team sees these details.</p></div><form className="verification-form" onSubmit={submit} noValidate><label><span>Full legal name</span><input autoComplete="name" value={fullLegalName} onChange={(event) => setFullLegalName(event.target.value)} maxLength={200} placeholder="As shown on your ID" /></label><label><span>Phone number</span><input type="tel" autoComplete="tel" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} maxLength={50} placeholder="04xx xxx xxx" /></label><label className="verification-consent"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>I agree to SkyNudge checking my name and phone number to confirm my identity. This information is never shown publicly.</span></label>{error ? <p className="auth-error" role="alert">{error}</p> : null}<button className="verification-primary-button" type="submit" disabled={!canSubmit}>{isSubmitting ? 'Submitting…' : 'Submit verification'}</button></form></div></main>;
}

export function VerificationStatusPage(): JSX.Element {
  const api = useSkyNudgeApi();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<SkyUser | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const current = await api.getMyProfile();
        if (active) setProfile(current);
      } catch {
        if (active) setError('Unable to load your verification status. Please try again.');
      }
    })();
    return () => { active = false; };
  }, [api]);

  if (!profile) return <main className="verification-status-page"><div className="verification-status-page__content">{error ? <p className="auth-error" role="alert">{error}</p> : <p className="verification-status-page__loading">Loading verification status…</p>}</div></main>;

  const status = profile.verification_status;
  const content = status === 'verified'
    ? { title: 'Identity check completed.', subtitle: '' }
    : status === 'rejected'
      ? { title: 'Not approved.', subtitle: 'You can try again.' }
      : { title: 'We are reviewing your details.', subtitle: 'This usually takes a little while. You can use SkyNudge in the meantime. We will let you know when your check is complete.' };

  return <main className="verification-status-page"><div className="verification-status-page__content"><span className="verification-status-page__mark"><SkyIcon name="check" size={34} strokeWidth={2.2} /></span><section className="verification-status-page__intro"><p className="verification-eyebrow">Optional</p><h1>{content.title}</h1>{content.subtitle ? <p>{content.subtitle}</p> : null}</section><section className="verification-status-page__identity"><div><small>Others see you as</small><AnonymousName profile={profile} /></div><VerificationStatusPill status={status} /></section><p className="verification-status-page__note"><SkyIcon name="info" size={18} strokeWidth={1.8} /><span>Your real name and phone number stay private.</span></p><div className="verification-status-page__actions"><button className="verification-primary-button" type="button" onClick={() => navigate('/home')}>Go to Home</button>{status === 'rejected' ? <button className="verification-secondary-button" type="button" onClick={() => navigate('/verification/form')}>Try again</button> : null}<button className="verification-secondary-button" type="button" onClick={() => navigate('/account')}>View my account</button></div></div></main>;
}
export function WelcomePage(): JSX.Element {
  const api = useSkyNudgeApi();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<SkyUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadProfile(): Promise<void> {
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          const nextProfile = await api.getMyProfile();
          if (nextProfile) {
            if (active) setProfile(nextProfile);
            break;
          }
        } catch {
          // The profile trigger can complete shortly after authentication; retry calmly.
        }
        if (attempt < 2) await new Promise<void>((resolve) => { window.setTimeout(resolve, 500); });
      }
      if (active) setIsLoading(false);
    }
    void loadProfile();
    return () => { active = false; };
  }, [api]);

  return <main className="welcome-page"><div className="welcome-page__content"><span className="welcome-page__mark"><SkyIcon name="other" size={32} strokeWidth={1.8} /></span><div className="welcome-page__intro"><p>Welcome</p>{isLoading ? <span className="welcome-page__name-skeleton" aria-label="Loading your anonymous name" /> : <h1>{profile?.username ?? 'Your account is ready.'}</h1>}<p>That is the name other people see. Your real name stays private.</p></div>{profile?.verification_status === 'pending' ? <p className="welcome-page__note"><SkyIcon name="info" size={18} /><span>Your verification is pending. We will review your details.</span></p> : null}<button className="create-account-button create-account-button--primary" type="button" onClick={() => navigate('/home')}>See the sky near me</button></div></main>;
}
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
      navigate('/nudge/success', { replace: true, state: { nudge } });
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
export function NudgeSuccessPage(): JSX.Element {
  const location = useLocation();
  const navigate = useNavigate();
  const nudge = (location.state as { nudge?: Nudge } | null)?.nudge;

  if (!nudge) return <RoutePlaceholder eyebrow="Sent" title="Your SkyNudge is live." description="Open your active SkyNudge to save it privately." backTo="/home" />;

  return <div className="nudge-success"><TopBar backTo="/home" /><main className="screen-page"><div className="nudge-success__mark"><SkyIcon name="check" size={34} strokeWidth={2.2} /></div><div className="page-stack"><div><p className="page-eyebrow">Sent</p><h1 className="page-title">Your SkyNudge is live.</h1><p className="page-copy">People within {nudge.radius_km} km can see it for about 30 minutes.</p></div><div className="nudge-success__summary"><SkyIcon name={nudge.category} size={24} /><span><strong>{nudge.category}</strong><small>Look {nudge.direction}{nudge.landmark ? ` · ${nudge.landmark}` : ''}</small></span></div><p className="nudge-success__quote">Now put your phone down and look up.</p><div className="nudge-success__actions"><button className="sky-button sky-button--primary sky-button--full" type="button" onClick={() => navigate('/home')}>Back to Home</button><SaveNudgeButton nudge={nudge} /></div></div></main></div>;
}
function MomentsSkeleton(): JSX.Element { return <div className="moments-skeleton" aria-label="Loading Sky Moments"><i /><i /><i /></div>; }

export function MomentsFeedPage(): JSX.Element {
  const api = useSkyNudgeApi();
  const navigate = useNavigate();
  const [moments, setMoments] = useState<SkyMoment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadMoments = useCallback(async (): Promise<void> => { try { setMoments(await api.getMyMoments()); } catch (caughtError) { setError(getErrorMessage(caughtError)); } finally { setIsLoading(false); } }, [api]);
  useEffect(() => { void loadMoments(); window.addEventListener(momentsUpdatedEvent, loadMoments); return () => window.removeEventListener(momentsUpdatedEvent, loadMoments); }, [loadMoments]);

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

  const loadMoments = useCallback(async (): Promise<void> => { setIsLoading(true); setError(''); try { const [nextMoments, nextPhotos] = await Promise.all([api.getMyMoments(), api.getMomentPhotosForMonth(year, month)]); setMoments(nextMoments); setPhotosByDay(nextPhotos); } catch (caughtError) { setError(getErrorMessage(caughtError)); } finally { setIsLoading(false); } }, [api, month, year]);
  useEffect(() => { void loadMoments(); window.addEventListener(momentsUpdatedEvent, loadMoments); return () => window.removeEventListener(momentsUpdatedEvent, loadMoments); }, [loadMoments]);

  return <div className="moments-page"><TopBar backTo="/home" /><MomentsHeader /><main className="moments-content"><div className="moments-calendar__head"><button type="button" aria-label="Previous month" className="moments-icon-button" onClick={() => setViewDate((date) => new Date(date.getFullYear(), date.getMonth() - 1, 1))}><SkyIcon name="chevron-left" size={22} strokeWidth={2} /></button><h2>{new Intl.DateTimeFormat('en-AU', { month: 'long', year: 'numeric' }).format(viewDate)}</h2><button type="button" aria-label="Next month" className="moments-icon-button" disabled={atCurrentMonth} onClick={() => setViewDate((date) => new Date(date.getFullYear(), date.getMonth() + 1, 1))}><SkyIcon name="chevron-right" size={22} strokeWidth={2} /></button></div>{isLoading ? <MomentsSkeleton /> : null}{error ? <p className="auth-error" role="alert">{error}</p> : null}{!isLoading && !error ? <CalendarGrid year={year} month={month} moments={moments} photosByDay={photosByDay} onSelectDay={(date) => navigate(`/moments/day/${date}`)} /> : null}</main></div>;
}

export function SelectedDayPage(): JSX.Element {
  const api = useSkyNudgeApi();
  const { date } = useParams();
  const [moments, setMoments] = useState<SkyMoment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const dayMoments = moments.filter((moment) => localDateKey(moment.occurred_at) === date);

  const loadMoments = useCallback(async (): Promise<void> => { try { setMoments(await api.getMyMoments()); } catch (caughtError) { setError(getErrorMessage(caughtError)); } finally { setIsLoading(false); } }, [api]);
  useEffect(() => { void loadMoments(); window.addEventListener(momentsUpdatedEvent, loadMoments); return () => window.removeEventListener(momentsUpdatedEvent, loadMoments); }, [loadMoments]);

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

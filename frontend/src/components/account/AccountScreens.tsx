import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSkyNudgeApi } from '../../app/providers/useSkyNudgeApi';
import { useAuth } from '../../app/providers/useAuth';
import { usesMockApi } from '../../lib/supabase';
import type { RadiusKm, SkyUser, VerificationStatus } from '../../types/sky';
import { Segmented } from '../ui/Segmented';
import { SkyIcon } from '../ui/SkyIcon';
import { Toggle } from '../ui/Toggle';
import { VerifiedBadge } from '../ui/VerifiedBadge';
import { TopBar } from '../layout/TopBar';

const radii: RadiusKm[] = [2, 5, 10];

function verificationDetails(status: VerificationStatus): { label: string; subtitle: string; className: string } {
  switch (status) {
    case 'pending': return { label: 'Pending', subtitle: 'We are reviewing your details.', className: 'account-status--pending' };
    case 'verified': return { label: 'Verified', subtitle: 'Identity check completed.', className: 'account-status--verified' };
    case 'rejected': return { label: 'Not approved', subtitle: 'Not approved. You can try again.', className: 'account-status--rejected' };
    default: return { label: 'Not verified', subtitle: 'Not verified. Add the optional check.', className: 'account-status--not-verified' };
  }
}

export function AnonymousName({ profile }: { profile: Pick<SkyUser, 'username' | 'verification_status'> }): JSX.Element {
  return <p className="account-username">{profile.username}{profile.verification_status === 'verified' ? <VerifiedBadge /> : null}</p>;
}

export function VerificationStatusPill({ status }: { status: VerificationStatus }): JSX.Element {
  const verification = verificationDetails(status);
  return <span className={`account-status ${verification.className}`}>{verification.label}</span>;
}

interface AccountContentProps { profile: SkyUser; isSigningOut: boolean; onMoments: () => void; onVerification: () => void; onSettings: () => void; onSignOut: () => void; }
export function AccountContent({ profile, isSigningOut, onMoments, onVerification, onSettings, onSignOut }: AccountContentProps): JSX.Element {
  const verification = verificationDetails(profile.verification_status);
  return <main className="account-page"><TopBar backTo="/home" /><h1>Account</h1><section className="account-identity"><span className="account-avatar"><SkyIcon name="other" size={30} strokeWidth={2} /></span><div><AnonymousName profile={profile} /><VerificationStatusPill status={profile.verification_status} /></div></section>
    <section className="account-rows" aria-label="Account options">
      <button type="button" onClick={onMoments}><span className="account-tile"><SkyIcon name="archive" size={22} /></span><span><strong>My Sky Moments</strong><small>Your private archive</small></span><SkyIcon name="chevron-right" size={20} /></button>
      <button type="button" onClick={onVerification}><span className="account-tile"><SkyIcon name="shield" size={22} /></span><span><strong>Verification</strong><small>{verification.subtitle}</small></span><SkyIcon name="chevron-right" size={20} /></button>
      <button type="button" onClick={onSettings}><span className="account-tile"><SkyIcon name="settings" size={22} /></span><span><strong>Settings</strong><small>Location, alerts and privacy</small></span><SkyIcon name="chevron-right" size={20} /></button>
      <button type="button" disabled={isSigningOut} onClick={onSignOut}><span className="account-tile"><SkyIcon name="logout" size={22} /></span><span><strong>{isSigningOut ? 'Logging out…' : 'Log out'}</strong></span></button>
    </section><p className="account-privacy-note">Your real name and phone number never appear publicly.</p></main>;
}

export function AccountPage(): JSX.Element {
  const api = useSkyNudgeApi();
  const { refreshAuth } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<SkyUser | null>(null);
  const [error, setError] = useState('');
  const [isSigningOut, setIsSigningOut] = useState(false);
  useEffect(() => { void (async () => { try { setProfile(await api.getMyProfile()); } catch { setError('Unable to load your account. Please try again.'); } })(); }, [api]);
  async function signOut(): Promise<void> {
    setIsSigningOut(true); setError('');
    try { await api.signOut(); await refreshAuth(); navigate('/login', { replace: true }); } catch { setError('Unable to log out. Please try again.'); } finally { setIsSigningOut(false); }
  }
  if (!profile) return <main className="account-page"><TopBar backTo="/home" /><h1>Account</h1>{error ? <p className="account-inline-error" role="alert">{error}</p> : <div className="account-skeleton" aria-label="Loading account"><i /><i /><i /></div>}</main>;
  return <><AccountContent profile={profile} isSigningOut={isSigningOut} onMoments={() => navigate('/moments')} onVerification={() => navigate(profile.verification_status === 'not_verified' ? '/verification' : '/verification/pending')} onSettings={() => navigate('/settings')} onSignOut={() => void signOut()} />{error ? <p className="account-floating-error" role="alert">{error}</p> : null}</>;
}

interface DeleteAccountSheetProps { onCancel: () => void; onConfirm: () => Promise<void>; }
export function DeleteAccountSheet({ onCancel, onConfirm }: DeleteAccountSheetProps): JSX.Element {
  const [confirmation, setConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [failed, setFailed] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const confirmed = confirmation.trim().toUpperCase() === 'DELETE';
  useEffect(() => {
    cancelRef.current?.focus();
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape' && !isDeleting) { onCancel(); return; }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled])')];
      if (focusable.length === 0) return;
      const first = focusable[0]; const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isDeleting, onCancel]);
  async function deleteAccount(): Promise<void> {
    if (!confirmed || isDeleting) return;
    setIsDeleting(true); setFailed(false);
    try { await onConfirm(); } catch { setFailed(true); setIsDeleting(false); }
  }
  return <div className="delete-sheet-backdrop"><section ref={dialogRef} className="delete-sheet" role="dialog" aria-modal="true" aria-labelledby="delete-account-title"><h2 id="delete-account-title">Delete your account?</h2><p>This permanently deletes your profile, your private Sky Moments and photos, your nudges, your sightings, and any verification details. This cannot be undone.</p><label>Type DELETE to confirm<input value={confirmation} disabled={isDeleting} onChange={(event) => setConfirmation(event.target.value)} autoComplete="off" /></label>{failed ? <p className="delete-sheet__error" role="alert">Something went wrong. Nothing was deleted. Please try again.</p> : null}<div><button ref={cancelRef} className="account-text-button" type="button" disabled={isDeleting} onClick={onCancel}>Cancel</button><button className="delete-sheet__confirm" type="button" disabled={!confirmed || isDeleting} onClick={() => void deleteAccount()}>{isDeleting ? <><span className="delete-sheet__spinner" />Deleting account…</> : failed ? 'Retry delete' : 'Delete my account'}</button></div></section></div>;
}

interface SettingsContentProps { profile: SkyUser; isSaving: boolean; onUpdate: (next: { share_exact_location: boolean; nearby_alerts: boolean; default_radius_km: RadiusKm }) => void; onLogOut: () => void; onDelete: () => void; }
export function SettingsContent({ profile, isSaving, onUpdate, onLogOut, onDelete }: SettingsContentProps): JSX.Element {
  const [demoStatus, setDemoStatus] = useState<VerificationStatus>(profile.verification_status);
  const demoDetails = verificationDetails(demoStatus);
  const update = (values: Partial<Pick<SkyUser, 'share_exact_location' | 'nearby_alerts' | 'default_radius_km'>>): void => onUpdate({ share_exact_location: values.share_exact_location ?? profile.share_exact_location, nearby_alerts: values.nearby_alerts ?? profile.nearby_alerts, default_radius_km: values.default_radius_km ?? profile.default_radius_km });
  return <main className="settings-page"><TopBar backTo="/account" /><h1>Settings</h1><section><p>Privacy</p><div className="settings-choice"><div><strong id="share-location-label">Share exact location</strong><small>Off by default. You choose each time you nudge.</small></div><Toggle checked={profile.share_exact_location} onChange={(checked) => update({ share_exact_location: checked })} label="Share exact location" labelledBy="share-location-label" disabled={isSaving} /></div></section><hr /><section><p>Nearby</p><div className="settings-choice"><div><strong id="nearby-alerts-label">Nearby SkyNudge alerts</strong><small>A quiet nudge when something is happening close by.</small></div><Toggle checked={profile.nearby_alerts} onChange={(checked) => update({ nearby_alerts: checked })} label="Nearby SkyNudge alerts" labelledBy="nearby-alerts-label" disabled={isSaving} /></div><div className="settings-radius"><span>Default radius</span><Segmented options={radii.map((value) => ({ value, label: `${value} km` }))} value={profile.default_radius_km} onChange={(value) => update({ default_radius_km: value })} label="Default radius" disabled={isSaving} /></div></section><hr /><section className="settings-account"><p>Account</p><button className="account-outline-button" type="button" disabled={isSaving} onClick={onLogOut}>Log out</button>{usesMockApi ? <div className="settings-demo-box"><b>DEMO ONLY</b><small>Preview how each verification state looks across the app.</small><p aria-live="polite">Preview: <strong>{demoDetails.label}</strong> — {demoDetails.subtitle}</p><Segmented options={[{ value: 'not_verified' as const, label: 'Not verified' }, { value: 'pending' as const, label: 'Pending' }, { value: 'verified' as const, label: 'Verified' }, { value: 'rejected' as const, label: 'Rejected' }]} value={demoStatus} onChange={setDemoStatus} label="Demo verification status" /></div> : null}</section><hr /><section className="settings-danger"><p>Danger zone</p><button className="account-delete-button" type="button" disabled={isSaving} onClick={onDelete}>Delete account</button></section></main>;
}

export function SettingsPage(): JSX.Element {
  const api = useSkyNudgeApi();
  const { refreshAuth } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<SkyUser | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { void (async () => { try { const current = await api.getMyProfile(); if (!current) throw new Error(); setProfile(current); } catch { setError('Unable to load your settings. Please try again.'); } })(); }, [api]);
  async function update(next: { share_exact_location: boolean; nearby_alerts: boolean; default_radius_km: RadiusKm }): Promise<void> {
    if (!profile || isSaving) return;
    const previous = profile; setProfile({ ...profile, ...next }); setIsSaving(true); setError('');
    try { setProfile(await api.updateMySettings(next)); } catch { setProfile(previous); setError('Unable to save your settings. Please try again.'); } finally { setIsSaving(false); }
  }
  async function logOut(): Promise<void> { setIsSaving(true); try { await api.signOut(); await refreshAuth(); navigate('/login', { replace: true }); } catch { setError('Unable to log out. Please try again.'); setIsSaving(false); } }
  async function deleteAccount(): Promise<void> { if (isDeleting) return; setIsDeleting(true); await api.deleteMyAccount(); await refreshAuth(); navigate('/login', { replace: true, state: { message: 'Your account has been deleted.' } }); }
  if (!profile) return <main className="settings-page"><TopBar backTo="/account" /><h1>Settings</h1>{error ? <p className="account-inline-error" role="alert">{error}</p> : <div className="account-skeleton" aria-label="Loading settings"><i /><i /><i /></div>}</main>;
  return <><SettingsContent profile={profile} isSaving={isSaving} onUpdate={(next) => void update(next)} onLogOut={() => void logOut()} onDelete={() => setShowDelete(true)} />{error ? <p className="account-floating-error" role="alert">{error}</p> : null}{showDelete ? <DeleteAccountSheet onCancel={() => !isDeleting && setShowDelete(false)} onConfirm={deleteAccount} /> : null}</>;
}
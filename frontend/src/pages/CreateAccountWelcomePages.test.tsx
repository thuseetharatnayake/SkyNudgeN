import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiContext } from '../app/providers/apiContext';
import { AuthContext } from '../app/providers/authContext';
import type { SkyNudgeApi } from '../data';
import type { SkyUser, VerificationStatus } from '../types/sky';
import { CreateAccountPage, WelcomePage } from './PlaceholderPages';

const profile: SkyUser = { id: 'user-1', username: 'OpalSky534', email: 'opal@example.com', verification_status: 'not_verified', share_exact_location: false, nearby_alerts: true, default_radius_km: 5 };

function Location(): JSX.Element { return <p data-testid="location">{useLocation().pathname}</p>; }

function renderCreateAccount(api: SkyNudgeApi): void {
  const refreshAuth = vi.fn().mockResolvedValue(undefined);
  render(<MemoryRouter initialEntries={['/create-account']}><ApiContext.Provider value={api}><AuthContext.Provider value={{ isAuthenticated: false, isLoading: false, refreshAuth }}><Routes><Route path="/create-account" element={<CreateAccountPage />} /><Route path="/verification" element={<><p>Verification intro</p><Location /></>} /><Route path="/welcome" element={<><p>Welcome screen</p><Location /></>} /></Routes></AuthContext.Provider></ApiContext.Provider></MemoryRouter>);
}

function renderWelcome(getMyProfile: SkyNudgeApi['getMyProfile']): void {
  const api = { getMyProfile } as unknown as SkyNudgeApi;
  render(<MemoryRouter initialEntries={['/welcome']}><ApiContext.Provider value={api}><Routes><Route path="/welcome" element={<WelcomePage />} /><Route path="/home" element={<><p>Home screen</p><Location /></>} /></Routes></ApiContext.Provider></MemoryRouter>);
}

function fillValidCredentials(): void {
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'opal@example.com' } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'eightchars' } });
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('CreateAccountPage', () => {
  it('shows inline validation errors and does not sign up invalid credentials', () => {
    const signUp = vi.fn();
    renderCreateAccount({ signUp } as unknown as SkyNudgeApi);

    fireEvent.click(screen.getByRole('button', { name: 'Verify my account' }));

    expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument();
    expect(screen.getByText('Use at least 8 characters.')).toBeInTheDocument();
    expect(signUp).not.toHaveBeenCalled();
  });

  it.each([
    ['Verify my account', '/verification', 'Verification intro'],
    ['Continue with a general account', '/welcome', 'Welcome screen'],
  ])('calls signUp once and navigates to %s destination', async (buttonName, path, destination) => {
    const signUp = vi.fn().mockResolvedValue({ status: 'session', user: profile });
    renderCreateAccount({ signUp } as unknown as SkyNudgeApi);

    fillValidCredentials();
    fireEvent.click(screen.getByRole('button', { name: buttonName }));

    await waitFor(() => expect(signUp).toHaveBeenCalledOnce());
    expect(signUp).toHaveBeenCalledWith('opal@example.com', 'eightchars');
    expect(await screen.findByText(destination)).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent(path);
  });

  it('shows the calm confirmation screen when email confirmation is required', async () => {
    const signUp = vi.fn().mockResolvedValue({ status: 'confirmation_required' });
    renderCreateAccount({ signUp } as unknown as SkyNudgeApi);

    fillValidCredentials();
    fireEvent.click(screen.getByRole('button', { name: 'Continue with a general account' }));

    expect(await screen.findByRole('heading', { name: 'Check your email to confirm your account, then log in.' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back to log in' })).toBeInTheDocument();
  });
});

describe('WelcomePage', () => {
  it('shows the profile username, has no back button, and navigates home', async () => {
    renderWelcome(vi.fn().mockResolvedValue(profile));

    expect(await screen.findByRole('heading', { name: 'OpalSky534' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Back' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'See the sky near me' }));
    expect(await screen.findByText('Home screen')).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('/home');
  });

  it.each([
    ['pending', true],
    ['not_verified', false],
  ] as const)('shows the pending note only for %s profiles', async (status: VerificationStatus, showsNote) => {
    renderWelcome(vi.fn().mockResolvedValue({ ...profile, verification_status: status }));

    await screen.findByRole('heading', { name: 'OpalSky534' });
    const note = screen.queryByText('Your verification is pending. We will review your details.');
    if (showsNote) expect(note).toBeInTheDocument();
    else expect(note).not.toBeInTheDocument();
  });

  it('retries the profile fetch before displaying the fallback', async () => {
    vi.useFakeTimers();
    const getMyProfile = vi.fn().mockResolvedValue(null);
    renderWelcome(getMyProfile);

    expect(screen.getByLabelText('Loading your anonymous name')).toBeInTheDocument();
    await vi.runAllTimersAsync();

    expect(getMyProfile).toHaveBeenCalledTimes(3);
    expect(screen.getByRole('heading', { name: 'Your account is ready.' })).toBeInTheDocument();
  });
});
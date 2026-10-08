import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiContext } from '../app/providers/apiContext';
import { AuthContext } from '../app/providers/authContext';
import type { SkyNudgeApi } from '../data';
import type { SkyUser, VerificationStatus } from '../types/sky';
import { VerificationFormPage, VerificationIntroPage } from './PlaceholderPages';

const baseProfile: SkyUser = { id: 'user-1', username: 'CloudDrifter482', email: 'cloud@example.com', verification_status: 'not_verified', share_exact_location: false, nearby_alerts: true, default_radius_km: 5 };

function renderIntro(status: VerificationStatus): void {
  const api = { getMyProfile: vi.fn().mockResolvedValue({ ...baseProfile, verification_status: status }) } as unknown as SkyNudgeApi;
  render(<MemoryRouter><ApiContext.Provider value={api}><VerificationIntroPage /></ApiContext.Provider></MemoryRouter>);
}

afterEach(cleanup);

describe('verification pages', () => {
  it('replaces the old intro with the requested explanation and actions', async () => {
    renderIntro('not_verified');
    expect(await screen.findByRole('heading', { name: 'What verification means' })).toBeInTheDocument();
    expect(screen.getByText('An identity check')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Not now' })).toBeInTheDocument();
    expect(screen.queryByText(`A quieter way to know ${'who is nearby.'}`)).not.toBeInTheDocument();
    expect(screen.queryByText(`Start ${'verification'}`)).not.toBeInTheDocument();
  });

  it.each([
    ['pending', 'We are reviewing your details.'],
    ['verified', 'You are verified.'],
    ['rejected', 'We could not verify you this time.'],
  ] as const)('shows the %s verification status message', async (status, message) => {
    renderIntro(status);
    expect(await screen.findByRole('heading', { name: message })).toBeInTheDocument();
    if (status === 'rejected') expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('enables submission only after valid details and consent, then sends the existing payload', async () => {
    const submitVerification = vi.fn().mockResolvedValue({ ...baseProfile, verification_status: 'pending' });
    const api = { submitVerification } as unknown as SkyNudgeApi;
    const refreshAuth = vi.fn().mockResolvedValue(undefined);
    render(<MemoryRouter><ApiContext.Provider value={api}><AuthContext.Provider value={{ isAuthenticated: true, isLoading: false, refreshAuth }}><VerificationFormPage /></AuthContext.Provider></ApiContext.Provider></MemoryRouter>);

    const submit = screen.getByRole('button', { name: 'Submit verification' });
    expect(submit).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Full legal name'), { target: { value: 'Taylor Sky' } });
    fireEvent.change(screen.getByLabelText('Phone number'), { target: { value: '0412 345 678' } });
    expect(submit).toBeDisabled();
    fireEvent.click(screen.getByRole('checkbox'));
    expect(submit).toBeEnabled();
    fireEvent.click(submit);
    await waitFor(() => expect(submitVerification).toHaveBeenCalledWith({ full_legal_name: 'Taylor Sky', phone_number: '0412 345 678', consent: true }));
  });
});
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AccountContent, DeleteAccountSheet, SettingsContent } from './AccountScreens';
import type { SkyUser } from '../../types/sky';

const profile: SkyUser = { id: 'user-1', username: 'CloudDrifter482', email: 'cloud@example.com', verification_status: 'not_verified', share_exact_location: false, nearby_alerts: true, default_radius_km: 5 };

afterEach(cleanup);

describe('account screens', () => {
  it('maps verification status to the account summary', () => {
    render(<MemoryRouter><AccountContent profile={{ ...profile, verification_status: 'rejected' }} isSigningOut={false} onMoments={vi.fn()} onVerification={vi.fn()} onSettings={vi.fn()} onSignOut={vi.fn()} /></MemoryRouter>);
    expect(screen.getByText('Not approved')).toBeInTheDocument();
    expect(screen.getByText('Not approved. You can try again.')).toBeInTheDocument();
  });

  it('persists a changed preference through the settings callback', () => {
    const onUpdate = vi.fn();
    render(<MemoryRouter><SettingsContent profile={profile} isSaving={false} onUpdate={onUpdate} onLogOut={vi.fn()} onDelete={vi.fn()} /></MemoryRouter>);
    fireEvent.click(screen.getByRole('switch', { name: 'Share exact location' }));
    expect(onUpdate).toHaveBeenCalledWith({ share_exact_location: true, nearby_alerts: true, default_radius_km: 5 });
  });

  it('requires DELETE and exposes a retry-safe error when account deletion fails', async () => {
    const onConfirm = vi.fn().mockRejectedValueOnce(new Error('network'));
    render(<DeleteAccountSheet onCancel={vi.fn()} onConfirm={onConfirm} />);
    const deleteButton = screen.getByRole('button', { name: 'Delete my account' });
    expect(deleteButton).toBeDisabled();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'delete' } });
    fireEvent.click(deleteButton);
    await waitFor(() => expect(onConfirm).toHaveBeenCalledOnce());
    expect(screen.getByRole('alert')).toHaveTextContent('Nothing was deleted');
    expect(screen.getByRole('button', { name: 'Retry delete' })).toBeEnabled();
  });
});
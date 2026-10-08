import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiContext } from '../../app/providers/apiContext';
import type { SkyNudgeApi } from '../../data';
import { momentsUpdatedEvent } from '../../lib/momentUpdates';
import type { Nudge, SkyMoment } from '../../types/sky';
import { SaveNudgeButton } from './SaveNudgeButton';

const nudge = (overrides: Partial<Nudge> = {}): Nudge => ({
  id: 'nudge-1', category: 'sunset', intensity: 'wow', direction: 'west', radius_km: 5, landmark: 'Brighton Beach', coordinates: { lat: -37.9, lng: 144.9 }, created_at: new Date(Date.now() - 60_000).toISOString(), expires_at: new Date(Date.now() + 20 * 60_000).toISOString(), poster: { id: 'user-1', username: 'Sky', verification_status: 'verified' }, watcher_count: 1, confirmed_by_me: true, photo_url: null, note: '', ...overrides,
});
const moment: SkyMoment = { id: 'moment-1', category: 'sunset', occurred_at: new Date().toISOString(), location_label: 'Brighton Beach', direction: 'west', landmark: 'Brighton Beach', notes: '', photo_urls: [] };
function api(overrides: Partial<SkyNudgeApi> = {}): SkyNudgeApi {
  return { saveNudgeAsMoment: vi.fn().mockResolvedValue(moment), getMyMoments: vi.fn().mockResolvedValue([moment]), ...overrides } as unknown as SkyNudgeApi;
}
function renderButton(client: SkyNudgeApi, item = nudge()): void { render(<ApiContext.Provider value={client}><SaveNudgeButton nudge={item} /></ApiContext.Provider>); }

afterEach(cleanup);

describe('SaveNudgeButton', () => {
  it('calls the save API once, refetches moments, and shows the saved state', async () => {
    const client = api();
    const refetch = vi.fn();
    window.addEventListener(momentsUpdatedEvent, refetch);
    renderButton(client);
    fireEvent.click(screen.getByRole('button', { name: 'Save to My Sky Moments' }));
    await waitFor(() => expect(client.saveNudgeAsMoment).toHaveBeenCalledTimes(1));
    expect(client.saveNudgeAsMoment).toHaveBeenCalledWith('nudge-1');
    await waitFor(() => expect(client.getMyMoments).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(refetch).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('button', { name: 'Saved privately' })).toBeDisabled();
    window.removeEventListener(momentsUpdatedEvent, refetch);
  });

  it('keeps the button enabled and shows a retryable error when saving fails', async () => {
    const client = api({ saveNudgeAsMoment: vi.fn().mockRejectedValue(new Error('database unavailable')) });
    renderButton(client);
    fireEvent.click(screen.getByRole('button', { name: 'Save to My Sky Moments' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not save. Please try again.');
    expect(screen.getByRole('button', { name: 'Save to My Sky Moments' })).toBeEnabled();
    expect(client.saveNudgeAsMoment).toHaveBeenCalledTimes(1);
  });

  it('shows the ended message instead of a save action for an expired SkyNudge', () => {
    renderButton(api(), nudge({ expires_at: new Date(Date.now() - 1_000).toISOString() }));
    expect(screen.getByText("This SkyNudge has ended, so it can't be saved.")).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save to My Sky Moments' })).not.toBeInTheDocument();
  });
});
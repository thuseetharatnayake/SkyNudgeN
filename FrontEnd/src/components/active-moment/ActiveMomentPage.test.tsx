import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ActiveMomentContent } from './ActiveMomentPage';
import { clampMinutes, peopleText, progressPercent } from './activeMomentHelpers';
import type { Nudge } from '../../types/sky';

const createNudge = (overrides: Partial<Nudge> = {}): Nudge => ({
  id: 'nudge-1', category: 'sunset', intensity: 'look_now', direction: 'west', radius_km: 5, landmark: 'Brighton Beach', coordinates: { lat: -37.92, lng: 144.99 }, created_at: new Date(Date.now() - 4 * 60_000).toISOString(), expires_at: new Date(Date.now() + 25 * 60_000).toISOString(), poster: { id: 'poster-1', username: 'HarbourGlow219', verification_status: 'verified' }, watcher_count: 7, seen_count: 7, confirmed_by_me: false, i_can_see_it: false, photo_url: 'https://images.example.com/sky.jpg', note: 'The horizon is glowing peach and violet right now.', username: 'HarbourGlow219', verified: true, distance_km: 4.6, place_name: 'Brighton Beach', ...overrides,
});

function props(nudge = createNudge()) { return { nudge, currentUserId: 'viewer-1', onBack: vi.fn(), onCreate: vi.fn(), onConfirm: vi.fn().mockResolvedValue(undefined), onReport: vi.fn().mockResolvedValue(undefined), onBlock: vi.fn().mockResolvedValue(undefined) }; }
function ConfirmingHarness(): JSX.Element {
  const [nudge, setNudge] = useState(createNudge());
  return <ActiveMomentContent {...props(nudge)} onConfirm={async (current) => setNudge({ ...current, confirmed_by_me: true, i_can_see_it: true, watcher_count: current.watcher_count + 1, seen_count: (current.seen_count ?? current.watcher_count) + 1 })} />;
}

afterEach(cleanup);

describe('ActiveMomentContent', () => {
  it('renders a photo and look chip when photo_url exists', () => {
    render(<ActiveMomentContent {...props()} />);
    expect(screen.getByLabelText('Photo shared by HarbourGlow219')).toBeInTheDocument();
    expect(screen.getByText('Look west')).toBeInTheDocument();
  });
  it('renders the compass panel when there is no photo and after an image error', () => {
    const { rerender } = render(<ActiveMomentContent {...props(createNudge({ photo_url: null }))} />);
    expect(screen.getByLabelText('Look west')).toBeInTheDocument();
    rerender(<ActiveMomentContent {...props()} />);
    fireEvent.error(screen.getByLabelText('Photo shared by HarbourGlow219').querySelector('img')!);
    expect(screen.getByLabelText('Look west')).toBeInTheDocument();
    expect(screen.queryByLabelText('Photo shared by HarbourGlow219')).not.toBeInTheDocument();
  });
  it('calculates and clamps time progress', () => {
    expect(progressPercent(25)).toBe(83);
    expect(clampMinutes(-1)).toBe(0);
    expect(clampMinutes(40)).toBe(30);
    expect(progressPercent(40)).toBe(100);
  });
  it('uses singular and plural person labels', () => { expect(peopleText(1)).toBe('1 person'); expect(peopleText(7)).toBe('7 people'); });
  it('changes to the confirmed state and increments the count after a sighting', async () => {
    render(<ConfirmingHarness />);
    fireEvent.click(screen.getByRole('button', { name: 'I can see it too' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'You can see it too' })).toBeDisabled());
    expect(screen.getByText('8 people')).toBeInTheDocument();
  });
  it('hides block and sighting actions for the current user’s nudge', () => {
    render(<ActiveMomentContent {...props(createNudge({ poster: { id: 'viewer-1', username: 'CloudDrifter482', verification_status: 'verified' } }))} />);
    expect(screen.getByText('This is your SkyNudge')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'I can see it too' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'More SkyNudge actions' })).not.toBeInTheDocument();
  });
});
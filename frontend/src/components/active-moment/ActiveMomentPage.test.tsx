import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ActiveMomentContent } from './ActiveMomentPage';
import { clampMinutes, peopleText, progressPercent } from './activeMomentHelpers';
import { ApiContext } from '../../app/providers/apiContext';
import type { SkyNudgeApi } from '../../data';
import type { Nudge, SkyMoment } from '../../types/sky';

const createNudge = (overrides: Partial<Nudge> = {}): Nudge => ({
  id: 'nudge-1', category: 'sunset', intensity: 'look_now', direction: 'west', radius_km: 5, landmark: 'Brighton Beach', coordinates: { lat: -37.92, lng: 144.99 }, created_at: new Date(Date.now() - 4 * 60_000).toISOString(), expires_at: new Date(Date.now() + 25 * 60_000).toISOString(), poster: { id: 'poster-1', username: 'HarbourGlow219', verification_status: 'verified' }, watcher_count: 7, seen_count: 7, confirmed_by_me: false, i_can_see_it: false, photo_url: 'https://images.example.com/sky.jpg', note: 'The horizon is glowing peach and violet right now.', username: 'HarbourGlow219', verified: true, distance_km: 4.6, place_name: 'Brighton Beach', ...overrides,
});

function props(nudge = createNudge()) { return { nudge, currentUserId: 'viewer-1', onCreate: vi.fn(), onConfirm: vi.fn().mockResolvedValue(undefined), onReport: vi.fn().mockResolvedValue(undefined), onBlock: vi.fn().mockResolvedValue(undefined) }; }
const moment: SkyMoment = { id: 'moment-1', category: 'sunset', occurred_at: new Date().toISOString(), location_label: 'Brighton Beach', direction: 'west', landmark: 'Brighton Beach', notes: '', photo_urls: [] };
const api = { saveNudgeAsMoment: vi.fn().mockResolvedValue(moment), getMyMoments: vi.fn().mockResolvedValue([moment]) } as unknown as SkyNudgeApi;
function renderContent(content: JSX.Element): void { render(<ApiContext.Provider value={api}><MemoryRouter>{content}</MemoryRouter></ApiContext.Provider>); }
function ConfirmingHarness(): JSX.Element {
  const [nudge, setNudge] = useState(createNudge());
  return <ActiveMomentContent {...props(nudge)} onConfirm={async (current) => setNudge({ ...current, confirmed_by_me: true, i_can_see_it: true, watcher_count: current.watcher_count + 1, seen_count: (current.seen_count ?? current.watcher_count) + 1 })} />;
}

afterEach(cleanup);

describe('ActiveMomentContent', () => {
  it('renders a photo and look chip when photo_url exists', () => {
    renderContent(<ActiveMomentContent {...props()} />);
    expect(screen.getByLabelText('Photo shared by HarbourGlow219')).toBeInTheDocument();
    expect(screen.getByText('Look west')).toBeInTheDocument();
  });
  it('renders the compass panel when there is no photo and after an image error', () => {
    const { rerender } = render(<ApiContext.Provider value={api}><MemoryRouter><ActiveMomentContent {...props(createNudge({ photo_url: null }))} /></MemoryRouter></ApiContext.Provider>);
    expect(screen.getByLabelText('Look west')).toBeInTheDocument();
    rerender(<ApiContext.Provider value={api}><MemoryRouter><ActiveMomentContent {...props()} /></MemoryRouter></ApiContext.Provider>);
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
    renderContent(<ConfirmingHarness />);
    fireEvent.click(screen.getByRole('button', { name: 'I can see it too' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'You can see it too' })).toBeDisabled());
    expect(screen.getByText('8 people')).toBeInTheDocument();
  });
  it('hides block and sighting actions for the current user’s nudge', () => {
    renderContent(<ActiveMomentContent {...props(createNudge({ poster: { id: 'viewer-1', username: 'CloudDrifter482', verification_status: 'verified' } }))} />);
    expect(screen.getByText('This is your SkyNudge')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'I can see it too' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'More SkyNudge actions' })).not.toBeInTheDocument();
  });
  it('allows saving the current user’s active SkyNudge', () => {
    renderContent(<ActiveMomentContent {...props(createNudge({ poster: { id: 'viewer-1', username: 'CloudDrifter482', verification_status: 'verified' } }))} />);
    expect(screen.getByRole('button', { name: 'Save to My Sky Moments' })).toBeInTheDocument();
  });
  it('does not allow saving another person’s SkyNudge until it is confirmed', () => {
    renderContent(<ActiveMomentContent {...props()} />);
    expect(screen.queryByRole('button', { name: 'Save to My Sky Moments' })).not.toBeInTheDocument();
  });
});
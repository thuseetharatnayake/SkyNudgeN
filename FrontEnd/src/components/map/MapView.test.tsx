import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MapPinContent } from './MapView';
import type { Nudge } from '../../types/sky';

const nudge: Nudge = { id: 'nudge-1', category: 'sunset', intensity: 'look_now', direction: 'west', radius_km: 5, landmark: null, coordinates: { lat: -37.81, lng: 144.96 }, created_at: new Date().toISOString(), poster: { id: 'poster', username: 'Sky', verification_status: 'verified' }, watcher_count: 12, confirmed_by_me: false, photo_url: null, note: '' };

describe('MapPinContent', () => {
  it('shows its count badge and only applies the halo class for look-now nudges', () => {
    const { rerender } = render(<MapPinContent nudge={nudge} isMine={false} />);
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByLabelText('Sunset, 12 can see it')).toHaveClass('map-pin--hot');
    rerender(<MapPinContent nudge={{ ...nudge, intensity: 'wow' }} isMine={false} />);
    expect(screen.getByLabelText('Sunset, 12 can see it')).not.toHaveClass('map-pin--hot');
  });
});
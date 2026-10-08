import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HomeScreen } from './HomeScreen';

vi.mock('../map/MapView', () => ({ MapView: () => <div role="group" aria-label="Map of active SkyNudges near you" /> }));

describe('HomeScreen', () => {
  it('keeps the create button when the nearby list is empty', () => {
    render(<HomeScreen nudges={[]} profile={null} location={{ lat: -37.81, lng: 144.96 }} hasLocation isLoading={false} error="" onAccount={vi.fn()} onCreate={vi.fn()} onOpenNudge={vi.fn()} onEnableLocation={vi.fn()} onRetry={vi.fn()} />);
    expect(screen.getByText('No SkyNudges nearby right now. Be the first to share what you see.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Nudge the Sky' })).toBeInTheDocument();
  });
});
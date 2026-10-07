import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { MomentEntry } from './MomentEntry';
import type { SkyMoment } from '../../types/sky';

const baseMoment: SkyMoment = { id: 'm1', category: 'moon', occurred_at: '2026-10-06T21:10:00+11:00', location_label: 'Williamstown Beach', direction: 'east', landmark: 'Gem Pier', notes: 'Clear and bright.', photo_urls: [] };

describe('MomentEntry', () => {
  afterEach(cleanup);

  it('shows the demo label for generated images but not real URLs', () => {
    const { rerender } = render(<MomentEntry moment={baseMoment} />);
    expect(screen.getByText('DEMO PHOTO')).toBeInTheDocument();
    rerender(<MomentEntry moment={{ ...baseMoment, photo_urls: ['https://images.example.com/moon.jpg'] }} />);
    expect(screen.queryByText('DEMO PHOTO')).not.toBeInTheDocument();
  });

  it('changes the hero image when a thumbnail is clicked', () => {
    const { getByAltText, getByRole } = render(<MomentEntry moment={{ ...baseMoment, photo_urls: ['https://images.example.com/one.jpg', 'https://images.example.com/two.jpg'] }} />);
    const hero = getByAltText('Moon at Williamstown Beach') as HTMLImageElement;
    expect(hero.src).toContain('/one.jpg');
    fireEvent.click(getByRole('button', { name: 'Show photo 2' }));
    expect(hero.src).toContain('/two.jpg');
  });
});

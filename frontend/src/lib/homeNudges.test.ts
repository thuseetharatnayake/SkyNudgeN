import { describe, expect, it } from 'vitest';
import { relativeNudgeTime, sortActiveNudges } from './homeNudges';
import type { Nudge } from '../types/sky';

const now = new Date('2026-10-08T12:00:00.000Z').getTime();
const nudge = (id: string, intensity: Nudge['intensity'], minutes: number): Nudge => ({ id, category: 'sunset', intensity, direction: 'west', radius_km: 5, landmark: null, coordinates: { lat: -37.81, lng: 144.96 }, created_at: new Date(now - minutes * 60_000).toISOString(), poster: { id: 'poster', username: 'Sky', verification_status: 'not_verified' }, watcher_count: 2, confirmed_by_me: false, photo_url: null, note: '' });

describe('Home nudge helpers', () => {
  it('sorts look-now nudges first then newest first', () => {
    expect(sortActiveNudges([nudge('beautiful', 'beautiful', 1), nudge('look-old', 'look_now', 8), nudge('look-new', 'look_now', 3), nudge('wow', 'wow', 2)], now).map((item) => item.id)).toEqual(['look-new', 'look-old', 'wow', 'beautiful']);
  });

  it('formats relative nudge time and hides expired nudges', () => {
    expect(relativeNudgeTime(nudge('now', 'wow', 0).created_at, now)).toBe('just now');
    expect(relativeNudgeTime(nudge('four', 'wow', 4).created_at, now)).toBe('4 min ago');
    expect(relativeNudgeTime(nudge('expired', 'wow', 30).created_at, now)).toBeNull();
  });
});
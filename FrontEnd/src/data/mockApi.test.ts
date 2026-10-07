import { describe, expect, it } from 'vitest';
import { MockSkyNudgeApi } from './mockApi';

describe('MockSkyNudgeApi', () => {
  it('returns eight active nearby nudges with the backend enum values', async () => {
    const api = new MockSkyNudgeApi();
    const nudges = await api.getNearbyNudges(-37.8136, 144.9631);

    expect(nudges).toHaveLength(8);
    expect(nudges[0]).toMatchObject({ category: 'sunset', intensity: 'look_now', direction: 'west', radius_km: 5 });
  });
});
import { describe, expect, it } from 'vitest';
import { MockSkyNudgeApi } from './mockApi';

describe('MockSkyNudgeApi', () => {
  it('returns eight active nearby nudges with the backend enum values', async () => {
    const api = new MockSkyNudgeApi();
    const nudges = await api.getNearbyNudges(-37.8136, 144.9631);

    expect(nudges).toHaveLength(8);
    expect(nudges[0]).toMatchObject({ category: 'sunset', intensity: 'look_now', direction: 'west', radius_km: 5 });
  });

  it('persists settings and uses the saved profile values', async () => {
    const api = new MockSkyNudgeApi();

    await api.updateMySettings({ share_exact_location: true, nearby_alerts: false, default_radius_km: 10 });

    await expect(api.getMyProfile()).resolves.toMatchObject({ share_exact_location: true, nearby_alerts: false, default_radius_km: 10 });
  });

  it('hides a blocked poster from nearby results and direct lookups', async () => {
    const api = new MockSkyNudgeApi();

    await api.blockUser('person-1');

    await expect(api.getNearbyNudges(-37.8136, 144.9631)).resolves.toHaveLength(7);
    await expect(api.getNudge('nudge-1')).resolves.toBeNull();
  });
});
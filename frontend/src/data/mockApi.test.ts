import { describe, expect, it } from 'vitest';
import { MockSkyNudgeApi } from './mockApi';

describe('MockSkyNudgeApi', () => {
  it('returns five active nearby nudges with the backend enum values', async () => {
    const api = new MockSkyNudgeApi();
    const nudges = await api.getNearbyNudges(-37.8136, 144.9631);

    expect(nudges).toHaveLength(5);
    expect(nudges[0]).toMatchObject({ category: 'sunset', intensity: 'look_now', direction: 'west', radius_km: 5 });
  });

  it('persists settings and uses the saved profile values', async () => {
    const api = new MockSkyNudgeApi();

    await api.updateMySettings({ share_exact_location: true, nearby_alerts: false, default_radius_km: 10 });

    await expect(api.getMyProfile()).resolves.toMatchObject({ share_exact_location: true, nearby_alerts: false, default_radius_km: 10 });
  });

  it('clears mock account state when the account is deleted', async () => {
    const api = new MockSkyNudgeApi();

    await api.deleteMyAccount();

    await expect(api.getMyProfile()).resolves.toBeNull();
    await expect(api.listMyMoments()).resolves.toHaveLength(0);
    await expect(api.getNearbyNudges(-37.8136, 144.9631)).resolves.toHaveLength(0);
  });

  it('hides a blocked poster from nearby results and direct lookups', async () => {
    const api = new MockSkyNudgeApi();

    await api.blockUser('person-1');

    await expect(api.getNearbyNudges(-37.8136, 144.9631)).resolves.toHaveLength(4);
    await expect(api.getNudge('nudge-1')).resolves.toBeNull();
  });

  it('updates and deletes private Sky Moments', async () => {
    const api = new MockSkyNudgeApi();
    const [moment] = await api.listMyMoments();
    const initialMoments = await api.listMyMoments();

    await expect(api.updateMoment(moment.id, { notes: 'Updated private note.' })).resolves.toMatchObject({ notes: 'Updated private note.' });
    await api.deleteMoment(moment.id);

    await expect(api.listMyMoments()).resolves.toHaveLength(initialMoments.length - 1);
  });
});
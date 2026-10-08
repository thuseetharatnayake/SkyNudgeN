import type { SkyNudgeApi } from './api';
import { demoSkyImage } from '../lib/demoSky';
import { localDateKey } from '../lib/moments';
import type {
  CreateNudgeInput,
  Nudge,
  RadiusKm,
  SkyMoment,
  SkyUser,
  UpdateSettingsInput,
  UpdateMomentInput,
  VerificationSubmission,
} from '../types/sky';

const minutesAgo = (minutes: number): string => new Date(Date.now() - minutes * 60_000).toISOString();
const minutesFromNow = (minutes: number): string => new Date(Date.now() + minutes * 60_000).toISOString();

const skyImage = (top: string, bottom: string, accent: string): string => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900"><defs><linearGradient id="g" x1="0" x2="0" y1="0" y2="1"><stop stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient></defs><rect width="1200" height="900" fill="url(#g)"/><circle cx="930" cy="260" r="96" fill="${accent}" opacity=".88"/><path d="M0 670C190 590 330 760 535 672S890 590 1200 704V900H0Z" fill="#1b334d" opacity=".4"/><path d="M0 770C210 685 430 806 650 738s328-21 550 58v104H0Z" fill="#111" opacity=".3"/></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const initialProfile: SkyUser = {
  id: 'user-1',
  username: 'CloudDrifter482',
  verification_status: 'verified',
  email: 'demo@skynudge.app',
  share_exact_location: false,
  nearby_alerts: true,
  default_radius_km: 5,
};

const melbourneNudges: Nudge[] = [
  { id: 'nudge-1', category: 'sunset', intensity: 'look_now', direction: 'west', radius_km: 5, landmark: 'Brighton Beach', coordinates: { lat: -37.92, lng: 144.99 }, created_at: minutesAgo(4), expires_at: minutesFromNow(25), distance_km: 4.6, place_name: 'Brighton Beach', username: 'HarbourGlow219', verified: true, poster: { id: 'person-1', username: 'HarbourGlow219', verification_status: 'verified' }, watcher_count: 7, seen_count: 7, confirmed_by_me: false, i_can_see_it: false, photo_url: skyImage('#ff9d67', '#4968a9', '#ffe3a9'), note: 'The horizon is glowing peach and violet right now.' },
  { id: 'nudge-2', category: 'rainbow', intensity: 'look_now', direction: 'east', radius_km: 5, landmark: 'Richmond', coordinates: { lat: -37.82, lng: 144.99 }, created_at: minutesAgo(7), expires_at: minutesFromNow(23), distance_km: 3.1, place_name: 'Richmond', username: 'MistyArc604', verified: false, poster: { id: 'person-2', username: 'MistyArc604', verification_status: 'not_verified' }, watcher_count: 12, seen_count: 12, confirmed_by_me: false, i_can_see_it: false, photo_url: skyImage('#8ac7ea', '#f8c0b2', '#ffffff'), note: 'A clear rainbow is sitting above the rooftops.' },
  { id: 'nudge-3', category: 'clouds', intensity: 'wow', direction: 'above', radius_km: 2, landmark: 'Fitzroy Gardens', coordinates: { lat: -37.81, lng: 144.98 }, created_at: minutesAgo(14), expires_at: minutesFromNow(16), distance_km: 2.4, place_name: 'Fitzroy Gardens', username: 'CloudDrifter482', verified: true, poster: { id: 'user-1', username: 'CloudDrifter482', verification_status: 'verified' }, watcher_count: 8, seen_count: 8, confirmed_by_me: true, i_can_see_it: true, photo_url: null, note: 'Huge silver-edged clouds moving over the city.' },
  { id: 'nudge-4', category: 'moon', intensity: 'beautiful', direction: 'above', radius_km: 2, landmark: 'Carlton Gardens', coordinates: { lat: -37.8, lng: 144.97 }, created_at: minutesAgo(21), expires_at: minutesFromNow(9), distance_km: 2.8, place_name: 'Carlton Gardens', username: 'LunarWalker808', verified: false, poster: { id: 'person-4', username: 'LunarWalker808', verification_status: 'not_verified' }, watcher_count: 6, seen_count: 6, confirmed_by_me: false, i_can_see_it: false, photo_url: null, note: 'A pale moon is visible through the blue.' },
  { id: 'nudge-5', category: 'sunset', intensity: 'beautiful', direction: 'west', radius_km: 5, landmark: 'Southbank', coordinates: { lat: -37.83, lng: 144.96 }, created_at: minutesAgo(25), expires_at: minutesFromNow(5), distance_km: 1.8, place_name: 'Southbank', username: 'QuietHorizon377', verified: true, poster: { id: 'person-5', username: 'QuietHorizon377', verification_status: 'verified' }, watcher_count: 4, seen_count: 4, confirmed_by_me: false, i_can_see_it: false, photo_url: null, note: 'Soft gold over the river.' },
];

function localTimestamp(day: number, hour: number, minute: number): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), day, hour, minute).toISOString();
}

const initialMoments: SkyMoment[] = [
  { id: 'moment-1', category: 'moon', occurred_at: localTimestamp(6, 21, 10), location_label: 'Williamstown Beach', direction: 'east', landmark: 'Gem Pier', notes: 'The moon was bright above the water.', photo_urls: [] },
  { id: 'moment-2', category: 'sunset', occurred_at: localTimestamp(5, 18, 42), location_label: 'St Kilda Beach', direction: 'west', landmark: 'The pier', notes: 'The water caught every shade of apricot.', photo_urls: [demoSkyImage('sunset', 1), demoSkyImage('sunset', 2)] },
  { id: 'moment-3', category: 'rainbow', occurred_at: localTimestamp(5, 16, 14), location_label: 'Carlton', direction: 'east', landmark: 'Royal Exhibition Building', notes: 'It appeared between two quick showers.', photo_urls: [demoSkyImage('rainbow', 1)] },
  { id: 'moment-4', category: 'clouds', occurred_at: localTimestamp(3, 17, 31), location_label: 'Fitzroy', direction: 'above', landmark: null, notes: 'Mammatus clouds, just for a few minutes.', photo_urls: [demoSkyImage('clouds', 1), demoSkyImage('clouds', 2), demoSkyImage('clouds', 3)] },
  { id: 'moment-5', category: 'sunrise', occurred_at: localTimestamp(2, 6, 38), location_label: 'Elwood', direction: 'east', landmark: 'Elwood Beach', notes: 'Worth the early alarm.', photo_urls: [demoSkyImage('sunrise', 1), demoSkyImage('sunrise', 2), demoSkyImage('sunrise', 3), demoSkyImage('sunrise', 4), demoSkyImage('sunrise', 5)] },
];

const copyUser = (user: SkyUser): SkyUser => ({ ...user });
const copyNudge = (nudge: Nudge): Nudge => ({ ...nudge, coordinates: { ...nudge.coordinates }, poster: { ...nudge.poster } });
const copyMoment = (moment: SkyMoment): SkyMoment => ({ ...moment, photo_urls: [...moment.photo_urls] });

export class MockSkyNudgeApi implements SkyNudgeApi {
  private profile: SkyUser | null = copyUser(initialProfile);
  private nudges = melbourneNudges.map(copyNudge);
  private moments = initialMoments.map(copyMoment);
  private subscribers = new Set<(nudges: Nudge[]) => void>();
  private blockedUserIds = new Set<string>();

  async signUp(email: string, _password: string): Promise<{ status: 'session'; user: SkyUser }> {
    this.profile = { ...copyUser(initialProfile), email, username: 'CloudDrifter482', verification_status: 'not_verified' };
    return { status: 'session', user: copyUser(this.profile) };
  }

  async signIn(_email: string, _password: string): Promise<SkyUser> {
    this.profile ??= copyUser(initialProfile);
    return copyUser(this.profile);
  }

  async signOut(): Promise<void> { this.profile = null; }
  async deleteMyAccount(): Promise<void> {
    this.profile = null;
    this.nudges = [];
    this.moments = [];
    this.blockedUserIds.clear();
    this.notify();
  }
  async getMyProfile(): Promise<SkyUser | null> { return this.profile ? copyUser(this.profile) : null; }

  async updateMySettings(input: UpdateSettingsInput): Promise<SkyUser> {
    if (!this.profile) throw new Error('You must be signed in to update settings.');
    this.profile = { ...this.profile, ...input };
    return copyUser(this.profile);
  }

  async submitVerification(_submission: VerificationSubmission): Promise<SkyUser> {
    if (!this.profile) throw new Error('You must be signed in to submit verification.');
    this.profile = { ...this.profile, verification_status: 'pending' };
    return copyUser(this.profile);
  }

  async getNearbyNudges(_lat: number, _lng: number): Promise<Nudge[]> {
    return this.nudges.filter((nudge) => Date.parse(nudge.created_at) > Date.now() - 30 * 60_000 && !this.blockedUserIds.has(nudge.poster.id)).map(copyNudge);
  }

  async getNudge(id: string): Promise<Nudge | null> {
    const nudge = this.nudges.find((candidate) => candidate.id === id);
    return nudge && !this.blockedUserIds.has(nudge.poster.id) ? copyNudge(nudge) : null;
  }

  async createNudge(input: CreateNudgeInput): Promise<Nudge> {
    if (!this.profile) throw new Error('You must be signed in to create a SkyNudge.');
    const nudge: Nudge = { id: `nudge-${Date.now()}`, category: input.category, intensity: input.intensity, direction: input.direction, radius_km: input.radius_km as RadiusKm, landmark: input.landmark, coordinates: { ...input.coordinates }, created_at: new Date().toISOString(), expires_at: minutesFromNow(30), distance_km: 0, place_name: input.landmark ?? 'your area', username: this.profile.username, verified: this.profile.verification_status === 'verified', poster: { id: this.profile.id, username: this.profile.username, verification_status: this.profile.verification_status }, watcher_count: 1, seen_count: 1, confirmed_by_me: true, i_can_see_it: true, photo_url: null, note: 'Posted from your area just now.' };
    this.nudges = [nudge, ...this.nudges];
    this.notify();
    return copyNudge(nudge);
  }

  async confirmSighting(id: string): Promise<Nudge> {
    const nudge = this.nudges.find((candidate) => candidate.id === id);
    if (!nudge) throw new Error('SkyNudge not found.');
    if (!nudge.confirmed_by_me) { nudge.confirmed_by_me = true; nudge.i_can_see_it = true; nudge.watcher_count += 1; nudge.seen_count = nudge.watcher_count; this.notify(); }
    return copyNudge(nudge);
  }

  async reportNudge(id: string, reason: string): Promise<void> {
    if (!this.nudges.some((nudge) => nudge.id === id)) throw new Error('SkyNudge not found.');
    if (reason.trim().length === 0 || reason.trim().length > 500) throw new Error('A report reason must be between 1 and 500 characters.');
  }

  async blockUser(userId: string): Promise<void> {
    if (!this.profile) throw new Error('You must be signed in to block a user.');
    if (userId === this.profile.id) throw new Error('You cannot block yourself.');
    this.blockedUserIds.add(userId);
    this.notify();
  }

  async listMyMoments(): Promise<SkyMoment[]> { return this.getMyMoments(); }

  async getMyMoments(): Promise<SkyMoment[]> { return [...this.moments].sort((a, b) => Date.parse(b.occurred_at) - Date.parse(a.occurred_at)).map(copyMoment); }

  async getMomentPhotosForMonth(year: number, month: number): Promise<Record<string, string[]>> {
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    return this.moments.filter((moment) => localDateKey(moment.occurred_at).startsWith(prefix)).sort((a, b) => Date.parse(a.occurred_at) - Date.parse(b.occurred_at)).reduce<Record<string, string[]>>((days, moment) => {
      const date = localDateKey(moment.occurred_at);
      days[date] = [...(days[date] ?? []), ...(moment.photo_urls.length > 0 ? moment.photo_urls : [demoSkyImage(moment.category)])];
      return days;
    }, {});
  }

  async saveNudgeAsMoment(nudgeId: string): Promise<SkyMoment> {
    const nudge = this.nudges.find((candidate) => candidate.id === nudgeId);
    if (!nudge) throw new Error('SkyNudge not found.');
    const expiresAt = nudge.expires_at ? Date.parse(nudge.expires_at) : Date.parse(nudge.created_at) + 30 * 60_000;
    if (expiresAt <= Date.now()) throw new Error("This SkyNudge has ended, so it can't be saved.");
    const moment: SkyMoment = { id: `moment-${Date.now()}`, category: nudge.category, occurred_at: new Date().toISOString(), location_label: nudge.landmark ?? 'Near Melbourne CBD', direction: nudge.direction, landmark: nudge.landmark, notes: '', photo_urls: nudge.photo_url ? [nudge.photo_url] : [] };
    this.moments = [moment, ...this.moments];
    return copyMoment(moment);
  }

  async updateMoment(momentId: string, input: UpdateMomentInput): Promise<SkyMoment> {
    const moment = this.moments.find((candidate) => candidate.id === momentId);
    if (!moment) throw new Error('Sky Moment not found.');
    const notes = input.notes.trim();
    if (notes.length > 2000) throw new Error('Sky Moment notes must be 2,000 characters or fewer.');
    moment.notes = notes;
    return copyMoment(moment);
  }

  async deleteMoment(momentId: string): Promise<void> {
    const existingLength = this.moments.length;
    this.moments = this.moments.filter((moment) => moment.id !== momentId);
    if (this.moments.length === existingLength) throw new Error('Sky Moment not found.');
  }

  async addMomentPhotos(momentId: string, photos: File[]): Promise<SkyMoment> {
    const moment = this.moments.find((candidate) => candidate.id === momentId);
    if (!moment) throw new Error('Sky Moment not found.');
    if (moment.photo_urls.length + photos.length > 6) throw new Error('A Sky Moment can contain at most six photos.');
    return copyMoment(moment);
  }

  subscribeToNudges(callback: (nudges: Nudge[]) => void): () => void {
    this.subscribers.add(callback);
    return () => { this.subscribers.delete(callback); };
  }

  private notify(): void { const nudges = this.nudges.map(copyNudge); this.subscribers.forEach((subscriber) => subscriber(nudges)); }
}
import type { SkyNudgeApi } from './api';
import type {
  CreateNudgeInput,
  Nudge,
  RadiusKm,
  SaveMomentInput,
  SkyMoment,
  SkyUser,
  VerificationSubmission,
} from '../types/sky';

const minutesAgo = (minutes: number): string => new Date(Date.now() - minutes * 60_000).toISOString();

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
  { id: 'nudge-1', category: 'sunset', intensity: 'look_now', direction: 'west', radius_km: 5, landmark: 'St Kilda Beach', coordinates: { lat: -37.867, lng: 144.975 }, created_at: minutesAgo(4), poster: { id: 'person-1', username: 'HarbourGlow219', verification_status: 'verified' }, watcher_count: 18, confirmed_by_me: false, photo_url: skyImage('#ff9d67', '#4968a9', '#ffe3a9'), note: 'The horizon is glowing peach and violet right now.' },
  { id: 'nudge-2', category: 'clouds', intensity: 'wow', direction: 'above', radius_km: 2, landmark: 'Fitzroy Gardens', coordinates: { lat: -37.814, lng: 144.985 }, created_at: minutesAgo(7), poster: { id: 'person-2', username: 'MistyArc604', verification_status: 'not_verified' }, watcher_count: 11, confirmed_by_me: false, photo_url: null, note: 'Huge silver-edged clouds moving over the city.' },
  { id: 'nudge-3', category: 'rainbow', intensity: 'look_now', direction: 'east', radius_km: 10, landmark: 'Richmond', coordinates: { lat: -37.822, lng: 145.006 }, created_at: minutesAgo(9), poster: { id: 'person-3', username: 'SkylineSeeker91', verification_status: 'pending' }, watcher_count: 24, confirmed_by_me: false, photo_url: skyImage('#8ac7ea', '#f8c0b2', '#ffffff'), note: 'A clear rainbow is sitting above the rooftops.' },
  { id: 'nudge-4', category: 'sunset', intensity: 'beautiful', direction: 'west', radius_km: 5, landmark: 'Southbank', coordinates: { lat: -37.823, lng: 144.965 }, created_at: minutesAgo(13), poster: { id: 'person-4', username: 'QuietHorizon377', verification_status: 'verified' }, watcher_count: 9, confirmed_by_me: false, photo_url: null, note: 'Soft gold over the river.' },
  { id: 'nudge-5', category: 'moon', intensity: 'beautiful', direction: 'above', radius_km: 2, landmark: 'Carlton Gardens', coordinates: { lat: -37.807, lng: 144.971 }, created_at: minutesAgo(16), poster: { id: 'person-5', username: 'LunarWalker808', verification_status: 'not_verified' }, watcher_count: 6, confirmed_by_me: false, photo_url: null, note: 'A pale moon is visible through the blue.' },
  { id: 'nudge-6', category: 'clouds', intensity: 'beautiful', direction: 'north', radius_km: 5, landmark: 'North Melbourne', coordinates: { lat: -37.795, lng: 144.947 }, created_at: minutesAgo(19), poster: { id: 'person-6', username: 'FeatherCloud66', verification_status: 'not_verified' }, watcher_count: 7, confirmed_by_me: false, photo_url: skyImage('#91b8d7', '#f1d0ab', '#ffffff'), note: 'The clouds look painted at the edges.' },
  { id: 'nudge-7', category: 'sunrise', intensity: 'wow', direction: 'east', radius_km: 10, landmark: 'Yarra Bend', coordinates: { lat: -37.799, lng: 145.017 }, created_at: minutesAgo(22), poster: { id: 'person-7', username: 'EarlyLight540', verification_status: 'verified' }, watcher_count: 14, confirmed_by_me: false, photo_url: null, note: 'A memory of the morning glow still hanging around.' },
  { id: 'nudge-8', category: 'other', intensity: 'beautiful', direction: 'south', radius_km: 2, landmark: 'Albert Park Lake', coordinates: { lat: -37.844, lng: 144.970 }, created_at: minutesAgo(26), poster: { id: 'person-8', username: 'BlueHour118', verification_status: 'not_verified' }, watcher_count: 4, confirmed_by_me: false, photo_url: null, note: 'A remarkable blue-hour reflection on the lake.' },
];

const initialMoments: SkyMoment[] = [
  { id: 'moment-1', category: 'sunset', occurred_at: '2026-10-05T18:42:00+11:00', location_label: 'St Kilda Beach', direction: 'west', landmark: 'The pier', notes: 'The water caught every shade of apricot.', photo_urls: [skyImage('#f6a36f', '#5659a9', '#fff0c8'), skyImage('#f3b57d', '#243c75', '#ffe7be')] },
  { id: 'moment-2', category: 'rainbow', occurred_at: '2026-10-03T16:14:00+11:00', location_label: 'Carlton', direction: 'east', landmark: 'Royal Exhibition Building', notes: 'It appeared between two quick showers.', photo_urls: [skyImage('#91cce8', '#e6a7b1', '#ffffff')] },
  { id: 'moment-3', category: 'clouds', occurred_at: '2026-09-29T17:31:00+10:00', location_label: 'Fitzroy', direction: 'above', landmark: null, notes: 'Mammatus clouds, just for a few minutes.', photo_urls: [] },
  { id: 'moment-4', category: 'moon', occurred_at: '2026-09-26T19:04:00+10:00', location_label: 'Southbank', direction: 'above', landmark: 'Yarra River', notes: 'A bright moon over the water.', photo_urls: [skyImage('#15274d', '#5e75ac', '#fff4c9')] },
  { id: 'moment-5', category: 'sunrise', occurred_at: '2026-09-20T06:38:00+10:00', location_label: 'Elwood', direction: 'east', landmark: 'Elwood Beach', notes: 'Worth the early alarm.', photo_urls: [skyImage('#4b78b7', '#f4a369', '#ffe8b6'), skyImage('#557eba', '#ed9077', '#fff0c6'), skyImage('#365e9c', '#d86f72', '#fff3d0')] },
  { id: 'moment-6', category: 'other', occurred_at: '2026-09-14T18:02:00+10:00', location_label: 'Melbourne CBD', direction: 'north', landmark: 'Flinders Street Station', notes: 'The last light reflected in the windows.', photo_urls: [] },
  { id: 'moment-7', category: 'sunset', occurred_at: '2026-09-11T18:20:00+10:00', location_label: 'Williamstown', direction: 'west', landmark: 'Gem Pier', notes: 'A slow, quiet fade after the wind dropped.', photo_urls: [skyImage('#feaa70', '#694e9e', '#ffe6a8'), skyImage('#f49778', '#2c5187', '#fce7bd'), skyImage('#f8bb82', '#5464ae', '#ffe9cb'), skyImage('#ef8f72', '#395080', '#fff2c9')] },
];

const copyUser = (user: SkyUser): SkyUser => ({ ...user });
const copyNudge = (nudge: Nudge): Nudge => ({ ...nudge, coordinates: { ...nudge.coordinates }, poster: { ...nudge.poster } });
const copyMoment = (moment: SkyMoment): SkyMoment => ({ ...moment, photo_urls: [...moment.photo_urls] });

export class MockSkyNudgeApi implements SkyNudgeApi {
  private profile: SkyUser | null = copyUser(initialProfile);
  private nudges = melbourneNudges.map(copyNudge);
  private moments = initialMoments.map(copyMoment);
  private subscribers = new Set<(nudges: Nudge[]) => void>();

  async signUp(email: string, _password: string): Promise<SkyUser> {
    this.profile = { ...copyUser(initialProfile), email, username: 'CloudDrifter482', verification_status: 'not_verified' };
    return copyUser(this.profile);
  }

  async signIn(_email: string, _password: string): Promise<SkyUser> {
    this.profile ??= copyUser(initialProfile);
    return copyUser(this.profile);
  }

  async signOut(): Promise<void> { this.profile = null; }
  async getMyProfile(): Promise<SkyUser | null> { return this.profile ? copyUser(this.profile) : null; }

  async submitVerification(_submission: VerificationSubmission): Promise<SkyUser> {
    if (!this.profile) throw new Error('You must be signed in to submit verification.');
    this.profile = { ...this.profile, verification_status: 'pending' };
    return copyUser(this.profile);
  }

  async getNearbyNudges(_lat: number, _lng: number): Promise<Nudge[]> {
    return this.nudges.filter((nudge) => Date.parse(nudge.created_at) > Date.now() - 30 * 60_000).map(copyNudge);
  }

  async getNudge(id: string): Promise<Nudge | null> {
    const nudge = this.nudges.find((candidate) => candidate.id === id);
    return nudge ? copyNudge(nudge) : null;
  }

  async createNudge(input: CreateNudgeInput): Promise<Nudge> {
    if (!this.profile) throw new Error('You must be signed in to create a SkyNudge.');
    const nudge: Nudge = { id: `nudge-${Date.now()}`, category: input.category, intensity: input.intensity, direction: input.direction, radius_km: input.radius_km as RadiusKm, landmark: input.landmark, coordinates: { ...input.coordinates }, created_at: new Date().toISOString(), poster: { id: this.profile.id, username: this.profile.username, verification_status: this.profile.verification_status }, watcher_count: 1, confirmed_by_me: true, photo_url: input.photo_data_url, note: 'Posted from your area just now.' };
    this.nudges = [nudge, ...this.nudges];
    this.notify();
    return copyNudge(nudge);
  }

  async confirmSighting(id: string): Promise<Nudge> {
    const nudge = this.nudges.find((candidate) => candidate.id === id);
    if (!nudge) throw new Error('SkyNudge not found.');
    if (!nudge.confirmed_by_me) { nudge.confirmed_by_me = true; nudge.watcher_count += 1; this.notify(); }
    return copyNudge(nudge);
  }

  async listMyMoments(): Promise<SkyMoment[]> { return [...this.moments].sort((a, b) => Date.parse(b.occurred_at) - Date.parse(a.occurred_at)).map(copyMoment); }

  async saveMoment(input: SaveMomentInput): Promise<SkyMoment> {
    const nudge = this.nudges.find((candidate) => candidate.id === input.nudge_id);
    if (!nudge) throw new Error('SkyNudge not found.');
    const moment: SkyMoment = { id: `moment-${Date.now()}`, category: nudge.category, occurred_at: new Date().toISOString(), location_label: nudge.landmark ?? 'Near Melbourne CBD', direction: nudge.direction, landmark: nudge.landmark, notes: input.notes ?? '', photo_urls: nudge.photo_url ? [nudge.photo_url] : [] };
    this.moments = [moment, ...this.moments];
    return copyMoment(moment);
  }

  subscribeToNudges(callback: (nudges: Nudge[]) => void): () => void {
    this.subscribers.add(callback);
    return () => { this.subscribers.delete(callback); };
  }

  private notify(): void { const nudges = this.nudges.map(copyNudge); this.subscribers.forEach((subscriber) => subscriber(nudges)); }
}
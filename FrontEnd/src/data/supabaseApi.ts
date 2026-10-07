import type { User } from '@supabase/supabase-js';
import type { PostgrestError } from '@supabase/supabase-js';
import type { SkyNudgeApi } from './api';
import { getSupabaseClient } from '../lib/supabase';
import type {
  Category,
  CreateNudgeInput,
  Direction,
  Intensity,
  Nudge,
  RadiusKm,
  SaveMomentInput,
  SkyMoment,
  SkyUser,
  UpdateSettingsInput,
  VerificationStatus,
  VerificationSubmission,
} from '../types/sky';

type ProfileRow = {
  id: string;
  username: string;
  verification_status: VerificationStatus;
  share_exact_location: boolean;
  nearby_alerts: boolean;
  default_radius_km: RadiusKm;
};

type NudgeRpcRow = {
  id: string;
  category: Category;
  intensity: Intensity;
  direction: Direction;
  radius_km: RadiusKm;
  landmark: string | null;
  note: string | null;
  photo_path: string | null;
  created_at: string;
  poster_id: string;
  poster_username: string;
  poster_is_verified: boolean;
  seen_count: number | string;
  i_saw_it: boolean;
  latitude: number | string;
  longitude: number | string;
};

type MomentPhotoRow = { storage_path: string; position: number };
type MomentRow = {
  id: string;
  category: Category;
  captured_at: string;
  location_label: string | null;
  direction: Direction | null;
  landmark: string | null;
  note: string | null;
  sky_moment_photos: MomentPhotoRow[] | null;
};

const allowedImageTypes = new Set(['image/jpeg', 'image/png']);
const maxPhotoBytes = 5 * 1024 * 1024;

type UntypedRpcClient = {
  rpc: <T>(functionName: string, arguments_: Record<string, unknown>) => Promise<{ data: T | null; error: PostgrestError | null }>;
};

type MomentPhotoInsertClient = {
  insert: (values: { moment_id: string; user_id: string; storage_path: string; position: number }[]) => Promise<{ error: PostgrestError | null }>;
};

type InsertClient<T> = {
  insert: (values: T) => Promise<{ error: PostgrestError | null }>;
};

function toSkyUser(user: User, profile: ProfileRow): SkyUser {
  return {
    id: profile.id,
    username: profile.username,
    verification_status: profile.verification_status,
    email: user.email ?? '',
    share_exact_location: profile.share_exact_location,
    nearby_alerts: profile.nearby_alerts,
    default_radius_km: profile.default_radius_km,
  };
}

function toNudge(row: NudgeRpcRow): Nudge {
  const supabase = getSupabaseClient();
  const photoUrl = row.photo_path
    ? supabase.storage.from('nudge-photos').getPublicUrl(row.photo_path).data.publicUrl
    : null;
  return {
    id: row.id,
    category: row.category,
    intensity: row.intensity,
    direction: row.direction,
    radius_km: row.radius_km,
    landmark: row.landmark,
    coordinates: { lat: Number(row.latitude), lng: Number(row.longitude) },
    created_at: row.created_at,
    poster: {
      id: row.poster_id,
      username: row.poster_username,
      verification_status: row.poster_is_verified ? 'verified' : 'not_verified',
    },
    watcher_count: Number(row.seen_count),
    confirmed_by_me: row.i_saw_it,
    photo_url: photoUrl,
    note: row.note ?? '',
  };
}

function validatePhoto(file: File): void {
  if (!allowedImageTypes.has(file.type)) throw new Error('Please choose a JPEG or PNG image.');
  if (file.size > maxPhotoBytes) throw new Error('Photos must be 5 MB or smaller.');
}

function extensionFor(file: File): 'jpg' | 'png' {
  return file.type === 'image/png' ? 'png' : 'jpg';
}

function rpc<T>(functionName: string, arguments_: Record<string, unknown>): Promise<{ data: T | null; error: PostgrestError | null }> {
  return (getSupabaseClient() as unknown as UntypedRpcClient).rpc<T>(functionName, arguments_);
}

export class SupabaseSkyNudgeApi implements SkyNudgeApi {
  async signUp(email: string, password: string): Promise<SkyUser> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    if (!data.user) throw new Error('Account creation did not return a user. Please try again.');

    if (!data.session) {
      throw new Error('Check your email to confirm your account, then log in.');
    }

    return this.getProfileForUser(data.user);
  }

  async signIn(email: string, password: string): Promise<SkyUser> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!data.user) throw new Error('Login did not return a user. Please try again.');
    return this.getProfileForUser(data.user);
  }

  async signOut(): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  async getMyProfile(): Promise<SkyUser | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data.user ? this.getProfileForUser(data.user) : null;
  }

  async updateMySettings(input: UpdateSettingsInput): Promise<SkyUser> {
    const { data: userData, error: userError } = await getSupabaseClient().auth.getUser();
    if (userError) throw userError;
    if (!userData.user) throw new Error('You must be signed in to update settings.');
    const { error } = await rpc<void>('update_my_settings', {
      p_share_exact_location: input.share_exact_location,
      p_nearby_alerts: input.nearby_alerts,
      p_default_radius_km: input.default_radius_km,
    });
    if (error) throw error;
    return this.getProfileForUser(userData.user);
  }

  async submitVerification(submission: VerificationSubmission): Promise<SkyUser> {
    const supabase = getSupabaseClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!userData.user) throw new Error('You must be signed in to submit verification.');
    const { error } = await rpc<string>('submit_verification', {
      p_full_legal_name: submission.full_legal_name,
      p_phone_number: submission.phone_number,
      p_consent: submission.consent,
    });
    if (error) throw error;
    return this.getProfileForUser(userData.user);
  }

  async getNearbyNudges(lat: number, lng: number): Promise<Nudge[]> {
    const { data, error } = await rpc<NudgeRpcRow[]>('get_nearby_nudges', { p_user_lat: lat, p_user_lng: lng });
    if (error) throw error;
    return ((data ?? []) as NudgeRpcRow[]).map(toNudge);
  }

  async getNudge(id: string): Promise<Nudge | null> {
    const { data, error } = await rpc<NudgeRpcRow[]>('get_nudge', { p_nudge_id: id });
    if (error) throw error;
    const row = (data as NudgeRpcRow[] | null)?.[0];
    return row ? toNudge(row) : null;
  }

  async createNudge(input: CreateNudgeInput): Promise<Nudge> {
    const supabase = getSupabaseClient();
    let photoPath: string | null = null;
    if (input.photo_file) {
      validatePhoto(input.photo_file);
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!userData.user) throw new Error('You must be signed in to upload a photo.');
      photoPath = `${userData.user.id}/${crypto.randomUUID()}.${extensionFor(input.photo_file)}`;
      const { error: uploadError } = await supabase.storage.from('nudge-photos').upload(photoPath, input.photo_file, {
        contentType: input.photo_file.type,
        upsert: false,
      });
      if (uploadError) throw uploadError;
    }
    try {
      const { data, error } = await rpc<string>('create_nudge', {
        p_category: input.category,
        p_intensity: input.intensity,
        p_direction: input.direction,
        p_radius_km: input.radius_km,
        p_landmark: input.landmark,
        p_note: null,
        p_photo_path: photoPath,
        p_lat: input.coordinates.lat,
        p_lng: input.coordinates.lng,
        p_share_exact: input.exact_location_shared,
        p_area_label: input.landmark,
      });
      if (error) throw error;
      const nudge = await this.getNudge(data as string);
      if (!nudge) throw new Error('Your SkyNudge was created but could not be retrieved.');
      return nudge;
    } catch (caughtError) {
      if (photoPath) await supabase.storage.from('nudge-photos').remove([photoPath]);
      throw caughtError;
    }
  }

  async confirmSighting(id: string): Promise<Nudge> {
    const { error } = await rpc<number>('confirm_sighting', { p_nudge_id: id });
    if (error) throw error;
    const nudge = await this.getNudge(id);
    if (!nudge) throw new Error('SkyNudge not found or expired.');
    return nudge;
  }

  async reportNudge(id: string, reason: string): Promise<void> {
    const trimmedReason = reason.trim();
    if (trimmedReason.length === 0 || trimmedReason.length > 500) throw new Error('A report reason must be between 1 and 500 characters.');
    const supabase = getSupabaseClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!userData.user) throw new Error('You must be signed in to report a SkyNudge.');
    const reports = supabase.from('reports') as unknown as InsertClient<{ reporter_id: string; nudge_id: string; reason: string }>;
    const { error } = await reports.insert({ reporter_id: userData.user.id, nudge_id: id, reason: trimmedReason });
    if (error) throw error;
  }

  async blockUser(userId: string): Promise<void> {
    const supabase = getSupabaseClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!userData.user) throw new Error('You must be signed in to block a user.');
    if (userData.user.id === userId) throw new Error('You cannot block yourself.');
    const blocks = supabase.from('user_blocks') as unknown as InsertClient<{ blocker_id: string; blocked_id: string }>;
    const { error } = await blocks.insert({ blocker_id: userData.user.id, blocked_id: userId });
    if (error && error.code !== '23505') throw error;
  }

  async listMyMoments(): Promise<SkyMoment[]> {
    const supabase = getSupabaseClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!userData.user) throw new Error('You must be signed in to view Sky Moments.');
    const { data, error } = await supabase
      .from('sky_moments')
      .select('id, category, captured_at, location_label, direction, landmark, note, sky_moment_photos(storage_path, position)')
      .eq('user_id', userData.user.id)
      .order('captured_at', { ascending: false });
    if (error) throw error;
    return Promise.all(((data ?? []) as MomentRow[]).map((row) => this.toSkyMoment(row)));
  }

  async saveMoment(input: SaveMomentInput): Promise<SkyMoment> {
    const { data, error } = await rpc<string>('save_nudge_as_moment', { p_nudge_id: input.nudge_id });
    if (error) throw error;
    const moment = await this.getMoment(data as string);
    if (!moment) throw new Error('Your Sky Moment was saved but could not be retrieved.');
    return moment;
  }

  async addMomentPhotos(momentId: string, photos: File[]): Promise<SkyMoment> {
    if (photos.length === 0) {
      const moment = await this.getMoment(momentId);
      if (!moment) throw new Error('Sky Moment not found.');
      return moment;
    }
    if (photos.length > 6) throw new Error('A Sky Moment can contain at most six photos.');
    photos.forEach(validatePhoto);

    const supabase = getSupabaseClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!userData.user) throw new Error('You must be signed in to upload photos.');
    const { data: existingPhotos, error: existingError } = await supabase
      .from('sky_moment_photos')
      .select('position')
      .eq('moment_id', momentId)
      .order('position');
    if (existingError) throw existingError;
    const startingPosition = (existingPhotos ?? []).length;
    if (startingPosition + photos.length > 6) throw new Error('A Sky Moment can contain at most six photos.');

    const uploadedPaths: string[] = [];
    try {
      for (const photo of photos) {
        const path = `${userData.user.id}/${crypto.randomUUID()}.${extensionFor(photo)}`;
        const { error: uploadError } = await supabase.storage.from('moment-photos').upload(path, photo, { contentType: photo.type, upsert: false });
        if (uploadError) throw uploadError;
        uploadedPaths.push(path);
      }
      const momentPhotos = supabase.from('sky_moment_photos') as unknown as MomentPhotoInsertClient;
      const { error: insertError } = await momentPhotos.insert(uploadedPaths.map((path, index) => ({
        moment_id: momentId,
        user_id: userData.user.id,
        storage_path: path,
        position: startingPosition + index + 1,
      })));
      if (insertError) throw insertError;
    } catch (caughtError) {
      if (uploadedPaths.length > 0) await supabase.storage.from('moment-photos').remove(uploadedPaths);
      throw caughtError;
    }
    const moment = await this.getMoment(momentId);
    if (!moment) throw new Error('Photos were uploaded but the Sky Moment could not be retrieved.');
    return moment;
  }

  subscribeToNudges(callback: (nudges: Nudge[]) => void): () => void {
    const supabase = getSupabaseClient();
    const channel = supabase
      .channel(`nudge-pings-${crypto.randomUUID()}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'nudge_pings' }, () => callback([]))
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }

  private async getProfileForUser(user: User): Promise<SkyUser> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, verification_status')
      .eq('id', user.id)
      .single();

    if (error) throw error;
    return toSkyUser(user, data as ProfileRow);
  }

  private async getMoment(id: string): Promise<SkyMoment | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('sky_moments')
      .select('id, category, captured_at, location_label, direction, landmark, note, sky_moment_photos(storage_path, position)')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data ? this.toSkyMoment(data as MomentRow) : null;
  }

  private async toSkyMoment(row: MomentRow): Promise<SkyMoment> {
    const photos = [...(row.sky_moment_photos ?? [])].sort((left, right) => left.position - right.position);
    if (photos.length === 0) {
      return {
        id: row.id,
        category: row.category,
        occurred_at: row.captured_at,
        location_label: row.location_label ?? 'Saved sky moment',
        direction: row.direction ?? 'above',
        landmark: row.landmark,
        notes: row.note ?? '',
        photo_urls: [],
      };
    }
    const { data, error } = await getSupabaseClient().storage.from('moment-photos').createSignedUrls(photos.map((photo) => photo.storage_path), 3600);
    if (error) throw error;
    return {
      id: row.id,
      category: row.category,
      occurred_at: row.captured_at,
      location_label: row.location_label ?? 'Saved sky moment',
      direction: row.direction ?? 'above',
      landmark: row.landmark,
      notes: row.note ?? '',
      photo_urls: (data ?? []).flatMap((photo) => photo.signedUrl ? [photo.signedUrl] : []),
    };
  }
}
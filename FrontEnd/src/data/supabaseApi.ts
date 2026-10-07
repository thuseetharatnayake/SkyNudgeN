import type { User } from '@supabase/supabase-js';
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
  VerificationStatus,
  VerificationSubmission,
} from '../types/sky';

type ProfileRow = {
  id: string;
  username: string;
  verification_status: VerificationStatus;
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
  poster_username: string;
  poster_is_verified: boolean;
  seen_count: number | string;
  i_saw_it: boolean;
  latitude: number | string;
  longitude: number | string;
};

const notImplemented = (operation: string): never => {
  throw new Error(`${operation} has not been connected to Supabase yet.`);
};

function toSkyUser(user: User, profile: ProfileRow): SkyUser {
  return {
    id: profile.id,
    username: profile.username,
    verification_status: profile.verification_status,
    email: user.email ?? '',
    // These UI preferences are not database fields in the current schema yet.
    share_exact_location: false,
    nearby_alerts: true,
    default_radius_km: 5,
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
      id: '',
      username: row.poster_username,
      verification_status: row.poster_is_verified ? 'verified' : 'not_verified',
    },
    watcher_count: Number(row.seen_count),
    confirmed_by_me: row.i_saw_it,
    photo_url: photoUrl,
    note: row.note ?? '',
  };
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

  async submitVerification(_submission: VerificationSubmission): Promise<SkyUser> {
    return notImplemented('Verification submission');
  }

  async getNearbyNudges(lat: number, lng: number): Promise<Nudge[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.rpc('get_nearby_nudges', { p_user_lat: lat, p_user_lng: lng });
    if (error) throw error;
    return ((data ?? []) as NudgeRpcRow[]).map(toNudge);
  }

  async getNudge(id: string): Promise<Nudge | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.rpc('get_nudge', { p_nudge_id: id });
    if (error) throw error;
    const row = (data as NudgeRpcRow[] | null)?.[0];
    return row ? toNudge(row) : null;
  }

  async createNudge(input: CreateNudgeInput): Promise<Nudge> {
    const supabase = getSupabaseClient();
    if (input.photo_data_url) {
      throw new Error('Photo uploads will be connected in the next storage phase. Create the nudge without a photo for now.');
    }
    const { data, error } = await supabase.rpc('create_nudge', {
      p_category: input.category,
      p_intensity: input.intensity,
      p_direction: input.direction,
      p_radius_km: input.radius_km,
      p_landmark: input.landmark,
      p_note: null,
      p_photo_path: null,
      p_lat: input.coordinates.lat,
      p_lng: input.coordinates.lng,
      p_share_exact: input.exact_location_shared,
      p_area_label: input.landmark,
    });
    if (error) throw error;
    const nudge = await this.getNudge(data as string);
    if (!nudge) throw new Error('Your SkyNudge was created but could not be retrieved.');
    return nudge;
  }

  async confirmSighting(id: string): Promise<Nudge> {
    const supabase = getSupabaseClient();
    const { error } = await supabase.rpc('confirm_sighting', { p_nudge_id: id });
    if (error) throw error;
    const nudge = await this.getNudge(id);
    if (!nudge) throw new Error('SkyNudge not found or expired.');
    return nudge;
  }

  async listMyMoments(): Promise<SkyMoment[]> {
    return notImplemented('Sky Moments');
  }

  async saveMoment(_input: SaveMomentInput): Promise<SkyMoment> {
    return notImplemented('Saving a Sky Moment');
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
}
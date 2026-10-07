export type Category = 'sunset' | 'sunrise' | 'rainbow' | 'clouds' | 'moon' | 'other';
export type Intensity = 'beautiful' | 'wow' | 'look_now';
export type Direction = 'west' | 'east' | 'north' | 'south' | 'above';
export type RadiusKm = 2 | 5 | 10;
export type VerificationStatus = 'not_verified' | 'pending' | 'verified' | 'rejected';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface SkyUser {
  id: string;
  username: string;
  verification_status: VerificationStatus;
  email: string;
  share_exact_location: boolean;
  nearby_alerts: boolean;
  default_radius_km: RadiusKm;
}

export interface Nudge {
  id: string;
  category: Category;
  intensity: Intensity;
  direction: Direction;
  radius_km: RadiusKm;
  landmark: string | null;
  coordinates: Coordinates;
  created_at: string;
  poster: Pick<SkyUser, 'id' | 'username' | 'verification_status'>;
  watcher_count: number;
  confirmed_by_me: boolean;
  photo_url: string | null;
  note: string;
}

export interface CreateNudgeInput {
  category: Category;
  intensity: Intensity;
  direction: Direction;
  landmark: string | null;
  radius_km: RadiusKm;
  coordinates: Coordinates;
  exact_location_shared: boolean;
  photo_data_url: string | null;
}

export interface SkyMoment {
  id: string;
  category: Category;
  occurred_at: string;
  location_label: string;
  direction: Direction;
  landmark: string | null;
  notes: string;
  photo_urls: string[];
}

export interface SaveMomentInput {
  nudge_id: string;
  notes?: string;
}

export interface VerificationSubmission {
  full_legal_name: string;
  phone_number: string;
  consent: boolean;
}

export type NudgeSubscription = () => void;
import type {
  Coordinates,
  CreateNudgeInput,
  Nudge,
  NudgeSubscription,
  SaveMomentInput,
  SkyMoment,
  SkyUser,
  UpdateSettingsInput,
  UpdateMomentInput,
  VerificationSubmission,
} from '../types/sky';

export interface SkyNudgeApi {
  signUp(email: string, password: string): Promise<SkyUser>;
  signIn(email: string, password: string): Promise<SkyUser>;
  signOut(): Promise<void>;
  deleteMyAccount(): Promise<void>;
  getMyProfile(): Promise<SkyUser | null>;
  updateMySettings(input: UpdateSettingsInput): Promise<SkyUser>;
  submitVerification(submission: VerificationSubmission): Promise<SkyUser>;
  getNearbyNudges(lat: number, lng: number): Promise<Nudge[]>;
  getNudge(id: string): Promise<Nudge | null>;
  createNudge(input: CreateNudgeInput): Promise<Nudge>;
  confirmSighting(id: string): Promise<Nudge>;
  reportNudge(id: string, reason: string): Promise<void>;
  blockUser(userId: string): Promise<void>;
  listMyMoments(): Promise<SkyMoment[]>;
  getMyMoments(): Promise<SkyMoment[]>;
  getMomentPhotosForMonth(year: number, month: number): Promise<Record<string, string[]>>;
  saveMoment(input: SaveMomentInput): Promise<SkyMoment>;
  updateMoment(momentId: string, input: UpdateMomentInput): Promise<SkyMoment>;
  deleteMoment(momentId: string): Promise<void>;
  addMomentPhotos(momentId: string, photos: File[]): Promise<SkyMoment>;
  subscribeToNudges(callback: (nudges: Nudge[]) => void): NudgeSubscription;
}

export type { Coordinates, CreateNudgeInput, Nudge, SaveMomentInput, SkyMoment, SkyUser, UpdateMomentInput, UpdateSettingsInput };
import type { SkyNudgeApi } from './api';
import { MockSkyNudgeApi } from './mockApi';
import { SupabaseSkyNudgeApi } from './supabaseApi';

const useMockApi = import.meta.env.VITE_USE_MOCK !== 'false';

export const skyNudgeApi: SkyNudgeApi = useMockApi ? new MockSkyNudgeApi() : new SupabaseSkyNudgeApi();
export type { SkyNudgeApi } from './api';
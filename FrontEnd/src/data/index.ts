import type { SkyNudgeApi } from './api';
import { MockSkyNudgeApi } from './mockApi';

const useMockApi = import.meta.env.VITE_USE_MOCK !== 'false';

if (!useMockApi) {
  throw new Error('A non-mock SkyNudge API implementation has not been configured. Set VITE_USE_MOCK=true.');
}

export const skyNudgeApi: SkyNudgeApi = new MockSkyNudgeApi();
export type { SkyNudgeApi } from './api';
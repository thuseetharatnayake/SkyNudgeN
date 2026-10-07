import { useContext } from 'react';
import type { SkyNudgeApi } from '../../data';
import { ApiContext } from './apiContext';

export function useSkyNudgeApi(): SkyNudgeApi {
  const api = useContext(ApiContext);
  if (!api) throw new Error('useSkyNudgeApi must be used within ApiProvider.');
  return api;
}
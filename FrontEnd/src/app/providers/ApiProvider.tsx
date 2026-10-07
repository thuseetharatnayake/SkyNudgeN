import type { ReactNode } from 'react';
import { skyNudgeApi } from '../../data';
import { ApiContext } from './apiContext';

interface ApiProviderProps { children: ReactNode; }

export function ApiProvider({ children }: ApiProviderProps): JSX.Element {
  return <ApiContext.Provider value={skyNudgeApi}>{children}</ApiContext.Provider>;
}
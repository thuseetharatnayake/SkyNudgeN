import { createContext, useContext } from 'react';

export const LaunchContext = createContext(false);

export function useLaunchComplete(): boolean {
  return useContext(LaunchContext);
}
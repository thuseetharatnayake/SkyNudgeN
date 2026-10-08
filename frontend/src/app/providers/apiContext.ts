import { createContext } from 'react';
import type { SkyNudgeApi } from '../../data';

export const ApiContext = createContext<SkyNudgeApi | null>(null);
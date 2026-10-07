import { useCallback, useEffect, useRef, useState } from 'react';
import { useSkyNudgeApi } from '../app/providers/useSkyNudgeApi';
import { roundedLocation, sortActiveNudges } from '../lib/homeNudges';
import type { Coordinates, Nudge, SkyUser } from '../types/sky';

const melbourneFallback: Coordinates = { lat: -37.8136, lng: 144.9631 };

interface NearbyNudgesState {
  nudges: Nudge[];
  profile: SkyUser | null;
  location: Coordinates;
  hasLocation: boolean;
  isLoading: boolean;
  error: string;
  retry: () => Promise<void>;
  requestLocation: () => Promise<void>;
}

function messageFor(error: unknown): string {
  return error instanceof Error ? error.message : 'Unable to load nearby SkyNudges.';
}

function requestBrowserLocation(): Promise<Coordinates | null> {
  if (!navigator.geolocation) return Promise.resolve(null);
  return new Promise((resolve) => navigator.geolocation.getCurrentPosition(
    (position) => resolve(roundedLocation({ lat: position.coords.latitude, lng: position.coords.longitude })),
    () => resolve(null),
    { enableHighAccuracy: false, timeout: 8_000, maximumAge: 60_000 },
  ));
}

export function useNearbyNudges(): NearbyNudgesState {
  const api = useSkyNudgeApi();
  const [nudges, setNudges] = useState<Nudge[]>([]);
  const [profile, setProfile] = useState<SkyUser | null>(null);
  const [location, setLocation] = useState<Coordinates>(roundedLocation(melbourneFallback));
  const locationRef = useRef(location);
  const [hasLocation, setHasLocation] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (nextLocation = locationRef.current): Promise<void> => {
    setError('');
    try {
      const [nextNudges, nextProfile] = await Promise.all([api.getNearbyNudges(nextLocation.lat, nextLocation.lng), api.getMyProfile()]);
      setNudges(sortActiveNudges(nextNudges));
      setProfile(nextProfile);
    } catch (caughtError) {
      setError(messageFor(caughtError));
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  const requestLocation = useCallback(async (): Promise<void> => {
    const nextLocation = await requestBrowserLocation();
    setHasLocation(nextLocation !== null);
    const queryLocation = nextLocation ?? roundedLocation(melbourneFallback);
    locationRef.current = queryLocation;
    setLocation(queryLocation);
    setIsLoading(true);
    await load(queryLocation);
  }, [load]);

  const retry = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    await load();
  }, [load]);

  useEffect(() => { void requestLocation(); }, [requestLocation]);
  useEffect(() => api.subscribeToNudges(() => { void load(); }), [api, load]);
  useEffect(() => {
    const interval = window.setInterval(() => { void load(); }, 60_000);
    return () => window.clearInterval(interval);
  }, [load]);

  return { nudges, profile, location, hasLocation, isLoading, error, retry, requestLocation };
}
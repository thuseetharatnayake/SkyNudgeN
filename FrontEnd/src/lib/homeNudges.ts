import type { Coordinates, Nudge } from '../types/sky';

const expiryMs = 30 * 60_000;

export function isActiveNudge(nudge: Nudge, now = Date.now()): boolean {
  return now - Date.parse(nudge.created_at) < expiryMs;
}

export function sortActiveNudges(nudges: Nudge[], now = Date.now()): Nudge[] {
  const priority: Record<Nudge['intensity'], number> = { look_now: 0, wow: 1, beautiful: 2 };
  return nudges.filter((nudge) => isActiveNudge(nudge, now)).sort((left, right) => priority[left.intensity] - priority[right.intensity] || Date.parse(right.created_at) - Date.parse(left.created_at));
}

export function relativeNudgeTime(createdAt: string, now = Date.now()): string | null {
  const minutes = Math.floor((now - Date.parse(createdAt)) / 60_000);
  if (minutes >= 30) return null;
  return minutes <= 0 ? 'just now' : `${minutes} min ago`;
}

export function roundedLocation(location: Coordinates): Coordinates {
  return { lat: Math.round(location.lat * 100) / 100, lng: Math.round(location.lng * 100) / 100 };
}

export function distanceKm(from: Coordinates, to: Coordinates): number {
  const radians = (degrees: number): number => degrees * Math.PI / 180;
  const earthRadiusKm = 6371;
  const latitudeDelta = radians(to.lat - from.lat);
  const longitudeDelta = radians(to.lng - from.lng);
  const a = Math.sin(latitudeDelta / 2) ** 2 + Math.cos(radians(from.lat)) * Math.cos(radians(to.lat)) * Math.sin(longitudeDelta / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
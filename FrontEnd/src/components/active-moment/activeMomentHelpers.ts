export const expiryMinutes = 30;

export function clampMinutes(minutes: number): number { return Math.max(0, Math.min(expiryMinutes, minutes)); }
export function progressPercent(minutes: number): number { return Math.round((clampMinutes(minutes) / expiryMinutes) * 100); }
export function peopleText(count: number): string { return `${count} ${count === 1 ? 'person' : 'people'}`; }
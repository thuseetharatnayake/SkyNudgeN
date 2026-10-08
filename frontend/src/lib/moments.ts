import type { SkyMoment } from '../types/sky';

export function localDateKey(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getMonthOffset(year: number, month: number): number {
  return (new Date(year, month, 1).getDay() + 6) % 7;
}

export function monthLegend(momentCount: number, photoCount: number): string {
  if (momentCount === 0) return 'No moments this month.';
  return `${momentCount} moment${momentCount === 1 ? '' : 's'} \u00b7 ${photoCount} photo${photoCount === 1 ? '' : 's'} this month. Tap a day to open it.`;
}

export function momentsForLocalDay(moments: SkyMoment[], date: string): SkyMoment[] {
  return moments.filter((moment) => localDateKey(moment.occurred_at) === date);
}

export function formatMomentDateTime(value: string): string {
  return new Intl.DateTimeFormat('en-AU', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(value)).replace('am', 'am').replace('pm', 'pm');
}

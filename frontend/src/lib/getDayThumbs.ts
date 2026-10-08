export type DayThumbLayout = 'none' | 't1' | 't2' | 't3' | 't4';

export interface DayThumbs {
  urls: string[];
  layout: DayThumbLayout;
}

export function getDayThumbs(photos: string[]): DayThumbs {
  const urls = photos.slice(0, 4);
  const layout: DayThumbLayout = urls.length === 0 ? 'none' : `t${Math.min(urls.length, 4)}` as DayThumbLayout;
  return { urls, layout };
}

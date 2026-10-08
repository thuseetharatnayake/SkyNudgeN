import type { Category } from '../types/sky';

const palettes: Record<Category, [string, string, string]> = {
  sunset: ['#f6a36f', '#5659a9', '#fff0c8'],
  sunrise: ['#4b78b7', '#f4a369', '#ffe8b6'],
  rainbow: ['#91cce8', '#e6a7b1', '#ffffff'],
  clouds: ['#7fa6cc', '#d9e7f2', '#ffffff'],
  moon: ['#15274d', '#5e75ac', '#fff4c9'],
  other: ['#607fa4', '#b4cbe0', '#f5e9c8'],
};

export function demoSkyImage(category: Category, variant = 0): string {
  const [top, bottom, accent] = palettes[category];
  const shift = (variant % 5) * 38;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900"><defs><linearGradient id="g" x1="0" x2="0" y1="0" y2="1"><stop stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient></defs><rect width="1200" height="900" fill="url(#g)"/><circle cx="${840 + shift}" cy="260" r="96" fill="${accent}" opacity=".88"/><path d="M0 670C190 590 330 760 535 672S890 590 1200 704V900H0Z" fill="#1b334d" opacity=".4"/><path d="M0 770C210 685 430 806 650 738s328-21 550 58v104H0Z" fill="#111" opacity=".3"/></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export function isDemoSkyImage(url: string): boolean {
  return url.startsWith('data:image/svg+xml');
}

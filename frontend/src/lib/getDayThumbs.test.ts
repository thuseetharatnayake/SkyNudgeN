import { describe, expect, it } from 'vitest';
import { getDayThumbs } from './getDayThumbs';
import { getMonthOffset, monthLegend } from './moments';

describe('getDayThumbs', () => {
  it.each([[[], 'none', 0], [['a'], 't1', 1], [['a', 'b'], 't2', 2], [['a', 'b', 'c'], 't3', 3], [['a', 'b', 'c', 'd'], 't4', 4], [['a', 'b', 'c', 'd', 'e', 'f', 'g'], 't4', 4]] as const)('maps %o to %s', (urls, layout, length) => {
    expect(getDayThumbs([...urls])).toEqual({ urls: urls.slice(0, 4), layout });
    expect(getDayThumbs([...urls]).urls).toHaveLength(length);
  });
});

describe('calendar helpers', () => {
  it('uses Monday-first calendar offsets', () => {
    expect(getMonthOffset(2026, 9)).toBe(3);
    expect(getMonthOffset(2026, 10)).toBe(6);
  });

  it('pluralises the legend', () => {
    expect(monthLegend(1, 1)).toBe('1 moment \u00b7 1 photo this month. Tap a day to open it.');
    expect(monthLegend(3, 9)).toBe('3 moments \u00b7 9 photos this month. Tap a day to open it.');
  });
});

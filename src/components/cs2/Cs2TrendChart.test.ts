import { describe, expect, it } from 'vitest';
import { getMapTickInterval, getYearMarkers } from './Cs2TrendChart';

describe('getMapTickInterval', () => {
  it('uses 10-map ticks for shorter histories', () => {
    expect(getMapTickInterval(10)).toBe(10);
    expect(getMapTickInterval(120)).toBe(10);
  });

  it('uses 25-map ticks for medium histories', () => {
    expect(getMapTickInterval(121)).toBe(25);
    expect(getMapTickInterval(250)).toBe(25);
  });

  it('uses 50-map ticks for long histories', () => {
    expect(getMapTickInterval(251)).toBe(50);
    expect(getMapTickInterval(500)).toBe(50);
  });
});

describe('getYearMarkers', () => {
  it('returns the first map index of each year', () => {
    const points = [
      { matchDate: '2023-10-16 12:00:00' },
      { matchDate: '2023-12-16 12:00:00' },
      { matchDate: '2024-01-10 12:00:00' },
      { matchDate: '2024-06-10 12:00:00' },
      { matchDate: '2025-02-01 12:00:00' },
    ];

    expect(getYearMarkers(points)).toEqual([
      { index: 0, year: '2023' },
      { index: 2, year: '2024' },
      { index: 4, year: '2025' },
    ]);
  });

  it('ignores missing dates', () => {
    expect(getYearMarkers([{ matchDate: '' }, { matchDate: '2025-02-01' }])).toEqual([
      { index: 1, year: '2025' },
    ]);
  });
});

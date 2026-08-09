import { describe, expect, it } from 'vitest';
import { chartDomain, niceTicks, segmentColor } from './chart-ui';

describe('niceTicks', () => {
  it('produces round, evenly spaced ticks that cover the data', () => {
    expect(niceTicks(35)).toEqual([0, 10, 20, 30, 40]);
    // Jordan's 123.7% keeps a 100% gridline; the domain stretches to the bar itself.
    expect(niceTicks(123.7)).toEqual([0, 50, 100]);
  });

  it('degrades safely when there is nothing to scale', () => {
    expect(niceTicks(0)).toEqual([0]);
    expect(niceTicks(Number.NaN)).toEqual([0]);
  });
});

describe('chartDomain', () => {
  it('never clips the largest bar', () => {
    expect(chartDomain(35)).toBeGreaterThanOrEqual(35);
    expect(chartDomain(123.7)).toBeGreaterThanOrEqual(123.7);
  });

  it('leaves room past 100% so payroll can exceed the cap', () => {
    expect(chartDomain(117.9)).toBeGreaterThan(100);
  });
});

describe('segmentColor', () => {
  it('gives neighbouring ranks distinct colours', () => {
    expect(segmentColor(0)).not.toBe(segmentColor(1));
    expect(segmentColor(1)).not.toBe(segmentColor(2));
  });

  it('is stable for a rank and wraps for long rosters', () => {
    expect(segmentColor(3)).toBe(segmentColor(3));
    expect(segmentColor(0)).toBe(segmentColor(14));
  });
});

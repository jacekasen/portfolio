import { describe, expect, it } from 'vitest';
import { plotLayout } from './MetricChart';

describe('plotLayout', () => {
  it('spans the full plot height when the metric range is smaller than 1', () => {
    // WS/48 runs from -0.1 to 0.35.
    const { padding, plotHeight, yFor } = plotLayout(600, 400, { min: -0.1, max: 0.35 });

    expect(yFor(0.35)).toBeCloseTo(padding.top);
    expect(yFor(0.125)).toBeCloseTo(padding.top + plotHeight / 2);
    expect(yFor(-0.1)).toBeCloseTo(padding.top + plotHeight);
  });

  it('places ages 18 and 42 on the plot edges', () => {
    const { padding, xFor } = plotLayout(600, 400, { min: -10, max: 15 });

    expect(xFor(18)).toBe(padding.left);
    expect(xFor(42)).toBe(600 - padding.right);
  });
});

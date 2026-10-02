import { describe, expect, it } from 'vitest';
import manifest from '../../../public/data/cs2/radar/manifest.json';
import { CS2_DATASET, cs2Copy } from './dataset';

describe('CS2_DATASET', () => {
  it('matches the radar manifest (update dataset.ts after regenerating it)', () => {
    expect(CS2_DATASET.matches).toBe(manifest.matchCount);
    expect(CS2_DATASET.combatEvents).toBe(manifest.eventCount);
  });

  it('formats copy for display', () => {
    expect(cs2Copy.combatEvents).toBe(
      `${(Math.floor(CS2_DATASET.combatEvents / 1000) * 1000).toLocaleString('en-US')}+`,
    );
    expect(cs2Copy.storageReduction).toMatch(/^>\d+(\.\d)?%$/);
  });
});

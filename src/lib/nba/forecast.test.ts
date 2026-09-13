import { describe, expect, it } from 'vitest';
import {
  bpmProjection,
  directionsDisagree,
  forecastHeadline,
  forecastSummary,
  formatProbability,
  parsePredictionFactors,
  previousSeasonLabel,
  type PlayerPrediction,
} from './forecast';

function prediction(overrides: Partial<PlayerPrediction> = {}): PlayerPrediction {
  return {
    player_id: 'jamesle01',
    player_name: 'LeBron James',
    season: '2026-27',
    age: 41,
    current_bpm: 3.5,
    trajectory: 'regressing',
    improving_probability: 0.24,
    stable_probability: 0.3,
    regressing_probability: 0.46,
    peak_probability: 0.001,
    predicted_bpm_delta: -1.568,
    prediction_factors: [],
    model_version: '1.1.0',
    updated_at: '2026-08-08T02:28:59.638559+00:00',
    ...overrides,
  };
}

describe('formatProbability', () => {
  it('never rounds a real probability to 0% or 100%', () => {
    expect(formatProbability(0.46)).toBe('46%');
    expect(formatProbability(0.001)).toBe('<1%');
    expect(formatProbability(0.998)).toBe('>99%');
    expect(formatProbability(1)).toBe('100%');
  });
});

describe('previousSeasonLabel', () => {
  it('returns the season before the forecast season', () => {
    expect(previousSeasonLabel('2026-27')).toBe('2025-26');
    expect(previousSeasonLabel('2000-01')).toBe('1999-00');
  });
});

describe('forecastHeadline', () => {
  it('describes how decisive the leading outcome is', () => {
    expect(forecastHeadline(prediction())).toBe('Leans toward a decline.');
    expect(
      forecastHeadline(
        prediction({
          trajectory: 'improving',
          improving_probability: 0.64,
          stable_probability: 0.24,
          regressing_probability: 0.12,
        }),
      ),
    ).toBe('Improvement is likely.');
    expect(
      forecastHeadline(
        prediction({
          trajectory: 'stable',
          improving_probability: 0.25,
          stable_probability: 0.39,
          regressing_probability: 0.36,
        }),
      ),
    ).toBe('Too close to call, with holding steady slightly ahead.');
  });
});

describe('bpmProjection', () => {
  it('rounds the change before adding it so the displayed numbers add up', () => {
    expect(bpmProjection(prediction())).toEqual({ current: 3.5, change: -1.6, projected: 1.9 });
    expect(bpmProjection(prediction({ current_bpm: 1.2, predicted_bpm_delta: -1.25 }))).toEqual({
      current: 1.2,
      change: -1.3,
      projected: -0.1,
    });
  });

  it('returns null without a current BPM or projected change', () => {
    expect(bpmProjection(prediction({ predicted_bpm_delta: null }))).toBeNull();
    expect(bpmProjection(prediction({ current_bpm: null }))).toBeNull();
  });
});

describe('directionsDisagree', () => {
  it('flags a most likely outcome that points the other way from the projected change', () => {
    expect(directionsDisagree(prediction())).toBe(false);
    expect(directionsDisagree(prediction({ predicted_bpm_delta: 0.28 }))).toBe(true);
    expect(
      directionsDisagree(prediction({ trajectory: 'stable', predicted_bpm_delta: 0.28 })),
    ).toBe(false);
  });
});

describe('forecastSummary', () => {
  it('states the projection and the leading chance as separate facts', () => {
    expect(forecastSummary(prediction())).toBe('3.5 → 1.9 BPM · 46% chance of a decline');
    expect(forecastSummary(prediction({ predicted_bpm_delta: null }))).toBe(
      '46% chance of a decline',
    );
  });
});

describe('parsePredictionFactors', () => {
  it('turns the pipeline sentences into labeled signals', () => {
    const { signals, noQualifiedSeasonChance } = parsePredictionFactors([
      'Estimated 35% chance of not logging a qualified season next year.',
      'BPM fell by -2.1 last qualified season.',
      'BPM rose by +3.7 last qualified season.',
      'BPM was stable last season (-0.1).',
      'Minutes changed by -19% vs prior season.',
      'Three-season BPM slope is -1.50 per season.',
      'Current BPM is 9.7 below career high through this season.',
      'Player age is 41.',
    ]);

    expect(noQualifiedSeasonChance).toBe(0.35);
    expect(signals.map(({ label, value, direction }) => [label, value, direction])).toEqual([
      ['BPM change last season', '-2.1', 'down'],
      ['BPM change last season', '+3.7', 'up'],
      ['BPM change last season', '-0.1', 'flat'],
      ['Minutes vs prior season', '-19%', 'down'],
      ['Three-season BPM trend', '-1.50 / season', 'down'],
      ['Below career-high BPM', '9.7', null],
      ['Age', '41', null],
    ]);
  });

  it('keeps sentences it does not recognize as plain text', () => {
    const { signals, noQualifiedSeasonChance } = parsePredictionFactors([
      'Usage rate climbed sharply.',
    ]);

    expect(noQualifiedSeasonChance).toBeNull();
    expect(signals).toEqual([
      { text: 'Usage rate climbed sharply.', label: null, value: null, direction: null },
    ]);
    expect(parsePredictionFactors(null).signals).toEqual([]);
  });
});

import { describe, expect, it } from 'vitest';
import { formExtremes, formVerdict, ratingTier, signedRating, yearSpans } from './form-display';

describe('ratingTier', () => {
  it('places ratings on tier boundaries in the higher tier', () => {
    expect(ratingTier(2.34).id).toBe('excellent');
    expect(ratingTier(1.4).id).toBe('excellent');
    expect(ratingTier(1.39).id).toBe('strong');
    expect(ratingTier(1.15).id).toBe('strong');
    expect(ratingTier(1).id).toBe('solid');
    expect(ratingTier(0.99).id).toBe('below');
    expect(ratingTier(0.85).id).toBe('below');
    expect(ratingTier(0.84).id).toBe('poor');
  });
});

describe('signedRating', () => {
  it('always shows the direction of a non-zero change', () => {
    expect(signedRating(0.14)).toBe('+0.14');
    expect(signedRating(-0.1)).toBe('-0.10');
    expect(signedRating(0)).toBe('0.00');
  });
});

describe('formVerdict', () => {
  it('states the recent average relative to the career average', () => {
    expect(
      formVerdict({
        formCategory: 'slump',
        formDelta: -0.1,
        currentFormRating: 1.34,
        careerAvgRating: 1.44,
      }),
    ).toEqual({
      title: 'Slumping',
      summary: 'Last 10 maps average 1.34, 0.10 below the 1.44 career average.',
    });

    expect(
      formVerdict({
        formCategory: 'stable',
        formDelta: 0,
        currentFormRating: 1.2,
        careerAvgRating: 1.2,
      }).summary,
    ).toBe('Last 10 maps average 1.20, level with the 1.20 career average.');
  });
});

describe('yearSpans', () => {
  it('groups consecutive points by calendar year and skips undated points', () => {
    expect(
      yearSpans([
        { matchDate: '2023-11-02' },
        { matchDate: '2023-12-10' },
        { matchDate: '' },
        { matchDate: '2024-01-15' },
        { matchDate: '2024-06-01' },
        { matchDate: '2025-02-20' },
      ]),
    ).toEqual([
      { year: '2023', start: 0, end: 1 },
      { year: '2024', start: 3, end: 4 },
      { year: '2025', start: 5, end: 5 },
    ]);
    expect(yearSpans([])).toEqual([]);
  });
});

describe('formExtremes', () => {
  it('finds the highest and lowest points, keeping the earliest on ties', () => {
    expect(
      formExtremes([
        { deltaVsCareer: 0.1 },
        { deltaVsCareer: 0.3 },
        { deltaVsCareer: -0.2 },
        { deltaVsCareer: 0.3 },
        { deltaVsCareer: -0.2 },
      ]),
    ).toEqual({ peak: 1, low: 2 });
    expect(formExtremes([])).toBeNull();
  });
});

import { describe, expect, it } from 'vitest';
import {
  computeCareerSummary,
  computeRollingRating,
  type PlayerMapStat,
} from './trends';

const mockMaps: PlayerMapStat[] = [
  {
    id: 1,
    matchId: 101,
    eventId: 1,
    mapName: 'Mirage',
    team: 'Spirit',
    opponent: 'FaZe',
    playerNick: 'donk',
    kills: 25,
    deaths: 10,
    plusMinus: 15,
    adr: 110.0,
    kastPct: 80.0,
    rating: 1.80,
    roundSwing: 5.0,
    matchDate: '2024-01-01T10:00:00Z',
    tournament: 'IEM Katowice 2024',
  },
  {
    id: 2,
    matchId: 102,
    eventId: 1,
    mapName: 'Nuke',
    team: 'Spirit',
    opponent: 'FaZe',
    playerNick: 'donk',
    kills: 20,
    deaths: 12,
    plusMinus: 8,
    adr: 95.0,
    kastPct: 75.0,
    rating: 1.40,
    roundSwing: 2.0,
    matchDate: '2024-01-01T12:00:00Z',
    tournament: 'IEM Katowice 2024',
  },
  {
    id: 3,
    matchId: 103,
    eventId: 1,
    mapName: 'Mirage',
    team: 'Spirit',
    opponent: 'NAVI',
    playerNick: 'donk',
    kills: 15,
    deaths: 15,
    plusMinus: 0,
    adr: 80.0,
    kastPct: 70.0,
    rating: 1.00,
    roundSwing: 0.0,
    matchDate: '2024-01-02T10:00:00Z',
    tournament: 'IEM Katowice 2024',
  },
];

describe('computeRollingRating', () => {
  it('correctly smooths ratings with expanding window up to window size', () => {
    const points = computeRollingRating(mockMaps, 2, 'all');
    expect(points).toHaveLength(3);

    // Map 1: only map 1 (1.80)
    expect(points[0].rawRating).toBe(1.80);
    expect(points[0].smoothedRating).toBe(1.80);

    // Map 2: average of map 1 and map 2: (1.80 + 1.40) / 2 = 1.60
    expect(points[1].rawRating).toBe(1.40);
    expect(points[1].smoothedRating).toBe(1.60);

    // Map 3: window size 2 -> average of map 2 and map 3: (1.40 + 1.00) / 2 = 1.20
    expect(points[2].rawRating).toBe(1.00);
    expect(points[2].smoothedRating).toBe(1.20);
  });

  it('filters by specific map name', () => {
    const points = computeRollingRating(mockMaps, 5, 'mirage');
    expect(points).toHaveLength(2);
    expect(points[0].mapName).toBe('Mirage');
    expect(points[1].mapName).toBe('Mirage');
    expect(points[1].smoothedRating).toBe(1.40); // (1.80 + 1.00) / 2
  });

  it('returns empty array when no maps match filter', () => {
    const points = computeRollingRating(mockMaps, 5, 'dust2');
    expect(points).toHaveLength(0);
  });
});

describe('computeCareerSummary', () => {
  it('computes correct aggregates and map breakdown', () => {
    const summary = computeCareerSummary(mockMaps, 2);
    expect(summary).not.toBeNull();
    if (!summary) return;

    expect(summary.playerNick).toBe('donk');
    expect(summary.totalMaps).toBe(3);
    expect(summary.totalKills).toBe(60);
    expect(summary.totalDeaths).toBe(37);
    expect(summary.avgRating).toBe(1.40);
    expect(summary.peakSmoothedRating).toBe(1.80);
    expect(summary.bestMap?.rating).toBe(1.80);
    expect(summary.bestMap?.mapName).toBe('Mirage');

    // Map breakdown: Mirage (2), Nuke (1)
    expect(summary.mapBreakdown).toHaveLength(2);
    expect(summary.mapBreakdown[0].mapName).toBe('Mirage');
    expect(summary.mapBreakdown[0].count).toBe(2);
    expect(summary.mapBreakdown[1].mapName).toBe('Nuke');
    expect(summary.mapBreakdown[1].count).toBe(1);
  });
});

import { computeFormMetrics } from './trends';

describe('computeFormMetrics', () => {
  it('identifies form category, delta, and streak', () => {
    const form = computeFormMetrics(mockMaps, 2);
    expect(form).not.toBeNull();
    if (!form) return;

    expect(form.playerNick).toBe('donk');
    expect(form.careerAvgRating).toBe(1.40);
    // last 10 (all 3): avg is 1.40
    expect(form.currentFormRating).toBe(1.40);
    expect(form.formDelta).toBe(0.00);
    expect(form.formCategory).toBe('stable');
    expect(form.currentStreak.count).toBe(3);
    expect(form.currentStreak.isPositive).toBe(true);
    expect(form.tournamentBreakdown).toHaveLength(1);
    expect(form.tournamentBreakdown[0].tournament).toBe('IEM Katowice 2024');
    expect(form.tournamentBreakdown[0].mapsCount).toBe(3);
  });
});

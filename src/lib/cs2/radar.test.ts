import { describe, expect, it } from 'vitest';
import {
  angleBetween,
  computeRadarMetrics,
  filterRadarEvents,
  findSpatialHotspots,
  formatWeaponName,
  getWeaponCategory,
  pointDistance,
  toCanvasCoords,
  type RadarKillEvent,
  type RadarPlayerDetail,
} from './radar';

describe('CS2 Radar Utilities', () => {
  describe('Weapon Categorization', () => {
    it('correctly maps weapons to standard categories', () => {
      expect(getWeaponCategory('ak47')).toBe('rifles');
      expect(getWeaponCategory('m4a1_silencer')).toBe('rifles');
      expect(getWeaponCategory('awp')).toBe('snipers');
      expect(getWeaponCategory('ssg08')).toBe('snipers');
      expect(getWeaponCategory('deagle')).toBe('pistols');
      expect(getWeaponCategory('usp_silencer')).toBe('pistols');
      expect(getWeaponCategory('mp9')).toBe('smg_heavy');
      expect(getWeaponCategory('negev')).toBe('smg_heavy');
    });

    it('formats weapon display names cleanly', () => {
      expect(formatWeaponName('ak47')).toBe('AK-47');
      expect(formatWeaponName('m4a1_silencer')).toBe('M4A1-S');
      expect(formatWeaponName('awp')).toBe('AWP');
      expect(formatWeaponName('deagle')).toBe('Desert Eagle');
      expect(formatWeaponName('usp_silencer')).toBe('USP-S');
    });
  });

  describe('Canvas Coordinate Mapping', () => {
    it('scales normalized [0.0, 1.0] radar coordinates to canvas dimensions', () => {
      const p = toCanvasCoords(0.5, 0.25, 1024, 1024);
      expect(p.x).toBe(512);
      expect(p.y).toBe(256);

      const corner = toCanvasCoords(1.0, 1.0, 600, 600);
      expect(corner.x).toBe(600);
      expect(corner.y).toBe(600);
    });

    it('calculates Euclidean distance and directional angle correctly', () => {
      const dist = pointDistance(0, 0, 30, 40);
      expect(dist).toBe(50);

      const angle = angleBetween(0, 0, 10, 0);
      expect(angle).toBe(0);

      const angleDown = angleBetween(0, 0, 0, 10);
      expect(angleDown).toBeCloseTo(Math.PI / 2, 4);
    });
  });

  describe('Event Filtering', () => {
    const mockDetail: RadarPlayerDetail = {
      player: 'donk',
      team: 'Team Spirit',
      role: 'Rifler',
      country: 'RU',
      stats: {
        totalKills: 3,
        totalDeaths: 2,
        headshotPct: 66.7,
        avgDistanceMeters: 15.0,
        openingDuelWinPct: 100.0,
        maps: {
          mirage: { kills: 3, deaths: 1 },
          nuke: { kills: 0, deaths: 1 },
        },
      },
      kills: [
        {
          m: 'mirage',
          ax: 0.45,
          ay: 0.6,
          vx: 0.5,
          vy: 0.55,
          w: 'ak47',
          hs: true,
          fk: true,
          tk: false,
          d: 14.5,
          rnd: 1,
          s: 'T',
          opp: 'm0NESY',
        },
        {
          m: 'mirage',
          ax: 0.46,
          ay: 0.61,
          vx: 0.52,
          vy: 0.58,
          w: 'ak47',
          hs: false,
          fk: false,
          tk: true,
          d: 12.0,
          rnd: 3,
          s: 'T',
          opp: 'NiKo',
        },
        {
          m: 'mirage',
          ax: 0.3,
          ay: 0.4,
          vx: 0.35,
          vy: 0.45,
          w: 'deagle',
          hs: true,
          fk: false,
          tk: false,
          d: 8.5,
          rnd: 15,
          s: 'CT',
          opp: 'huNter',
        },
      ],
      deaths: [
        {
          m: 'mirage',
          ax: 0.55,
          ay: 0.5,
          vx: 0.45,
          vy: 0.6,
          w: 'awp',
          hs: false,
          fk: false,
          tk: false,
          d: 28.0,
          rnd: 5,
          s: 'T',
          opp: 'm0NESY',
        },
        {
          m: 'nuke',
          ax: 0.5,
          ay: 0.5,
          vx: 0.4,
          vy: 0.4,
          w: 'm4a1_silencer',
          hs: true,
          fk: true,
          tk: false,
          d: 18.0,
          rnd: 2,
          s: 'CT',
          opp: 'b1t',
        },
      ],
    };

    it('filters by perspective (attacker vs. victim)', () => {
      const attackerRes = filterRadarEvents(mockDetail, {
        map: 'mirage',
        perspective: 'attacker',
        weaponCategory: 'all',
        headshotsOnly: false,
        firstKillOnly: false,
        tradeKillOnly: false,
      });
      expect(attackerRes.events).toHaveLength(3);

      const victimRes = filterRadarEvents(mockDetail, {
        map: 'mirage',
        perspective: 'victim',
        weaponCategory: 'all',
        headshotsOnly: false,
        firstKillOnly: false,
        tradeKillOnly: false,
      });
      expect(victimRes.events).toHaveLength(1);
      expect(victimRes.events[0].opp).toBe('m0NESY');

      const bothRes = filterRadarEvents(mockDetail, {
        map: 'mirage',
        perspective: 'both',
        weaponCategory: 'all',
        headshotsOnly: false,
        firstKillOnly: false,
        tradeKillOnly: false,
      });
      expect(bothRes.events).toHaveLength(4);
    });

    it('filters by weapon category and headshots', () => {
      const pistolRes = filterRadarEvents(mockDetail, {
        map: 'mirage',
        perspective: 'attacker',
        weaponCategory: 'pistols',
        headshotsOnly: false,
        firstKillOnly: false,
        tradeKillOnly: false,
      });
      expect(pistolRes.events).toHaveLength(1);
      expect(pistolRes.events[0].w).toBe('deagle');

      const hsOnly = filterRadarEvents(mockDetail, {
        map: 'mirage',
        perspective: 'attacker',
        weaponCategory: 'rifles',
        headshotsOnly: true,
        firstKillOnly: false,
        tradeKillOnly: false,
      });
      expect(hsOnly.events).toHaveLength(1);
      expect(hsOnly.events[0].hs).toBe(true);
      expect(hsOnly.events[0].rnd).toBe(1);
    });

    it('filters by opening duel / first kill flag', () => {
      const fkRes = filterRadarEvents(mockDetail, {
        map: 'mirage',
        perspective: 'attacker',
        weaponCategory: 'all',
        headshotsOnly: false,
        firstKillOnly: true,
        tradeKillOnly: false,
      });
      expect(fkRes.events).toHaveLength(1);
      expect(fkRes.events[0].fk).toBe(true);
    });

    it('filters by trade kill flag', () => {
      const tkRes = filterRadarEvents(mockDetail, {
        map: 'mirage',
        perspective: 'attacker',
        weaponCategory: 'all',
        headshotsOnly: false,
        firstKillOnly: false,
        tradeKillOnly: true,
      });
      expect(tkRes.events).toHaveLength(1);
      expect(tkRes.events[0].tk).toBe(true);
    });

    it('filters by opponent search substring', () => {
      const oppRes = filterRadarEvents(mockDetail, {
        map: 'mirage',
        perspective: 'attacker',
        weaponCategory: 'all',
        headshotsOnly: false,
        firstKillOnly: false,
        tradeKillOnly: false,
        searchOpponent: 'niko',
      });
      expect(oppRes.events).toHaveLength(1);
      expect(oppRes.events[0].opp).toBe('NiKo');
    });

    it('filters by combat side (T vs CT separator)', () => {
      const tRes = filterRadarEvents(mockDetail, {
        map: 'mirage',
        perspective: 'attacker',
        side: 'T',
        weaponCategory: 'all',
        headshotsOnly: false,
        firstKillOnly: false,
        tradeKillOnly: false,
      });
      expect(tRes.events).toHaveLength(2);
      expect(tRes.events.every((e) => e.s === 'T')).toBe(true);

      const ctRes = filterRadarEvents(mockDetail, {
        map: 'mirage',
        perspective: 'attacker',
        side: 'CT',
        weaponCategory: 'all',
        headshotsOnly: false,
        firstKillOnly: false,
        tradeKillOnly: false,
      });
      expect(ctRes.events).toHaveLength(1);
      expect(ctRes.events[0].s).toBe('CT');
      expect(ctRes.events[0].w).toBe('deagle');

      const allRes = filterRadarEvents(mockDetail, {
        map: 'mirage',
        perspective: 'attacker',
        side: 'all',
        weaponCategory: 'all',
        headshotsOnly: false,
        firstKillOnly: false,
        tradeKillOnly: false,
      });
      expect(allRes.events).toHaveLength(3);
    });
  });

  describe('Combat Metrics Aggregation', () => {
    it('handles empty events gracefully', () => {
      const metrics = computeRadarMetrics([]);
      expect(metrics.totalDuels).toBe(0);
      expect(metrics.tDuelsCount).toBe(0);
      expect(metrics.ctDuelsCount).toBe(0);
      expect(metrics.headshotPct).toBe(0);
      expect(metrics.avgDistanceMeters).toBe(0);
      expect(metrics.topWeapons).toEqual([]);
    });

    it('computes accurate telemetry statistics', () => {
      const events: RadarKillEvent[] = [
        {
          m: 'mirage',
          ax: 0.1,
          ay: 0.1,
          vx: 0.2,
          vy: 0.2,
          w: 'ak47',
          hs: true,
          fk: true,
          tk: false,
          d: 20.0,
          rnd: 1,
          s: 'T',
        },
        {
          m: 'mirage',
          ax: 0.1,
          ay: 0.1,
          vx: 0.2,
          vy: 0.2,
          w: 'ak47',
          hs: true,
          fk: false,
          tk: true,
          d: 10.0,
          rnd: 2,
          s: 'T',
        },
        {
          m: 'mirage',
          ax: 0.1,
          ay: 0.1,
          vx: 0.2,
          vy: 0.2,
          w: 'awp',
          hs: false,
          fk: false,
          tk: false,
          d: 30.0,
          rnd: 3,
          s: 'CT',
        },
        {
          m: 'mirage',
          ax: 0.1,
          ay: 0.1,
          vx: 0.2,
          vy: 0.2,
          w: 'deagle',
          hs: false,
          fk: false,
          tk: false,
          d: 0.0, // Should be ignored in distance calc if <= 0
          rnd: 4,
          s: 'CT',
        },
      ];

      const metrics = computeRadarMetrics(events);
      expect(metrics.totalDuels).toBe(4);
      expect(metrics.tDuelsCount).toBe(2);
      expect(metrics.ctDuelsCount).toBe(2);
      expect(metrics.headshotPct).toBe(50.0); // 2 out of 4 = 50%
      expect(metrics.avgDistanceMeters).toBe(20.0); // (20 + 10 + 30) / 3 = 20.0
      expect(metrics.openingDuelCount).toBe(1);
      expect(metrics.openingDuelPct).toBe(25.0); // 1 out of 4 = 25.0%
      expect(metrics.tradeKillCount).toBe(1);
      expect(metrics.topWeapons[0].weapon).toBe('AK-47');
      expect(metrics.topWeapons[0].count).toBe(2);
      expect(metrics.topWeapons[0].pct).toBe(50.0);
    });
  });

  describe('Spatial Hotspot Detection', () => {
    it('returns top clusters and handles empty events', () => {
      expect(findSpatialHotspots([], 'attacker')).toEqual([]);

      const events: RadarKillEvent[] = [
        { m: 'mirage', ax: 0.5, ay: 0.5, vx: 0.8, vy: 0.8, w: 'ak47', hs: true, fk: false, tk: false, d: 15, rnd: 1 },
        { m: 'mirage', ax: 0.51, ay: 0.49, vx: 0.8, vy: 0.8, w: 'ak47', hs: false, fk: false, tk: false, d: 15, rnd: 2 },
        { m: 'mirage', ax: 0.52, ay: 0.51, vx: 0.8, vy: 0.8, w: 'ak47', hs: true, fk: false, tk: false, d: 15, rnd: 3 },
        { m: 'mirage', ax: 0.1, ay: 0.1, vx: 0.8, vy: 0.8, w: 'ak47', hs: false, fk: false, tk: false, d: 15, rnd: 4 },
        { m: 'mirage', ax: 0.11, ay: 0.12, vx: 0.8, vy: 0.8, w: 'ak47', hs: false, fk: false, tk: false, d: 15, rnd: 5 },
      ];

      const hotspots = findSpatialHotspots(events, 'attacker', 2);
      expect(hotspots.length).toBeGreaterThanOrEqual(1);
      expect(hotspots[0].count).toBeGreaterThanOrEqual(3);
    });
  });
});

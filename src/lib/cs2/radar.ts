/**
 * CS2 Radar Duel & Spatial Telemetry Utilities.
 * Handles radar coordinate projections, weapon classifications, event filtering,
 * and combat performance aggregations across professional active-duty maps.
 */

export type WeaponCategory = 'all' | 'rifles' | 'snipers' | 'pistols' | 'smg_heavy';

export type RadarPerspective = 'attacker' | 'victim' | 'both';

export type CombatSide = 'all' | 'T' | 'CT';

export type HeatmapTheme = 'cyber';

export type SpatialHotspot = {
  x: number; // Normalized X [0, 1]
  y: number; // Normalized Y [0, 1]
  count: number;
  pct: number;
};

export const HEATMAP_PALETTES: Record<HeatmapTheme, { name: string; stops: [number, string][] }> = {
  cyber: {
    name: 'Cyber Neon',
    stops: [
      [0.0, 'rgba(0, 0, 0, 0)'],
      [0.08, 'rgba(76, 29, 149, 0.42)'],
      [0.28, 'rgba(168, 85, 247, 0.64)'],
      [0.52, 'rgba(236, 72, 153, 0.8)'],
      [0.74, 'rgba(251, 146, 60, 0.9)'],
      [0.9, 'rgba(250, 204, 21, 0.95)'],
      [0.985, 'rgba(254, 240, 138, 0.98)'],
      [1.0, 'rgba(255, 255, 255, 1.0)'],
    ],
  },
};

export const ANGLES_KERNEL_RADIUS = 18;

export type RadarKillEvent = {
  m: string; // Map name (e.g. 'mirage', 'dust2')
  ax: number; // Attacker normalized radar X [0.0, 1.0]
  ay: number; // Attacker normalized radar Y [0.0, 1.0]
  vx: number; // Victim normalized radar X [0.0, 1.0]
  vy: number; // Victim normalized radar Y [0.0, 1.0]
  w: string; // Weapon identifier (e.g. 'ak47', 'awp', 'deagle')
  hs: boolean; // Headshot kill flag
  fk: boolean; // First kill / opening duel flag
  tk: boolean; // Trade kill flag
  d: number | null; // Distance in meters
  rnd: number; // Round number
  s?: 'T' | 'CT'; // Player's side during the combat event
  opp?: string; // Opponent player nickname
};

export type RadarPlayerSummary = {
  player: string;
  team: string;
  role: string;
  country: string;
  totalKills: number;
  totalDeaths: number;
  headshotPct: number;
  avgDistanceMeters: number;
  openingDuelWinPct: number;
  maps: string[];
};

export type RadarManifest = {
  version: string;
  generatedAt: string;
  allMaps?: string[];
  activeMaps?: string[];
  players: RadarPlayerSummary[];
  weaponCategories: Record<string, string[]>;
};

export type RadarPlayerDetail = {
  player: string;
  team: string;
  role: string;
  country: string;
  stats: {
    totalKills: number;
    totalDeaths: number;
    headshotPct: number;
    avgDistanceMeters: number;
    openingDuelWinPct: number;
    maps: Record<string, { kills: number; deaths: number }>;
  };
  kills: RadarKillEvent[];
  deaths: RadarKillEvent[];
};

export type RadarFilterOptions = {
  map: string;
  perspective: RadarPerspective;
  side?: CombatSide;
  weaponCategory: WeaponCategory;
  headshotsOnly: boolean;
  firstKillOnly: boolean;
  tradeKillOnly: boolean;
  searchOpponent?: string;
};

export type RadarMetrics = {
  totalDuels: number;
  tDuelsCount: number;
  ctDuelsCount: number;
  headshotPct: number;
  avgDistanceMeters: number;
  openingDuelCount: number;
  openingDuelPct: number;
  tradeKillCount: number;
  topWeapons: { weapon: string; count: number; pct: number }[];
};

// Official weapon categorization mapping
export const WEAPON_CATEGORIES: Record<WeaponCategory, string[]> = {
  all: [],
  rifles: ['ak47', 'm4a1_silencer', 'm4a1', 'galilar', 'famas', 'sg556', 'aug'],
  snipers: ['awp', 'ssg08', 'g3sg1', 'scar20'],
  pistols: [
    'deagle',
    'usp_silencer',
    'glock',
    'p250',
    'cz75a',
    'tec9',
    'fiveseven',
    'elite',
    'revolver',
  ],
  smg_heavy: [
    'mp9',
    'mac10',
    'mp7',
    'mp5sd',
    'ump45',
    'p90',
    'bizon',
    'nova',
    'xm1014',
    'mag7',
    'sawedoff',
    'm249',
    'negev',
  ],
};

export const MAP_DISPLAY_NAMES: Record<string, string> = {
  mirage: 'Mirage',
  inferno: 'Inferno',
  nuke: 'Nuke',
  ancient: 'Ancient',
  anubis: 'Anubis',
  dust2: 'Dust II',
  vertigo: 'Vertigo',
  overpass: 'Overpass',
  train: 'Train',
  cache: 'Cache',
};

/**
 * Identify the high-level category of a weapon.
 */
export function getWeaponCategory(weapon: string): WeaponCategory {
  const clean = weapon.toLowerCase().trim();
  if (WEAPON_CATEGORIES.rifles.includes(clean)) return 'rifles';
  if (WEAPON_CATEGORIES.snipers.includes(clean)) return 'snipers';
  if (WEAPON_CATEGORIES.pistols.includes(clean)) return 'pistols';
  if (WEAPON_CATEGORIES.smg_heavy.includes(clean)) return 'smg_heavy';
  return 'rifles';
}

/**
 * Format weapon name for human presentation.
 */
export function formatWeaponName(weapon: string): string {
  const names: Record<string, string> = {
    ak47: 'AK-47',
    m4a1_silencer: 'M4A1-S',
    m4a1: 'M4A4',
    awp: 'AWP',
    deagle: 'Desert Eagle',
    usp_silencer: 'USP-S',
    glock: 'Glock-18',
    galilar: 'Galil AR',
    famas: 'FAMAS',
    mp9: 'MP9',
    mac10: 'MAC-10',
    ssg08: 'SSG 08 (Scout)',
    p250: 'P250',
    cz75a: 'CZ75-Auto',
    tec9: 'Tec-9',
    fiveseven: 'Five-SeVeN',
    xm1014: 'XM1014',
  };
  return names[weapon.toLowerCase()] || weapon.toUpperCase();
}

/**
 * Filter radar combat events based on perspective, map, weapon, and flags.
 */
export function filterRadarEvents(
  playerDetail: RadarPlayerDetail,
  options: RadarFilterOptions,
): { events: RadarKillEvent[]; perspectiveUsed: RadarPerspective } {
  const cleanMap = options.map.toLowerCase().replace('de_', '');

  let rawList: RadarKillEvent[] = [];
  if (options.perspective === 'attacker') {
    rawList = playerDetail.kills.filter((e) => e.m === cleanMap);
  } else if (options.perspective === 'victim') {
    rawList = playerDetail.deaths.filter((e) => e.m === cleanMap);
  } else {
    // Both perspective: combine kills and deaths
    const k = playerDetail.kills.filter((e) => e.m === cleanMap);
    const d = playerDetail.deaths.filter((e) => e.m === cleanMap);
    rawList = [...k, ...d];
  }

  const filtered = rawList.filter((event) => {
    // Combat side filter (T vs CT)
    if (options.side && options.side !== 'all') {
      if (event.s && event.s !== options.side) {
        return false;
      }
    }

    // Weapon category filter
    if (options.weaponCategory !== 'all') {
      const allowed = WEAPON_CATEGORIES[options.weaponCategory];
      if (!allowed || !allowed.includes(event.w.toLowerCase())) {
        return false;
      }
    }

    // Headshot filter
    if (options.headshotsOnly && !event.hs) {
      return false;
    }

    // Opening duel filter
    if (options.firstKillOnly && !event.fk) {
      return false;
    }

    // Trade kill filter
    if (options.tradeKillOnly && !event.tk) {
      return false;
    }

    // Opponent search filter
    if (options.searchOpponent && options.searchOpponent.trim().length > 0) {
      const q = options.searchOpponent.trim().toLowerCase();
      if (!event.opp || !event.opp.toLowerCase().includes(q)) {
        return false;
      }
    }

    return true;
  });

  return { events: filtered, perspectiveUsed: options.perspective };
}

/**
 * Compute aggregate combat metrics from a list of filtered radar events.
 */
export function computeRadarMetrics(events: RadarKillEvent[]): RadarMetrics {
  if (!events || events.length === 0) {
    return {
      totalDuels: 0,
      tDuelsCount: 0,
      ctDuelsCount: 0,
      headshotPct: 0,
      avgDistanceMeters: 0,
      openingDuelCount: 0,
      openingDuelPct: 0,
      tradeKillCount: 0,
      topWeapons: [],
    };
  }

  let hsCount = 0;
  let distSum = 0;
  let distCount = 0;
  let fkCount = 0;
  let tkCount = 0;
  let tCount = 0;
  let ctCount = 0;
  const weaponTally: Record<string, number> = {};

  for (const ev of events) {
    if (ev.s === 'T') tCount++;
    else if (ev.s === 'CT') ctCount++;

    if (ev.hs) hsCount++;
    if (ev.d !== null && ev.d > 0) {
      distSum += ev.d;
      distCount++;
    }
    if (ev.fk) fkCount++;
    if (ev.tk) tkCount++;

    const w = ev.w.toLowerCase();
    weaponTally[w] = (weaponTally[w] || 0) + 1;
  }

  const total = events.length;
  const headshotPct = Number(((hsCount / total) * 100).toFixed(1));
  const openingDuelPct = Number(((fkCount / total) * 100).toFixed(1));
  const avgDistanceMeters = distCount > 0 ? Number((distSum / distCount).toFixed(1)) : 0;

  const topWeapons = Object.entries(weaponTally)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([weapon, count]) => ({
      weapon: formatWeaponName(weapon),
      count,
      pct: Number(((count / total) * 100).toFixed(1)),
    }));

  return {
    totalDuels: total,
    tDuelsCount: tCount,
    ctDuelsCount: ctCount,
    headshotPct,
    avgDistanceMeters,
    openingDuelCount: fkCount,
    openingDuelPct,
    tradeKillCount: tkCount,
    topWeapons,
  };
}

/**
 * Convert normalized [0.0, 1.0] radar coordinates to canvas pixel coordinates.
 */
export function toCanvasCoords(
  radarX: number,
  radarY: number,
  canvasWidth: number,
  canvasHeight: number,
): { x: number; y: number } {
  return {
    x: Math.round(radarX * canvasWidth),
    y: Math.round(radarY * canvasHeight),
  };
}

/**
 * Euclidean distance in canvas pixels between two points.
 */
export function pointDistance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Directional angle in radians from source to target point.
 */
export function angleBetween(x1: number, y1: number, x2: number, y2: number): number {
  return Math.atan2(y2 - y1, x2 - x1);
}

/**
 * Detect top spatial density clusters across the radar map.
 */
export function findSpatialHotspots(
  events: RadarKillEvent[],
  perspective: RadarPerspective,
  limit: number = 3,
): SpatialHotspot[] {
  if (!events || events.length === 0) return [];

  const points = events.map((ev) => ({
    x: perspective === 'victim' ? ev.vx : ev.ax,
    y: perspective === 'victim' ? ev.vy : ev.ay,
  }));

  const clusterRadius = 0.08;
  const clusters: { x: number; y: number; count: number }[] = [];

  const densityScores = points.map((p) => {
    let neighbors = 0;
    for (const other of points) {
      const dx = p.x - other.x;
      const dy = p.y - other.y;
      if (dx * dx + dy * dy <= clusterRadius * clusterRadius) {
        neighbors++;
      }
    }
    return { ...p, score: neighbors };
  });

  densityScores.sort((a, b) => b.score - a.score);

  for (const candidate of densityScores) {
    if (clusters.length >= limit) break;
    const isSeparated = clusters.every((c) => {
      const dx = c.x - candidate.x;
      const dy = c.y - candidate.y;
      return dx * dx + dy * dy > (clusterRadius * 1.5) ** 2;
    });

    if (isSeparated) {
      clusters.push({
        x: candidate.x,
        y: candidate.y,
        count: candidate.score,
      });
    }
  }

  const total = events.length;
  return clusters.map((c) => ({
    x: Number(c.x.toFixed(3)),
    y: Number(c.y.toFixed(3)),
    count: c.count,
    pct: Number(((c.count / total) * 100).toFixed(1)),
  }));
}

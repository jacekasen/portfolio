import { createSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';

export type PlayerMapStat = {
  id: number;
  matchId: number;
  eventId: number;
  mapName: string;
  team: string;
  opponent: string;
  playerNick: string;
  kills: number;
  deaths: number;
  plusMinus: number;
  adr: number;
  kastPct: number;
  rating: number;
  roundSwing: number | null;
  matchDate: string;
  tournament: string;
};

export type SmoothedMapPoint = {
  mapIndex: number;
  mapName: string;
  matchDate: string;
  tournament: string;
  opponent: string;
  rawRating: number;
  smoothedRating: number;
  kills: number;
  deaths: number;
  adr: number;
  kastPct: number;
  roundSwing: number | null;
};

export type MapBreakdownEntry = {
  mapName: string;
  count: number;
  avgRating: number;
};

export type PlayerCareerSummary = {
  playerNick: string;
  totalMaps: number;
  avgRating: number;
  peakSmoothedRating: number;
  peakWindowInfo: {
    mapIndex: number;
    tournament: string;
    date: string;
    mapName: string;
  } | null;
  currentFormRating: number;
  totalKills: number;
  totalDeaths: number;
  kdRatio: number;
  avgAdr: number;
  avgKast: number;
  bestMap: {
    mapName: string;
    rating: number;
    tournament: string;
    date: string;
    kills: number;
    deaths: number;
  } | null;
  mapBreakdown: MapBreakdownEntry[];
};

type SupabaseStatRow = {
  id: number;
  match_id: number;
  event_id: number;
  map_name: string;
  team: string;
  player_nick: string;
  kills: number;
  deaths: number;
  plus_minus: number | null;
  adr: number | null;
  kast_pct: number | null;
  rating: number;
  round_swing: number | null;
  cs2_matches: {
    team1: string;
    team2: string;
    match_date: string | null;
    cs2_events: {
      name: string;
    } | null;
  } | null;
};

export async function fetchPlayerMapHistory(playerNick: string): Promise<PlayerMapStat[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = createSupabaseClient();

  const { data, error } = await supabase
    .from('cs2_player_stats')
    .select(`
      id,
      match_id,
      event_id,
      map_name,
      team,
      player_nick,
      kills,
      deaths,
      plus_minus,
      adr,
      kast_pct,
      rating,
      round_swing,
      cs2_matches (
        team1,
        team2,
        match_date,
        cs2_events (
          name
        )
      )
    `)
    .ilike('player_nick', playerNick.trim())
    .order('id', { ascending: true })
    .returns<SupabaseStatRow[]>();

  if (error || !data) {
    console.error('Error fetching CS2 player map history:', error);
    return [];
  }

  const mapped: PlayerMapStat[] = data.map((row) => {
    const match = row.cs2_matches;
    const team1 = match?.team1 ?? '';
    const team2 = match?.team2 ?? '';
    const opponent = team1.toLowerCase() === row.team.toLowerCase() ? team2 : team1;
    const tournament = match?.cs2_events?.name ?? 'Tier 1 Event';
    const matchDate = match?.match_date ?? '';

    return {
      id: row.id,
      matchId: row.match_id,
      eventId: row.event_id,
      mapName: row.map_name,
      team: row.team,
      opponent: opponent || 'Opponent',
      playerNick: row.player_nick,
      kills: row.kills ?? 0,
      deaths: row.deaths ?? 0,
      plusMinus: row.plus_minus ?? 0,
      adr: row.adr ?? 0,
      kastPct: row.kast_pct ?? 0,
      rating: Number(row.rating.toFixed(2)),
      roundSwing: row.round_swing !== null ? Number(row.round_swing.toFixed(2)) : null,
      matchDate,
      tournament,
    };
  });

  // Sort chronologically by matchDate (with id fallback for stability)
  return mapped.sort((a, b) => {
    if (a.matchDate && b.matchDate && a.matchDate !== b.matchDate) {
      return a.matchDate.localeCompare(b.matchDate);
    }
    return a.id - b.id;
  });
}

/**
 * Computes rolling window moving average smoothing for map-to-map HLTV Rating 3.0.
 */
export function computeRollingRating(
  maps: PlayerMapStat[],
  windowSize: number,
  mapFilter: string = 'all',
): SmoothedMapPoint[] {
  const filtered =
    mapFilter === 'all'
      ? maps
      : maps.filter((m) => m.mapName.toLowerCase() === mapFilter.toLowerCase());

  if (filtered.length === 0) {
    return [];
  }

  const effectiveWindow = Math.max(1, windowSize);
  const result: SmoothedMapPoint[] = [];

  for (let i = 0; i < filtered.length; i++) {
    const start = Math.max(0, i - effectiveWindow + 1);
    const windowSlice = filtered.slice(start, i + 1);
    const sum = windowSlice.reduce((acc, curr) => acc + curr.rating, 0);
    const smoothed = Number((sum / windowSlice.length).toFixed(3));

    const current = filtered[i];
    result.push({
      mapIndex: i + 1,
      mapName: current.mapName,
      matchDate: current.matchDate,
      tournament: current.tournament,
      opponent: current.opponent,
      rawRating: current.rating,
      smoothedRating: smoothed,
      kills: current.kills,
      deaths: current.deaths,
      adr: current.adr,
      kastPct: current.kastPct,
      roundSwing: current.roundSwing,
    });
  }

  return result;
}

/**
 * Calculates career totals, peak smoothed form, current form, and per-map breakdown.
 */
export function computeCareerSummary(
  maps: PlayerMapStat[],
  windowSize: number = 10,
): PlayerCareerSummary | null {
  if (maps.length === 0) {
    return null;
  }

  const playerNick = maps[0].playerNick;
  const totalMaps = maps.length;
  const totalKills = maps.reduce((sum, m) => sum + m.kills, 0);
  const totalDeaths = maps.reduce((sum, m) => sum + m.deaths, 0);
  const kdRatio = totalDeaths > 0 ? Number((totalKills / totalDeaths).toFixed(2)) : totalKills;
  const avgRating = Number((maps.reduce((sum, m) => sum + m.rating, 0) / totalMaps).toFixed(2));
  const avgAdr = Number((maps.reduce((sum, m) => sum + m.adr, 0) / totalMaps).toFixed(1));
  const avgKast = Number((maps.reduce((sum, m) => sum + m.kastPct, 0) / totalMaps).toFixed(1));

  // Smoothed points for peak detection
  const smoothedAll = computeRollingRating(maps, windowSize, 'all');
  let peakSmoothedRating = 0;
  let peakWindowInfo: PlayerCareerSummary['peakWindowInfo'] = null;

  for (const point of smoothedAll) {
    if (point.smoothedRating > peakSmoothedRating) {
      peakSmoothedRating = point.smoothedRating;
      peakWindowInfo = {
        mapIndex: point.mapIndex,
        tournament: point.tournament,
        date: point.matchDate,
        mapName: point.mapName,
      };
    }
  }

  // Current Form: Last 10 maps average
  const recentSlice = maps.slice(-10);
  const currentFormRating =
    recentSlice.length > 0
      ? Number((recentSlice.reduce((sum, m) => sum + m.rating, 0) / recentSlice.length).toFixed(2))
      : avgRating;

  // Best single map
  let bestMap: PlayerCareerSummary['bestMap'] = null;
  for (const m of maps) {
    if (!bestMap || m.rating > bestMap.rating) {
      bestMap = {
        mapName: m.mapName,
        rating: m.rating,
        tournament: m.tournament,
        date: m.matchDate,
        kills: m.kills,
        deaths: m.deaths,
      };
    }
  }

  // Map breakdown
  const mapCounts: Record<string, { count: number; sumRating: number }> = {};
  for (const m of maps) {
    if (!mapCounts[m.mapName]) {
      mapCounts[m.mapName] = { count: 0, sumRating: 0 };
    }
    mapCounts[m.mapName].count += 1;
    mapCounts[m.mapName].sumRating += m.rating;
  }

  const mapBreakdown: MapBreakdownEntry[] = Object.entries(mapCounts)
    .map(([mapName, data]) => ({
      mapName,
      count: data.count,
      avgRating: Number((data.sumRating / data.count).toFixed(2)),
    }))
    .sort((a, b) => b.count - a.count);

  return {
    playerNick,
    totalMaps,
    avgRating,
    peakSmoothedRating,
    peakWindowInfo,
    currentFormRating,
    totalKills,
    totalDeaths,
    kdRatio,
    avgAdr,
    avgKast,
    bestMap,
    mapBreakdown,
  };
}

export type FormCategory = 'surging' | 'in_form' | 'stable' | 'cooling' | 'slump';

export type MomentumDataPoint = {
  mapIndex: number;
  mapName: string;
  matchDate: string;
  tournament: string;
  opponent: string;
  rawRating: number;
  rollingRating: number;
  deltaVsCareer: number;
  kills: number;
  deaths: number;
  adr: number;
  kastPct: number;
};

export type TournamentFormSummary = {
  tournament: string;
  eventDate: string;
  mapsCount: number;
  avgRating: number;
  deltaVsCareer: number;
  kills: number;
  deaths: number;
  adr: number;
};

export type PlayerFormAnalysis = {
  playerNick: string;
  careerAvgRating: number;
  currentFormRating: number;
  formDelta: number;
  formCategory: FormCategory;
  formLabel: string;
  currentStreak: {
    count: number;
    description: string;
    isPositive: boolean;
  };
  impactRate: number;
  recentMaps: PlayerMapStat[];
  momentumPoints: MomentumDataPoint[];
  tournamentBreakdown: TournamentFormSummary[];
};

/**
 * Computes deep form analytics, relative momentum deltas, and tournament breakdowns.
 */
export function computeFormMetrics(
  maps: PlayerMapStat[],
  windowSize: number = 10,
): PlayerFormAnalysis | null {
  if (maps.length === 0) return null;

  const playerNick = maps[0].playerNick;
  const totalMaps = maps.length;
  const careerAvgRating = Number(
    (maps.reduce((acc, m) => acc + m.rating, 0) / totalMaps).toFixed(2),
  );

  // Last 10 maps current form
  const recent10 = maps.slice(-10);
  const currentFormRating = Number(
    (recent10.reduce((acc, m) => acc + m.rating, 0) / recent10.length).toFixed(2),
  );
  const formDelta = Number((currentFormRating - careerAvgRating).toFixed(2));

  let formCategory: FormCategory = 'stable';
  let formLabel = 'At Baseline';

  if (formDelta >= 0.10) {
    formCategory = 'surging';
    formLabel = 'Surging / Red Hot';
  } else if (formDelta >= 0.03) {
    formCategory = 'in_form';
    formLabel = 'In Form';
  } else if (formDelta <= -0.10) {
    formCategory = 'slump';
    formLabel = 'Slumping / Cold';
  } else if (formDelta <= -0.03) {
    formCategory = 'cooling';
    formLabel = 'Cooling Off';
  }

  // Calculate current streak
  let positiveStreak = 0;
  let negativeStreak = 0;
  for (let i = maps.length - 1; i >= 0; i--) {
    if (maps[i].rating >= 1.0) {
      if (negativeStreak > 0) break;
      positiveStreak++;
    } else {
      if (positiveStreak > 0) break;
      negativeStreak++;
    }
  }

  const isPositive = positiveStreak > 0;
  const streakCount = isPositive ? positiveStreak : negativeStreak;
  const streakDesc = isPositive
    ? `${streakCount} consecutive maps with rating \u2265 1.00`
    : `${streakCount} consecutive maps below 1.00 rating`;

  // Impact rate: % of last 20 maps with rating >= 1.15
  const recent20 = maps.slice(-20);
  const highImpactCount = recent20.filter((m) => m.rating >= 1.15).length;
  const impactRate = Number(((highImpactCount / (recent20.length || 1)) * 100).toFixed(0));

  // Momentum data points
  const rolling = computeRollingRating(maps, windowSize, 'all');
  const momentumPoints: MomentumDataPoint[] = rolling.map((pt) => ({
    mapIndex: pt.mapIndex,
    mapName: pt.mapName,
    matchDate: pt.matchDate,
    tournament: pt.tournament,
    opponent: pt.opponent,
    rawRating: pt.rawRating,
    rollingRating: pt.smoothedRating,
    deltaVsCareer: Number((pt.smoothedRating - careerAvgRating).toFixed(3)),
    kills: pt.kills,
    deaths: pt.deaths,
    adr: pt.adr,
    kastPct: pt.kastPct,
  }));

  // Tournament breakdown
  const tournamentMap = new Map<
    string,
    {
      tournament: string;
      eventDate: string;
      mapsCount: number;
      sumRating: number;
      kills: number;
      deaths: number;
      sumAdr: number;
    }
  >();

  for (const m of maps) {
    const existing = tournamentMap.get(m.tournament);
    if (!existing) {
      tournamentMap.set(m.tournament, {
        tournament: m.tournament,
        eventDate: m.matchDate,
        mapsCount: 1,
        sumRating: m.rating,
        kills: m.kills,
        deaths: m.deaths,
        sumAdr: m.adr,
      });
    } else {
      existing.mapsCount++;
      existing.sumRating += m.rating;
      existing.kills += m.kills;
      existing.deaths += m.deaths;
      existing.sumAdr += m.adr;
      if (m.matchDate && (!existing.eventDate || m.matchDate > existing.eventDate)) {
        existing.eventDate = m.matchDate;
      }
    }
  }

  const tournamentBreakdown: TournamentFormSummary[] = Array.from(tournamentMap.values())
    .map((t) => {
      const avg = Number((t.sumRating / t.mapsCount).toFixed(2));
      return {
        tournament: t.tournament,
        eventDate: t.eventDate,
        mapsCount: t.mapsCount,
        avgRating: avg,
        deltaVsCareer: Number((avg - careerAvgRating).toFixed(2)),
        kills: t.kills,
        deaths: t.deaths,
        adr: Number((t.sumAdr / t.mapsCount).toFixed(1)),
      };
    })
    .sort((a, b) => b.eventDate.localeCompare(a.eventDate));

  return {
    playerNick,
    careerAvgRating,
    currentFormRating,
    formDelta,
    formCategory,
    formLabel,
    currentStreak: {
      count: streakCount,
      description: streakDesc,
      isPositive,
    },
    impactRate,
    recentMaps: recent20,
    momentumPoints,
    tournamentBreakdown,
  };
}

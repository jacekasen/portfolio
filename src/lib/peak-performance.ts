import { unstable_cache } from 'next/cache';
import { createSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';

export type PeakMetricKey = 'bpm' | 'per' | 'ws' | 'ws_per_48';

export type PeakCurvePoint = {
  age: number;
  count: number;
  mean: number;
  lower: number;
  upper: number;
};

export type PeakPlayer = {
  id: string;
  name: string;
  peaks: Record<PeakMetricKey, [number, number]>;
};

export type PeakSummary = {
  count: number;
  median: number;
  mean: number;
  q1: number;
  q3: number;
};

export type PeakRobustness = {
  correlation: number;
  meanDifference: number;
  samePercent: number;
};

export type PeakSensitivity = {
  baselineMedian: number;
  strictMedian: number;
  baselineCount: number;
  strictCount: number;
};

export type PeakPerformanceData = {
  curves: Record<PeakMetricKey, PeakCurvePoint[]>;
  players: PeakPlayer[];
  summaries: Record<PeakMetricKey, PeakSummary>;
  robustness: Record<PeakMetricKey, PeakRobustness>;
  sensitivity: Record<PeakMetricKey, PeakSensitivity>;
  meta: {
    sourceRows: number;
    eligiblePlayers: number;
    startSeason: string;
    endSeason: string;
    minimumGames: number;
    minimumMinutes: number;
    strictGames: number;
    strictMinutes: number;
  };
};

type SeasonRow = {
  player_name: string;
  player_url: string;
  year_id: string;
  age: number;
  games: number;
  mp: number;
  per: number;
  bpm: number;
  ws: number;
  ws_per_48: number;
};

type PeakResult = {
  rawAge: number;
  smoothAge: number;
};

const METRICS: PeakMetricKey[] = ['bpm', 'per', 'ws', 'ws_per_48'];
const START_SEASON = '1992-93';
const PAGE_SIZE = 1000;
const MINIMUM_GAMES = 40;
const MINIMUM_MINUTES = 1000;
const STRICT_GAMES = 50;
const STRICT_MINUTES = 1500;

export const getPeakPerformanceData = unstable_cache(buildPeakPerformanceData, ['nba-peak-v3'], {
  revalidate: 86_400,
  tags: ['nba-peak-performance'],
});

async function buildPeakPerformanceData(): Promise<PeakPerformanceData> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured.');
  }

  const rows = await fetchSeasonRows();
  if (!rows.length) {
    throw new Error('Supabase returned no qualifying NBA seasons.');
  }

  const grouped = groupByPlayer(rows);
  const eligibleGroups = Array.from(grouped.values()).filter(hasConsecutiveThreeSeasonWindow);
  const players = eligibleGroups.map((seasons) => ({
    id: seasons[0].player_url,
    name: seasons[0].player_name,
    peaks: Object.fromEntries(
      METRICS.map((metric) => {
        const peak = findPeak(seasons, metric);
        return [metric, [peak.rawAge, peak.smoothAge]];
      }),
    ) as Record<PeakMetricKey, [number, number]>,
  }));

  const eligibleIds = new Set(players.map((player) => player.id));
  const eligibleRows = rows.filter((row) => eligibleIds.has(row.player_url));
  const strictGroups = Array.from(
    groupByPlayer(
      rows.filter((row) => row.games >= STRICT_GAMES && row.mp >= STRICT_MINUTES),
    ).values(),
  ).filter(hasConsecutiveThreeSeasonWindow);

  const summaries = {} as Record<PeakMetricKey, PeakSummary>;
  const robustness = {} as Record<PeakMetricKey, PeakRobustness>;
  const sensitivity = {} as Record<PeakMetricKey, PeakSensitivity>;
  const curves = {} as Record<PeakMetricKey, PeakCurvePoint[]>;

  for (const metric of METRICS) {
    const pairs = players.map((player) => player.peaks[metric]);
    const smoothAges = pairs.map((pair) => pair[1]);
    const rawAges = pairs.map((pair) => pair[0]);
    const strictAges = strictGroups.map((seasons) => findPeak(seasons, metric).smoothAge);

    summaries[metric] = summarize(smoothAges);
    robustness[metric] = comparePeakAges(rawAges, smoothAges);
    sensitivity[metric] = {
      baselineMedian: quantile(smoothAges, 0.5),
      strictMedian: quantile(strictAges, 0.5),
      baselineCount: smoothAges.length,
      strictCount: strictAges.length,
    };
    curves[metric] = buildAgeCurve(eligibleRows, metric);
  }

  return {
    curves,
    players,
    summaries,
    robustness,
    sensitivity,
    meta: {
      sourceRows: rows.length,
      eligiblePlayers: players.length,
      startSeason: rows[0].year_id,
      endSeason: rows.at(-1)?.year_id ?? rows[0].year_id,
      minimumGames: MINIMUM_GAMES,
      minimumMinutes: MINIMUM_MINUTES,
      strictGames: STRICT_GAMES,
      strictMinutes: STRICT_MINUTES,
    },
  };
}

async function fetchSeasonRows(): Promise<SeasonRow[]> {
  const supabase = createSupabaseClient();
  const rows: SeasonRow[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from('nba_player_seasons')
      .select('player_name, player_url, year_id, age, games, mp, per, bpm, ws, ws_per_48')
      .gte('year_id', START_SEASON)
      .order('year_id', { ascending: true })
      .order('player_url', { ascending: true })
      .range(from, from + PAGE_SIZE - 1)
      .returns<SeasonRow[]>();

    if (error) throw new Error(`Could not load NBA seasons from Supabase: ${error.message}`);
    if (!data?.length) break;

    rows.push(...data.map(normalizeRow).filter(isValidRow));
    if (data.length < PAGE_SIZE) break;
  }

  return rows.sort(
    (a, b) =>
      seasonStart(a.year_id) - seasonStart(b.year_id) || a.player_url.localeCompare(b.player_url),
  );
}

function normalizeRow(row: SeasonRow): SeasonRow {
  return {
    ...row,
    age: Number(row.age),
    games: Number(row.games),
    mp: Number(row.mp),
    per: Number(row.per),
    bpm: Number(row.bpm),
    ws: Number(row.ws),
    ws_per_48: Number(row.ws_per_48),
  };
}

function isValidRow(row: SeasonRow) {
  return (
    Boolean(row.player_name && row.player_url && row.year_id) &&
    [row.age, row.games, row.mp, row.per, row.bpm, row.ws, row.ws_per_48].every(Number.isFinite)
  );
}

function groupByPlayer(rows: SeasonRow[]) {
  const groups = new Map<string, SeasonRow[]>();

  for (const row of rows) {
    const group = groups.get(row.player_url) ?? [];
    group.push(row);
    groups.set(row.player_url, group);
  }

  for (const group of groups.values()) {
    group.sort((a, b) => seasonStart(a.year_id) - seasonStart(b.year_id));
  }

  return groups;
}

function hasConsecutiveThreeSeasonWindow(rows: SeasonRow[]) {
  return rows.some(
    (row, index) =>
      index > 0 &&
      index < rows.length - 1 &&
      seasonStart(row.year_id) - seasonStart(rows[index - 1].year_id) === 1 &&
      seasonStart(rows[index + 1].year_id) - seasonStart(row.year_id) === 1,
  );
}

function findPeak(rows: SeasonRow[], metric: PeakMetricKey): PeakResult {
  const raw = [...rows].sort((a, b) => compareCandidates(b, a, metric))[0];
  const windows = rows.flatMap((row, index) => {
    if (
      index === 0 ||
      index === rows.length - 1 ||
      seasonStart(row.year_id) - seasonStart(rows[index - 1].year_id) !== 1 ||
      seasonStart(rows[index + 1].year_id) - seasonStart(row.year_id) !== 1
    ) {
      return [];
    }

    return [
      {
        center: row,
        value: (rows[index - 1][metric] + row[metric] + rows[index + 1][metric]) / 3,
      },
    ];
  });
  const smooth = windows.sort(
    (a, b) =>
      b.value - a.value ||
      b.center.games - a.center.games ||
      b.center.mp / b.center.games - a.center.mp / a.center.games ||
      seasonStart(b.center.year_id) - seasonStart(a.center.year_id),
  )[0];

  return { rawAge: raw.age, smoothAge: smooth.center.age };
}

function compareCandidates(a: SeasonRow, b: SeasonRow, metric: PeakMetricKey) {
  return (
    a[metric] - b[metric] ||
    a.games - b.games ||
    a.mp / a.games - b.mp / b.games ||
    seasonStart(a.year_id) - seasonStart(b.year_id)
  );
}

function summarize(values: number[]): PeakSummary {
  return {
    count: values.length,
    median: quantile(values, 0.5),
    mean: mean(values),
    q1: quantile(values, 0.25),
    q3: quantile(values, 0.75),
  };
}

function comparePeakAges(raw: number[], smooth: number[]): PeakRobustness {
  const differences = raw.map((value, index) => value - smooth[index]);

  return {
    correlation: pearson(raw, smooth),
    meanDifference: mean(differences),
    samePercent:
      (differences.filter((difference) => difference === 0).length / differences.length) * 100,
  };
}

function buildAgeCurve(rows: SeasonRow[], metric: PeakMetricKey): PeakCurvePoint[] {
  const byAge = new Map<number, number[]>();

  for (const row of rows) {
    const values = byAge.get(row.age) ?? [];
    values.push(row[metric]);
    byAge.set(row.age, values);
  }

  return Array.from(byAge.entries())
    .filter(([, values]) => values.length >= 20)
    .sort(([a], [b]) => a - b)
    .map(([age, values]) => {
      const average = mean(values);
      const variance =
        values.reduce((total, value) => total + (value - average) ** 2, 0) /
        Math.max(values.length - 1, 1);
      const margin = 1.96 * Math.sqrt(variance / values.length);

      return {
        age,
        count: values.length,
        mean: round(average, 4),
        lower: round(average - margin, 4),
        upper: round(average + margin, 4),
      };
    });
}

function quantile(values: number[], probability: number) {
  if (!values.length) return Number.NaN;
  const sorted = [...values].sort((a, b) => a - b);
  const position = (sorted.length - 1) * probability;
  const lower = Math.floor(position);
  const fraction = position - lower;
  return sorted[lower + 1] === undefined
    ? sorted[lower]
    : sorted[lower] + fraction * (sorted[lower + 1] - sorted[lower]);
}

function mean(values: number[]) {
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function pearson(a: number[], b: number[]) {
  const meanA = mean(a);
  const meanB = mean(b);
  const numerator = a.reduce(
    (total, value, index) => total + (value - meanA) * (b[index] - meanB),
    0,
  );
  const denominator = Math.sqrt(
    a.reduce((total, value) => total + (value - meanA) ** 2, 0) *
      b.reduce((total, value) => total + (value - meanB) ** 2, 0),
  );
  return denominator ? numerator / denominator : 0;
}

function seasonStart(season: string) {
  return Number.parseInt(season.slice(0, 4), 10);
}

function round(value: number, digits: number) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

import { unstable_cache } from 'next/cache';
import { createSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';

/**
 * Data access for the salary pipeline tables published by the Board Man Gets Paid repository:
 * `player_salaries`, `salary_caps`, and `team_season_salaries`.
 *
 * Every query is scoped to the current view. The full historical table is never loaded
 * into the browser.
 */

export type SalaryQuality =
  | 'reported'
  | 'historical_unknown_quality'
  | 'imputed_or_estimated'
  | 'missing';

export type PlayerSalaryRow = {
  player_id: string;
  player_name: string;
  player_url: string;
  season: string;
  season_start: number;
  team: string;
  salary: number | null;
  salary_cap: number | null;
  cap_share: number | null;
  team_payroll_share: number | null;
  salary_quality: SalaryQuality;
};

export type TeamIndexEntry = {
  team: string;
  /**
   * Salary records on the team-season. Note that the upstream
   * `team_season_salaries.team_known_player_count` counts every record, including rows
   * with no salary amount, so it is not a count of known salaries. Payroll coverage on
   * the page is always recomputed from the records actually returned.
   */
  recordCount: number;
  payrollShareAvailable: boolean;
};

export type SeasonIndexEntry = {
  season: string;
  seasonStart: number;
  /** Null when the pipeline has no salary-cap value for the season. */
  salaryCap: number | null;
  teams: TeamIndexEntry[];
  /** League-wide salary records for the season. */
  recordCount: number;
  /** Flagged when coverage is far below the typical season (for example 1986-87). */
  sparse: boolean;
};

export type SalaryIndex = {
  seasons: SeasonIndexEntry[];
  updatedAt: string | null;
};

export type TeamSeasonSalaries = {
  team: string;
  season: string;
  salaryCap: number | null;
  rows: PlayerSalaryRow[];
};

export type CapShareLeader = PlayerSalaryRow;

const PLAYER_SALARY_COLUMNS =
  'player_id, player_name, player_url, season, season_start, team, salary, salary_cap, cap_share, team_payroll_share, salary_quality';

const PAGE_SIZE = 1000;

/**
 * Minimum known salaries on a team-season before payroll composition is trustworthy.
 * Mirrors MIN_TEAM_ROWS_FOR_PAYROLL_SHARE in the salary pipeline (salary/config.py).
 */
export const MIN_ROWS_FOR_PAYROLL_SHARE = 8;

/** A season is flagged sparse when its coverage falls far below the median season. */
const SPARSE_SEASON_RATIO = 0.5;

export const getSalaryIndex = unstable_cache(buildSalaryIndex, ['nba-salary-index-v1'], {
  revalidate: 86_400,
  tags: ['nba-salaries'],
});

type TeamSeasonSummaryRow = {
  team: string;
  season: string;
  season_start: number;
  salary_cap: number | null;
  team_known_player_count: number | null;
  payroll_share_available: boolean;
  updated_at: string | null;
};

type SalaryCapRow = {
  season: string;
  season_start: number;
  salary_cap: number | null;
};

/**
 * Builds the season/team inventory that drives both selectors.
 *
 * Reads the small pre-aggregated `team_season_salaries` table rather than scanning
 * the ~19.5k row salary table.
 */
async function buildSalaryIndex(): Promise<SalaryIndex> {
  requireSupabase();
  const supabase = createSupabaseClient();

  const summaries: TeamSeasonSummaryRow[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from('team_season_salaries')
      .select(
        'team, season, season_start, salary_cap, team_known_player_count, payroll_share_available, updated_at',
      )
      .order('season_start', { ascending: false })
      .order('team', { ascending: true })
      .range(from, from + PAGE_SIZE - 1)
      .returns<TeamSeasonSummaryRow[]>();

    if (error) throw new Error(`Could not load salary team-seasons: ${error.message}`);
    if (!data?.length) break;

    summaries.push(...data);
    if (data.length < PAGE_SIZE) break;
  }

  if (!summaries.length) throw new Error('Supabase returned no salary team-seasons.');

  const { data: capRows, error: capError } = await supabase
    .from('salary_caps')
    .select('season, season_start, salary_cap')
    .order('season_start', { ascending: false })
    .returns<SalaryCapRow[]>();

  if (capError) throw new Error(`Could not load salary caps: ${capError.message}`);

  const capsBySeason = new Map((capRows ?? []).map((row) => [row.season, row.salary_cap]));
  const bySeason = new Map<string, SeasonIndexEntry>();

  for (const summary of summaries) {
    const entry = bySeason.get(summary.season) ?? {
      season: summary.season,
      seasonStart: summary.season_start,
      salaryCap: capsBySeason.get(summary.season) ?? summary.salary_cap ?? null,
      teams: [],
      recordCount: 0,
      sparse: false,
    };

    entry.teams.push({
      team: summary.team,
      recordCount: summary.team_known_player_count ?? 0,
      payrollShareAvailable: Boolean(summary.payroll_share_available),
    });
    entry.recordCount += summary.team_known_player_count ?? 0;
    bySeason.set(summary.season, entry);
  }

  const seasons = Array.from(bySeason.values()).sort((a, b) => b.seasonStart - a.seasonStart);
  for (const season of seasons) {
    season.teams.sort((a, b) => a.team.localeCompare(b.team));
  }

  markSparseSeasons(seasons);

  const updatedAt = summaries
    .map((summary) => summary.updated_at)
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1);

  return { seasons, updatedAt: updatedAt ?? null };
}

/**
 * Flags seasons whose league-wide salary coverage is far below the median season.
 * Derived from the data rather than hardcoding known-bad seasons.
 */
export function markSparseSeasons(seasons: SeasonIndexEntry[]) {
  const counts = seasons.map((season) => season.recordCount).sort((a, b) => a - b);
  if (!counts.length) return seasons;

  const median = counts[Math.floor(counts.length / 2)];
  const threshold = median * SPARSE_SEASON_RATIO;
  for (const season of seasons) {
    season.sparse = season.recordCount < threshold;
  }

  return seasons;
}

/** Every salary record for one team-season, ordered by cap share. */
export async function getTeamSeasonSalaries(
  team: string,
  season: string,
): Promise<TeamSeasonSalaries> {
  requireSupabase();
  const supabase = createSupabaseClient();

  const { data, error } = await supabase
    .from('player_salaries')
    .select(PLAYER_SALARY_COLUMNS)
    .eq('team', team)
    .eq('season', season)
    .order('cap_share', { ascending: false, nullsFirst: false })
    .order('player_name', { ascending: true })
    .returns<PlayerSalaryRow[]>();

  if (error) throw new Error(`Could not load ${team} ${season} salaries: ${error.message}`);

  const rows = data ?? [];
  return {
    team,
    season,
    salaryCap: rows.find((row) => row.salary_cap !== null)?.salary_cap ?? null,
    rows,
  };
}

/**
 * A player's full salary history. Seasons split across teams keep one row per team,
 * exactly as the canonical dataset stores them.
 */
export async function getPlayerSalaryHistory(playerId: string): Promise<PlayerSalaryRow[]> {
  requireSupabase();
  const supabase = createSupabaseClient();

  const { data, error } = await supabase
    .from('player_salaries')
    .select(PLAYER_SALARY_COLUMNS)
    .eq('player_id', playerId)
    .order('season_start', { ascending: true })
    .order('team', { ascending: true })
    .returns<PlayerSalaryRow[]>();

  if (error) throw new Error(`Could not load salary history: ${error.message}`);
  return data ?? [];
}

/** Highest cap shares across the dataset, optionally restricted to one season. */
export async function getCapShareLeaders(
  season: string | null,
  limit: number,
): Promise<CapShareLeader[]> {
  requireSupabase();
  const supabase = createSupabaseClient();

  let query = supabase
    .from('player_salaries')
    .select(PLAYER_SALARY_COLUMNS)
    .not('cap_share', 'is', null)
    .order('cap_share', { ascending: false, nullsFirst: false })
    .order('player_name', { ascending: true })
    .limit(limit);

  if (season) query = query.eq('season', season);

  const { data, error } = await query.returns<CapShareLeader[]>();
  if (error) throw new Error(`Could not load cap share leaders: ${error.message}`);
  return data ?? [];
}

function requireSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured.');
  }
}

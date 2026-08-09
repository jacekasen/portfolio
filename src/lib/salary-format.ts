import {
  MIN_ROWS_FOR_PAYROLL_SHARE,
  type PlayerSalaryRow,
  type SalaryIndex,
  type SeasonIndexEntry,
} from '@/lib/salaries';
import { teamName } from '@/lib/nba-teams';

/**
 * Formatting and derivation helpers for the salary explorer.
 * Everything here is pure so the numbers on the page can be tested directly.
 */

export type SalaryMeasure = 'cap' | 'salary';

export const NOT_RECORDED = 'Not recorded';
export const NO_VALUE = '—';

/**
 * Some player names were stored as UTF-8 bytes decoded as Latin-1 during ingestion
 * ("VarejÃ£o"). Repair them for display only; the fix belongs in the pipeline.
 */
export function repairPlayerName(name: string) {
  if (!/[ÃÂÅÄÐ]/.test(name)) return name;

  const codePoints = Array.from(name, (character) => character.charCodeAt(0));
  if (codePoints.some((code) => code > 0xff)) return name;

  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(codePoints));
  } catch {
    return name;
  }
}

/** Compact dollars for chart labels: $35.0M, $661.6K, $0. */
export function formatSalary(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return NOT_RECORDED;
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toLocaleString('en-US')}`;
}

/** Exact dollars for tooltips and tables: $35,000,000. */
export function formatSalaryExact(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return NOT_RECORDED;
  return `$${Math.round(value).toLocaleString('en-US')}`;
}

/** Percentage points, as stored by the pipeline (25.0 renders as "25.0%"). */
export function formatPercent(value: number | null | undefined, digits = 1) {
  if (value === null || value === undefined || !Number.isFinite(value)) return NO_VALUE;
  return `${value.toFixed(digits)}%`;
}

export function capShareLabel(row: PlayerSalaryRow) {
  return formatPercent(row.cap_share);
}

/** Human-readable form of the pipeline's salary_quality labels. */
export function qualityLabel(quality: PlayerSalaryRow['salary_quality']) {
  switch (quality) {
    case 'reported':
      return 'Reported contract';
    case 'imputed_or_estimated':
      return 'Estimated or imputed';
    case 'missing':
      return 'No salary recorded';
    default:
      return 'Historical data quality: uncertain';
  }
}

export function measureValue(row: PlayerSalaryRow, measure: SalaryMeasure) {
  return measure === 'cap' ? row.cap_share : row.salary;
}

export function measureLabel(measure: SalaryMeasure) {
  return measure === 'cap' ? 'Cap share' : 'Salary';
}

export function formatMeasure(value: number | null, measure: SalaryMeasure) {
  return measure === 'cap' ? formatPercent(value) : formatSalary(value);
}

/**
 * Deterministic ordering: highest value first, unknown values last,
 * then player name and team so equal values never shuffle between renders.
 */
export function sortSalaryRows(rows: PlayerSalaryRow[], measure: SalaryMeasure = 'cap') {
  return [...rows].sort((a, b) => {
    const left = measureValue(a, measure);
    const right = measureValue(b, measure);

    if (left === null && right === null) return compareIdentity(a, b);
    if (left === null) return 1;
    if (right === null) return -1;
    if (left !== right) return right - left;
    return compareIdentity(a, b);
  });
}

function compareIdentity(a: PlayerSalaryRow, b: PlayerSalaryRow) {
  return (
    repairPlayerName(a.player_name).localeCompare(repairPlayerName(b.player_name)) ||
    a.team.localeCompare(b.team) ||
    a.player_id.localeCompare(b.player_id)
  );
}

export type TeamSeasonSummary = {
  totalRecords: number;
  knownCount: number;
  missingCount: number;
  /** Sum of known salaries. Null when the team-season has no known salary. */
  knownPayroll: number | null;
  /** Known payroll as a percentage of the salary cap. Can exceed 100. */
  payrollVsCap: number | null;
  largestCapShare: number | null;
  topEarner: PlayerSalaryRow | null;
  salaryCap: number | null;
};

/** Team-season headline numbers, computed from the rows actually shown on the page. */
export function summarizeTeamSeason(
  rows: PlayerSalaryRow[],
  salaryCap: number | null,
): TeamSeasonSummary {
  const known = rows.filter((row) => row.salary !== null);
  const knownPayroll = known.length
    ? known.reduce((total, row) => total + (row.salary ?? 0), 0)
    : null;
  const sorted = sortSalaryRows(known, 'cap');
  const topEarner = sorted[0] ?? null;

  return {
    totalRecords: rows.length,
    knownCount: known.length,
    missingCount: rows.length - known.length,
    knownPayroll,
    payrollVsCap:
      knownPayroll !== null && salaryCap !== null && salaryCap > 0
        ? (knownPayroll / salaryCap) * 100
        : null,
    largestCapShare: topEarner?.cap_share ?? null,
    topEarner,
    salaryCap,
  };
}

export type PayrollSegment = {
  row: PlayerSalaryRow;
  /** Share of the team's known payroll, in percentage points. */
  share: number;
};

export type PayrollComposition =
  | { available: true; payroll: number; segments: PayrollSegment[] }
  | {
      available: false;
      reason: 'no-records' | 'insufficient-coverage';
      knownCount: number;
      required: number;
    };

/**
 * Team payroll composition for the donut view.
 *
 * Shares are salary divided by the team's known payroll — never cap share, which is
 * measured against the league cap and does not sum to 100.
 */
export function buildPayrollComposition(rows: PlayerSalaryRow[]): PayrollComposition {
  const known = sortSalaryRows(
    rows.filter((row) => row.salary !== null && (row.salary ?? 0) > 0),
    'salary',
  );
  const payroll = known.reduce((total, row) => total + (row.salary ?? 0), 0);

  if (!known.length || payroll <= 0) {
    return {
      available: false,
      reason: 'no-records',
      knownCount: known.length,
      required: MIN_ROWS_FOR_PAYROLL_SHARE,
    };
  }

  if (known.length < MIN_ROWS_FOR_PAYROLL_SHARE) {
    return {
      available: false,
      reason: 'insufficient-coverage',
      knownCount: known.length,
      required: MIN_ROWS_FOR_PAYROLL_SHARE,
    };
  }

  return {
    available: true,
    payroll,
    segments: known.map((row) => ({ row, share: ((row.salary ?? 0) / payroll) * 100 })),
  };
}

export type SeasonRecords = {
  season: string;
  seasonStart: number;
  salaryCap: number | null;
  records: PlayerSalaryRow[];
  /**
   * Largest single-team record of the season. The career line follows this record;
   * records are never summed, because a traded player's rows are not consistently
   * split amounts in the source data.
   */
  primary: PlayerSalaryRow | null;
  multiTeam: boolean;
};

/** Groups a player's salary history into seasons, preserving multi-team records. */
export function groupSeasonRecords(history: PlayerSalaryRow[]): SeasonRecords[] {
  const bySeason = new Map<string, SeasonRecords>();

  for (const row of history) {
    const entry = bySeason.get(row.season) ?? {
      season: row.season,
      seasonStart: row.season_start,
      salaryCap: row.salary_cap,
      records: [],
      primary: null,
      multiTeam: false,
    };
    entry.records.push(row);
    entry.salaryCap = entry.salaryCap ?? row.salary_cap;
    bySeason.set(row.season, entry);
  }

  return Array.from(bySeason.values())
    .map((entry) => {
      const ranked = sortSalaryRows(entry.records, 'cap');
      return {
        ...entry,
        records: ranked,
        primary: ranked.find((row) => row.cap_share !== null) ?? null,
        multiTeam: entry.records.length > 1,
      };
    })
    .sort((a, b) => a.seasonStart - b.seasonStart);
}

/**
 * Resolves the requested season against the data, falling back to the most recent
 * season that actually has records. The latest season is never assumed.
 */
export function resolveSeason(index: SalaryIndex, requested?: string | null) {
  if (!index.seasons.length) return null;
  return index.seasons.find((season) => season.season === requested?.trim()) ?? index.seasons[0];
}

/**
 * Resolves the requested team within a season. The default is the first team by display
 * name whose payroll coverage is complete enough to be worth landing on.
 */
export function resolveTeam(season: SeasonIndexEntry | null, requested?: string | null) {
  if (!season?.teams.length) return null;

  const wanted = requested?.trim().toUpperCase();
  const match = season.teams.find((team) => team.team === wanted);
  if (match) return match.team;

  const byName = [...season.teams].sort((a, b) => teamName(a.team).localeCompare(teamName(b.team)));
  return (byName.find((team) => team.payrollShareAvailable) ?? byName[0]).team;
}

/** Highest cap share a player ever reached, across every recorded team row. */
export function careerPeak(history: PlayerSalaryRow[]) {
  return sortSalaryRows(history, 'cap').find((row) => row.cap_share !== null) ?? null;
}

import { describe, expect, it } from 'vitest';
import {
  buildPayrollComposition,
  careerPeak,
  formatPercent,
  formatSalary,
  formatSalaryExact,
  groupSeasonRecords,
  repairPlayerName,
  resolveSeason,
  resolveTeam,
  sortSalaryRows,
  summarizeTeamSeason,
} from './salary-format';
import type { PlayerSalaryRow, SalaryIndex, SeasonIndexEntry } from './salaries';

function row(overrides: Partial<PlayerSalaryRow> = {}): PlayerSalaryRow {
  return {
    player_id: 'playerx01',
    player_name: 'Player X',
    player_url: 'https://www.basketball-reference.com/players/p/playerx01.html',
    season: '2024-25',
    season_start: 2024,
    team: 'LAC',
    salary: 10_000_000,
    salary_cap: 140_588_000,
    cap_share: 7.113,
    team_payroll_share: 5.8,
    salary_quality: 'historical_unknown_quality',
    ...overrides,
  };
}

function seasonEntry(overrides: Partial<SeasonIndexEntry> = {}): SeasonIndexEntry {
  return {
    season: '2024-25',
    seasonStart: 2024,
    salaryCap: 140_588_000,
    teams: [],
    recordCount: 600,
    sparse: false,
    ...overrides,
  };
}

describe('salary formatting', () => {
  it('formats dollars compactly without inventing precision', () => {
    expect(formatSalary(49_205_800)).toBe('$49.2M');
    expect(formatSalary(661_628)).toBe('$661.6K');
    expect(formatSalary(0)).toBe('$0');
  });

  it('never renders a missing salary as zero', () => {
    expect(formatSalary(null)).toBe('Not recorded');
    expect(formatSalaryExact(null)).toBe('Not recorded');
    expect(formatSalary(undefined)).toBe('Not recorded');
  });

  it('formats exact dollars for tooltips', () => {
    expect(formatSalaryExact(49_205_800)).toBe('$49,205,800');
  });

  it('formats cap share as stored percentage points', () => {
    expect(formatPercent(35)).toBe('35.0%');
    expect(formatPercent(123.712186)).toBe('123.7%');
    expect(formatPercent(null)).toBe('—');
  });

  it('repairs names stored as UTF-8 bytes decoded as Latin-1', () => {
    expect(repairPlayerName('Bogdan BogdanoviÄ')).toBe('Bogdan Bogdanović');
    expect(repairPlayerName('Anderson VarejÃ£o')).toBe('Anderson Varejão');
  });

  it('leaves correctly encoded names alone', () => {
    expect(repairPlayerName('Nikola Jokić')).toBe('Nikola Jokić');
    expect(repairPlayerName('LeBron James')).toBe('LeBron James');
  });
});

describe('sortSalaryRows', () => {
  it('sorts by the active measure, highest first', () => {
    const rows = [
      row({ player_id: 'a', cap_share: 12, salary: 5 }),
      row({ player_id: 'b', cap_share: 31, salary: 1 }),
      row({ player_id: 'c', cap_share: 20, salary: 3 }),
    ];

    expect(sortSalaryRows(rows, 'cap').map((entry) => entry.player_id)).toEqual(['b', 'c', 'a']);
    expect(sortSalaryRows(rows, 'salary').map((entry) => entry.player_id)).toEqual(['a', 'c', 'b']);
  });

  it('puts unknown values last and breaks ties deterministically', () => {
    const rows = [
      row({ player_id: 'z', player_name: 'Zoe', cap_share: null, salary: null }),
      row({ player_id: 'b', player_name: 'Bob', cap_share: 10 }),
      row({ player_id: 'a', player_name: 'Ann', cap_share: 10 }),
    ];

    const sorted = sortSalaryRows(rows, 'cap');
    expect(sorted.map((entry) => entry.player_name)).toEqual(['Ann', 'Bob', 'Zoe']);
    expect(sortSalaryRows([...rows].reverse(), 'cap').map((entry) => entry.player_name)).toEqual([
      'Ann',
      'Bob',
      'Zoe',
    ]);
  });
});

describe('summarizeTeamSeason', () => {
  const rows = [
    row({ player_id: 'a', salary: 49_205_800, cap_share: 35 }),
    row({ player_id: 'b', salary: 33_653_846, cap_share: 23.9 }),
    row({ player_id: 'c', salary: null, cap_share: null, salary_quality: 'missing' }),
  ];

  it('counts only records that carry an amount', () => {
    const summary = summarizeTeamSeason(rows, 140_588_000);

    expect(summary.totalRecords).toBe(3);
    expect(summary.knownCount).toBe(2);
    expect(summary.missingCount).toBe(1);
    expect(summary.knownPayroll).toBe(82_859_646);
  });

  it('lets payroll run past the cap', () => {
    const overCap = [
      row({ player_id: 'a', salary: 100_000_000 }),
      row({ player_id: 'b', salary: 80_000_000 }),
    ];

    expect(summarizeTeamSeason(overCap, 140_588_000).payrollVsCap).toBeGreaterThan(100);
  });

  it('reports unknown rather than zero when the cap or payroll is missing', () => {
    expect(summarizeTeamSeason(rows, null).payrollVsCap).toBeNull();
    expect(summarizeTeamSeason([rows[2]], 140_588_000).knownPayroll).toBeNull();
    expect(summarizeTeamSeason([], 140_588_000).topEarner).toBeNull();
  });

  it('reports the largest cap share and its player', () => {
    const summary = summarizeTeamSeason(rows, 140_588_000);
    expect(summary.largestCapShare).toBe(35);
    expect(summary.topEarner?.player_id).toBe('a');
  });
});

describe('buildPayrollComposition', () => {
  const roster = Array.from({ length: 8 }, (_, index) =>
    row({ player_id: `p${index}`, salary: (index + 1) * 1_000_000, cap_share: (index + 1) * 5 }),
  );

  it('divides the team payroll, not the salary cap', () => {
    const composition = buildPayrollComposition(roster);
    if (!composition.available) throw new Error('expected an available composition');

    const total = composition.segments.reduce((sum, segment) => sum + segment.share, 0);
    expect(total).toBeCloseTo(100, 6);
    expect(composition.payroll).toBe(36_000_000);

    // Cap shares are measured against the league cap and must not be normalized to 100.
    const capShareTotal = roster.reduce((sum, entry) => sum + (entry.cap_share ?? 0), 0);
    expect(capShareTotal).toBe(180);
  });

  it('disables itself when the roster is too thinly covered to be a whole', () => {
    const composition = buildPayrollComposition(roster.slice(0, 3));

    expect(composition.available).toBe(false);
    if (composition.available) return;
    expect(composition.reason).toBe('insufficient-coverage');
    expect(composition.knownCount).toBe(3);
    expect(composition.required).toBe(8);
  });

  it('reports no records when nothing has an amount', () => {
    const composition = buildPayrollComposition([row({ salary: null, cap_share: null })]);

    expect(composition.available).toBe(false);
    if (composition.available) return;
    expect(composition.reason).toBe('no-records');
  });
});

describe('groupSeasonRecords', () => {
  const history = [
    row({ season: '2021-22', season_start: 2021, team: 'ATL', cap_share: 20, salary: 20 }),
    row({ season: '2022-23', season_start: 2022, team: 'BOS', cap_share: 5.24, salary: 6_479_000 }),
    row({
      season: '2022-23',
      season_start: 2022,
      team: 'SAS',
      cap_share: 10.51,
      salary: 13_000_000,
    }),
  ];

  it('keeps every team record for a season instead of collapsing them', () => {
    const seasons = groupSeasonRecords(history);

    expect(seasons.map((season) => season.season)).toEqual(['2021-22', '2022-23']);
    expect(seasons[1].records).toHaveLength(2);
    expect(seasons[1].multiTeam).toBe(true);
    expect(seasons[1].primary?.team).toBe('SAS');
  });

  it('does not sum multi-team records into a single season value', () => {
    const seasons = groupSeasonRecords(history);
    const combined = 5.24 + 10.51;

    expect(seasons[1].primary?.cap_share).toBe(10.51);
    expect(seasons[1].primary?.cap_share).not.toBe(combined);
  });

  it('finds the career peak across every record', () => {
    expect(careerPeak(history)?.season).toBe('2021-22');
    expect(careerPeak([])).toBeNull();
  });
});

describe('season and team resolution', () => {
  const index: SalaryIndex = {
    updatedAt: null,
    seasons: [
      seasonEntry({
        season: '2025-26',
        seasonStart: 2025,
        teams: [
          { team: 'LAC', recordCount: 21, payrollShareAvailable: true },
          { team: 'ATL', recordCount: 24, payrollShareAvailable: true },
        ],
      }),
      seasonEntry({
        season: '1986-87',
        seasonStart: 1986,
        sparse: true,
        teams: [
          { team: 'BOS', recordCount: 3, payrollShareAvailable: false },
          { team: 'NYK', recordCount: 12, payrollShareAvailable: true },
        ],
      }),
    ],
  };

  it('honours a requested season and team', () => {
    const season = resolveSeason(index, '1986-87');
    expect(season?.season).toBe('1986-87');
    expect(resolveTeam(season, 'bos')).toBe('BOS');
  });

  it('falls back to the newest season in the data rather than a hardcoded one', () => {
    expect(resolveSeason(index, '2099-00')?.season).toBe('2025-26');
    expect(resolveSeason(index, undefined)?.season).toBe('2025-26');
  });

  it('defaults to a team with usable payroll coverage', () => {
    expect(resolveTeam(index.seasons[0], 'XXX')).toBe('ATL');
    expect(resolveTeam(index.seasons[1], undefined)).toBe('NYK');
  });

  it('returns null when there is nothing to select', () => {
    expect(resolveSeason({ seasons: [], updatedAt: null }, '2024-25')).toBeNull();
    expect(resolveTeam(null, 'LAC')).toBeNull();
  });
});

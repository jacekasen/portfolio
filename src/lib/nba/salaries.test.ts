import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/cache', () => ({
  unstable_cache: (fn: unknown) => fn,
}));

const createSupabaseClient = vi.fn();
vi.mock('@/lib/supabase', () => ({
  createSupabaseClient: () => createSupabaseClient(),
  isSupabaseConfigured: () => true,
}));

const {
  getCapShareLeaders,
  getPlayerSalaryHistory,
  getSalaryIndex,
  getTeamSeasonSalaries,
  markSparseSeasons,
} = await import('./salaries');

type QueryLog = {
  table: string;
  eq: [string, unknown][];
  order: [string, unknown][];
  range: [number, number][];
  not: [string, string, unknown][];
  limit: number | null;
};

type TableResult = { data: unknown[] | null; error: { message: string } | null };

/** Minimal stand-in for the supabase-js query builder, recording how it was called. */
function stubClient(results: Record<string, TableResult | TableResult[]>) {
  const logs: QueryLog[] = [];
  const cursors: Record<string, number> = {};

  const client = {
    from(table: string) {
      const log: QueryLog = { table, eq: [], order: [], range: [], not: [], limit: null };
      logs.push(log);

      const builder = {
        select: () => builder,
        eq: (column: string, value: unknown) => {
          log.eq.push([column, value]);
          return builder;
        },
        not: (column: string, operator: string, value: unknown) => {
          log.not.push([column, operator, value]);
          return builder;
        },
        order: (column: string, options: unknown) => {
          log.order.push([column, options]);
          return builder;
        },
        range: (from: number, to: number) => {
          log.range.push([from, to]);
          return builder;
        },
        limit: (value: number) => {
          log.limit = value;
          return builder;
        },
        returns: () => {
          const configured = results[table];
          if (Array.isArray(configured)) {
            const index = cursors[table] ?? 0;
            cursors[table] = index + 1;
            return Promise.resolve(configured[index] ?? { data: [], error: null });
          }
          return Promise.resolve(configured ?? { data: [], error: null });
        },
      };

      return builder;
    },
  };

  return { client, logs };
}

function salaryRow(overrides: Record<string, unknown> = {}) {
  return {
    player_id: 'playerx01',
    player_name: 'Player X',
    player_url: 'https://www.basketball-reference.com/players/p/playerx01.html',
    season: '2024-25',
    season_start: 2024,
    team: 'LAC',
    salary: 10_000_000,
    salary_cap: 140_588_000,
    cap_share: 7.11,
    team_payroll_share: 5.8,
    salary_quality: 'historical_unknown_quality',
    ...overrides,
  };
}

beforeEach(() => {
  createSupabaseClient.mockReset();
});

describe('getTeamSeasonSalaries', () => {
  it('queries only the selected team-season, ranked by cap share', async () => {
    const { client, logs } = stubClient({
      player_salaries: { data: [salaryRow()], error: null },
    });
    createSupabaseClient.mockReturnValue(client);

    const result = await getTeamSeasonSalaries('LAC', '2024-25');

    expect(logs[0].table).toBe('player_salaries');
    expect(logs[0].eq).toEqual([
      ['team', 'LAC'],
      ['season', '2024-25'],
    ]);
    expect(logs[0].order[0]).toEqual(['cap_share', { ascending: false, nullsFirst: false }]);
    expect(result.rows).toHaveLength(1);
    expect(result.salaryCap).toBe(140_588_000);
  });

  it('reports a missing salary cap as null instead of zero', async () => {
    const { client } = stubClient({
      player_salaries: { data: [salaryRow({ salary_cap: null, cap_share: null })], error: null },
    });
    createSupabaseClient.mockReturnValue(client);

    const result = await getTeamSeasonSalaries('BOS', '1986-87');
    expect(result.salaryCap).toBeNull();
  });

  it('returns an empty roster rather than throwing when nothing matches', async () => {
    const { client } = stubClient({ player_salaries: { data: [], error: null } });
    createSupabaseClient.mockReturnValue(client);

    await expect(getTeamSeasonSalaries('VAN', '2024-25')).resolves.toMatchObject({ rows: [] });
  });

  it('surfaces database errors', async () => {
    const { client } = stubClient({
      player_salaries: { data: null, error: { message: 'permission denied' } },
    });
    createSupabaseClient.mockReturnValue(client);

    await expect(getTeamSeasonSalaries('LAC', '2024-25')).rejects.toThrow('permission denied');
  });
});

describe('getPlayerSalaryHistory', () => {
  it('reads one player in season order, keeping multi-team rows', async () => {
    const { client, logs } = stubClient({
      player_salaries: {
        data: [
          salaryRow({ season: '2022-23', season_start: 2022, team: 'BOS' }),
          salaryRow({ season: '2022-23', season_start: 2022, team: 'SAS' }),
        ],
        error: null,
      },
    });
    createSupabaseClient.mockReturnValue(client);

    const rows = await getPlayerSalaryHistory('gallida01');

    expect(logs[0].eq).toEqual([['player_id', 'gallida01']]);
    expect(logs[0].order).toEqual([
      ['season_start', { ascending: true }],
      ['team', { ascending: true }],
    ]);
    expect(rows).toHaveLength(2);
  });
});

describe('getCapShareLeaders', () => {
  it('filters to one season when asked', async () => {
    const { client, logs } = stubClient({ player_salaries: { data: [salaryRow()], error: null } });
    createSupabaseClient.mockReturnValue(client);

    await getCapShareLeaders('1996-97', 25);

    expect(logs[0].eq).toEqual([['season', '1996-97']]);
    expect(logs[0].limit).toBe(25);
    expect(logs[0].not).toEqual([['cap_share', 'is', null]]);
  });

  it('spans every season when no season is given', async () => {
    const { client, logs } = stubClient({ player_salaries: { data: [], error: null } });
    createSupabaseClient.mockReturnValue(client);

    await getCapShareLeaders(null, 10);

    expect(logs[0].eq).toEqual([]);
    expect(logs[0].limit).toBe(10);
  });
});

describe('getSalaryIndex', () => {
  it('builds the season and team inventory from the pre-aggregated table', async () => {
    const { client, logs } = stubClient({
      team_season_salaries: {
        data: [
          {
            team: 'LAC',
            season: '2024-25',
            season_start: 2024,
            salary_cap: 140_588_000,
            team_known_player_count: 21,
            payroll_share_available: true,
            updated_at: '2026-08-09T20:47:50.262579+00:00',
          },
          {
            team: 'ATL',
            season: '2024-25',
            season_start: 2024,
            salary_cap: 140_588_000,
            team_known_player_count: 24,
            payroll_share_available: true,
            updated_at: '2026-08-09T20:47:50.262579+00:00',
          },
          {
            team: 'BOS',
            season: '1986-87',
            season_start: 1986,
            salary_cap: 4_945_000,
            team_known_player_count: 3,
            payroll_share_available: false,
            updated_at: '2026-08-09T20:47:50.262579+00:00',
          },
        ],
        error: null,
      },
      salary_caps: {
        data: [
          { season: '2024-25', season_start: 2024, salary_cap: 140_588_000 },
          { season: '1986-87', season_start: 1986, salary_cap: 4_945_000 },
        ],
        error: null,
      },
    });
    createSupabaseClient.mockReturnValue(client);

    const index = await getSalaryIndex();

    expect(logs[0].table).toBe('team_season_salaries');
    expect(index.seasons.map((season) => season.season)).toEqual(['2024-25', '1986-87']);
    expect(index.seasons[0].teams.map((team) => team.team)).toEqual(['ATL', 'LAC']);
    expect(index.seasons[0].salaryCap).toBe(140_588_000);
    expect(index.seasons[0].recordCount).toBe(45);
    expect(index.updatedAt).toBe('2026-08-09T20:47:50.262579+00:00');
  });

  it('flags historically thin seasons instead of presenting them as complete', async () => {
    const { client } = stubClient({
      team_season_salaries: {
        data: [
          ...Array.from({ length: 3 }, (_, index) => ({
            team: `T${index}`,
            season: '2024-25',
            season_start: 2024,
            salary_cap: 140_588_000,
            team_known_player_count: 20,
            payroll_share_available: true,
            updated_at: null,
          })),
          {
            team: 'BOS',
            season: '1986-87',
            season_start: 1986,
            salary_cap: 4_945_000,
            team_known_player_count: 3,
            payroll_share_available: false,
            updated_at: null,
          },
        ],
        error: null,
      },
      salary_caps: { data: [], error: null },
    });
    createSupabaseClient.mockReturnValue(client);

    const index = await getSalaryIndex();

    expect(index.seasons.find((season) => season.season === '2024-25')?.sparse).toBe(false);
    expect(index.seasons.find((season) => season.season === '1986-87')?.sparse).toBe(true);
  });

  it('fails loudly when the salary tables are unreachable', async () => {
    const { client } = stubClient({
      team_season_salaries: { data: null, error: { message: 'schema cache miss' } },
    });
    createSupabaseClient.mockReturnValue(client);

    await expect(getSalaryIndex()).rejects.toThrow('schema cache miss');
  });
});

describe('markSparseSeasons', () => {
  it('flags seasons below half the median coverage', () => {
    const seasons = [400, 420, 380, 40].map((recordCount, index) => ({
      season: `season-${index}`,
      seasonStart: 2000 + index,
      salaryCap: 1,
      teams: [],
      recordCount,
      sparse: false,
    }));

    markSparseSeasons(seasons);

    expect(seasons.map((season) => season.sparse)).toEqual([false, false, false, true]);
  });
});

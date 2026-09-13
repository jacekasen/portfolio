import { describe, expect, it, vi } from 'vitest';

vi.mock('next/cache', () => ({
  unstable_cache: (fn: unknown) => fn,
}));

type Row = { player_name: string; year_id: string };
type FakeQuery = {
  select(): FakeQuery;
  order(): FakeQuery;
  range(from: number, to: number): FakeQuery;
  returns(): Promise<{ data: Row[]; error: null }>;
};

const rows: Row[] = Array.from({ length: 1500 }, (_, index) => ({
  player_name: index === 1499 ? 'Nikola Jokić' : `Player ${index % 600}`,
  year_id: index === 42 ? '2025-26' : '2010-11',
}));
const ranges: [number, number][] = [];

vi.mock('@/lib/supabase', () => ({
  createSupabaseClient: () => ({
    from: () => {
      let page: Row[] = [];
      const query: FakeQuery = {
        select: () => query,
        order: () => query,
        range: (from, to) => {
          ranges.push([from, to]);
          page = rows.slice(from, to + 1);
          return query;
        },
        returns: async () => ({ data: page, error: null }),
      };
      return query;
    },
  }),
}));

const { getPlayerIndex } = await import('./player-index');

describe('getPlayerIndex', () => {
  it('pages through every season, keeps each name once and finds the newest season', async () => {
    const index = await getPlayerIndex();

    expect(ranges).toEqual([
      [0, 999],
      [1000, 1999],
    ]);
    expect(index.players).toHaveLength(601);
    expect(index.players).toContainEqual({ name: 'Nikola Jokić', key: 'nikola jokic' });
    expect(index.latestSeason).toBe('2025-26');
  });
});

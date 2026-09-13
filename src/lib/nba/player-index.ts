import { unstable_cache } from 'next/cache';
import { createSupabaseClient } from '@/lib/supabase';
import { playerSearchKey, type PlayerNameEntry } from './players';

const PAGE_SIZE = 1000;

export type PlayerIndex = {
  players: PlayerNameEntry[];
  latestSeason: string | null;
};

/**
 * Every player name in `nba_player_seasons` plus the newest season loaded. Player search runs
 * against this index because PostgREST has no accent-insensitive match.
 */
export const getPlayerIndex = unstable_cache(buildPlayerIndex, ['nba-player-index-v1'], {
  revalidate: 86_400,
  tags: ['nba-player-index'],
});

async function buildPlayerIndex(): Promise<PlayerIndex> {
  const supabase = createSupabaseClient();
  const names = new Set<string>();
  let latestSeason: string | null = null;

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from('nba_player_seasons')
      .select('player_name, year_id')
      .order('id', { ascending: true })
      .range(from, from + PAGE_SIZE - 1)
      .returns<{ player_name: string; year_id: string }[]>();

    if (error) throw new Error(`Could not load NBA player names: ${error.message}`);
    if (!data?.length) break;

    for (const row of data) {
      names.add(row.player_name);
      if (!latestSeason || row.year_id > latestSeason) latestSeason = row.year_id;
    }
    if (data.length < PAGE_SIZE) break;
  }

  return {
    players: Array.from(names, (name) => ({ name, key: playerSearchKey(name) })),
    latestSeason,
  };
}

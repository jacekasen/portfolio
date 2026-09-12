import { NextResponse } from 'next/server';
import { createSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';

const MIN_QUERY_LENGTH = 2;
const MAX_SUGGESTIONS = 10;

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get('q')?.trim().slice(0, 50) || '';

  if (query.length < MIN_QUERY_LENGTH || !isSupabaseConfigured()) {
    return NextResponse.json([]);
  }

  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from('cs2_player_stats')
    .select('player_nick')
    .ilike('player_nick', `%${query}%`)
    .limit(300);

  if (error || !data) {
    return NextResponse.json({ error: 'Could not search players.' }, { status: 500 });
  }

  // Count frequency of player occurrences to rank more active tier-1 players first
  const freqMap = new Map<string, number>();
  for (const row of data) {
    freqMap.set(row.player_nick, (freqMap.get(row.player_nick) ?? 0) + 1);
  }

  const normalizedQuery = query.toLocaleLowerCase();
  const uniqueNames = Array.from(freqMap.keys());

  const suggestions = uniqueNames
    .sort((a, b) => {
      const aStartsWith = a.toLocaleLowerCase().startsWith(normalizedQuery);
      const bStartsWith = b.toLocaleLowerCase().startsWith(normalizedQuery);
      if (aStartsWith !== bStartsWith) return aStartsWith ? -1 : 1;
      // Secondary: sort by total appearances (activity/prominence)
      const aCount = freqMap.get(a) ?? 0;
      const bCount = freqMap.get(b) ?? 0;
      if (aCount !== bCount) return bCount - aCount;
      return a.localeCompare(b);
    })
    .slice(0, MAX_SUGGESTIONS);

  return NextResponse.json(suggestions, {
    headers: {
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
    },
  });
}

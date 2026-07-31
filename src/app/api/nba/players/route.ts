import { NextResponse } from 'next/server';
import { createSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';

const MIN_QUERY_LENGTH = 2;
const MAX_SUGGESTIONS = 8;

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get('q')?.trim().slice(0, 50) || '';

  if (query.length < MIN_QUERY_LENGTH || !isSupabaseConfigured()) {
    return NextResponse.json([]);
  }

  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from('nba_player_seasons')
    .select('player_name')
    .ilike('player_name', `%${query}%`)
    .order('player_name')
    .limit(500);

  if (error) {
    return NextResponse.json({ error: 'Could not search players.' }, { status: 500 });
  }

  const normalizedQuery = query.toLocaleLowerCase();
  const uniqueNames = Array.from(new Set(data.map((row) => row.player_name)));
  const suggestions = uniqueNames
    .sort((a, b) => {
      const aStartsWith = a.toLocaleLowerCase().startsWith(normalizedQuery);
      const bStartsWith = b.toLocaleLowerCase().startsWith(normalizedQuery);
      if (aStartsWith !== bStartsWith) return aStartsWith ? -1 : 1;
      return a.localeCompare(b);
    })
    .slice(0, MAX_SUGGESTIONS);

  return NextResponse.json(suggestions, {
    headers: {
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
    },
  });
}

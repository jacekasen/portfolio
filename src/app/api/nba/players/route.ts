import { NextResponse } from 'next/server';
import { getPlayerIndex } from '@/lib/nba/player-index';
import { suggestPlayerNames } from '@/lib/nba/players';
import { isSupabaseConfigured } from '@/lib/supabase';

const MIN_QUERY_LENGTH = 2;
const MAX_SUGGESTIONS = 8;

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get('q')?.trim().slice(0, 50) || '';

  if (query.length < MIN_QUERY_LENGTH || !isSupabaseConfigured()) {
    return NextResponse.json([]);
  }

  try {
    const { players } = await getPlayerIndex();

    return NextResponse.json(suggestPlayerNames(players, query, MAX_SUGGESTIONS), {
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Could not search players.' }, { status: 500 });
  }
}

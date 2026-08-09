import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase';
import { getPlayerSalaryHistory } from '@/lib/nba/salaries';

const PLAYER_ID_PATTERN = /^[a-z0-9]{3,24}$/;

export async function GET(request: Request) {
  const playerId = new URL(request.url).searchParams.get('id')?.trim().toLowerCase() ?? '';

  if (!PLAYER_ID_PATTERN.test(playerId)) {
    return NextResponse.json({ error: 'Invalid player id.' }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Salary data is not configured.' }, { status: 503 });
  }

  try {
    const rows = await getPlayerSalaryHistory(playerId);
    return NextResponse.json(rows, {
      headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600' },
    });
  } catch {
    return NextResponse.json({ error: 'Could not load the salary history.' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase';
import { getCapShareLeaders } from '@/lib/nba/salaries';

const SEASON_PATTERN = /^\d{4}-\d{2}$/;
const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 50;

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const requestedSeason = params.get('season')?.trim() ?? '';
  const requestedLimit = Number.parseInt(params.get('limit') ?? '', 10);

  if (requestedSeason && requestedSeason !== 'all' && !SEASON_PATTERN.test(requestedSeason)) {
    return NextResponse.json({ error: 'Invalid season.' }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Salary data is not configured.' }, { status: 503 });
  }

  const season = requestedSeason && requestedSeason !== 'all' ? requestedSeason : null;
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(requestedLimit, 1), MAX_LIMIT)
    : DEFAULT_LIMIT;

  try {
    const rows = await getCapShareLeaders(season, limit);
    return NextResponse.json(rows, {
      headers: { 'Cache-Control': 'public, max-age=600, stale-while-revalidate=3600' },
    });
  } catch {
    return NextResponse.json({ error: 'Could not load the cap share leaders.' }, { status: 500 });
  }
}

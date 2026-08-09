import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase';
import { getTeamSeasonSalaries } from '@/lib/nba/salaries';

const TEAM_PATTERN = /^[A-Z]{2,4}$/;
const SEASON_PATTERN = /^\d{4}-\d{2}$/;

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const team = params.get('team')?.trim().toUpperCase() ?? '';
  const season = params.get('season')?.trim() ?? '';

  if (!TEAM_PATTERN.test(team) || !SEASON_PATTERN.test(season)) {
    return NextResponse.json({ error: 'Invalid team or season.' }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Salary data is not configured.' }, { status: 503 });
  }

  try {
    const data = await getTeamSeasonSalaries(team, season);
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600' },
    });
  } catch {
    return NextResponse.json({ error: 'Could not load the team salary data.' }, { status: 500 });
  }
}

import Link from 'next/link';
import { PageHeader } from '@/components/PageHeader';
import { PlayerAutocomplete } from '@/components/nba/PlayerAutocomplete';
import { SeasonTrajectoryChart } from '@/components/nba/SeasonTrajectoryChart';
import {
  resolveTrajectorySeason,
  TRAJECTORY_SEASONS,
  type PlayerGameLog,
} from '@/lib/nba/season-trajectories';
import { createSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';

export const metadata = {
  title: 'NBA Season Trajectories | Jace Kasen',
  description:
    'Explore game-by-game plus-minus and rolling on-court results across an NBA season on a shared 82-game timeline.',
};

export const dynamic = 'force-dynamic';

type PageProps = {
  searchParams: Promise<{ season?: string; player?: string; compare?: string }>;
};

const DEFAULT_PLAYER = 'LeBron James';
const EXAMPLES = [
  { name: 'LeBron James', season: '2025-26' },
  { name: 'Luka Dončić', season: '2025-26' },
  { name: "Shaquille O'Neal", season: '1999-00' },
  { name: 'Michael Jordan', season: '1996-97' },
];

export default async function SeasonTrajectoriesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const season = resolveTrajectorySeason(params.season);
  const requestedPlayer = params.player?.trim().slice(0, 80) || DEFAULT_PLAYER;
  const requestedComparison = params.compare?.trim().slice(0, 80) || '';

  let primary: PlayerGameLog[] = [];
  let comparison: PlayerGameLog[] = [];
  let error: string | null = null;

  if (!isSupabaseConfigured()) {
    error = 'The NBA database is not configured for this deployment.';
  } else {
    try {
      [primary, comparison] = await Promise.all([
        loadPlayerSeason(season, requestedPlayer),
        requestedComparison ? loadPlayerSeason(season, requestedComparison) : Promise.resolve([]),
      ]);
    } catch {
      error = 'The game-log database is unavailable right now.';
    }
  }

  return (
    <div className="space-y-10 pt-4 md:pt-8">
      <PageHeader
        eyebrow="NBA Analysis · 1996–2026"
        title="How does a player's season change?"
        description="Follow game-level on-court plus-minus across a season. Every player uses the same team-game axis, so missed games and late-season changes stay in view."
      />

      <form
        action="/projects/nba/season-trajectories"
        method="get"
        aria-label="Choose season and players"
        className="border-border bg-surface grid gap-4 rounded-lg border p-5 md:grid-cols-[minmax(9rem,0.7fr)_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end"
      >
        <label className="grid gap-2">
          <span className="font-mono text-xs font-bold tracking-wide uppercase">Season</span>
          <select
            name="season"
            defaultValue={season}
            className="border-border bg-background h-11 rounded border px-3"
          >
            {TRAJECTORY_SEASONS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <div className="grid gap-2">
          <label
            htmlFor="trajectory-player"
            className="font-mono text-xs font-bold tracking-wide uppercase"
          >
            Player
          </label>
          <PlayerAutocomplete
            key={`primary-${requestedPlayer}`}
            inputId="trajectory-player"
            defaultValue={requestedPlayer}
          />
        </div>
        <div className="grid gap-2">
          <label
            htmlFor="trajectory-compare"
            className="font-mono text-xs font-bold tracking-wide uppercase"
          >
            Compare with <span className="text-muted font-normal normal-case">(optional)</span>
          </label>
          <PlayerAutocomplete
            key={`compare-${requestedComparison}`}
            inputId="trajectory-compare"
            name="compare"
            defaultValue={requestedComparison}
            placeholder="Another player"
          />
        </div>
        <button
          type="submit"
          className="bg-accent text-background h-11 rounded px-5 font-mono text-sm hover:opacity-90"
        >
          update view
        </button>
      </form>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <span className="text-muted font-mono text-xs uppercase">Try a season</span>
        {EXAMPLES.map((example) => (
          <Link
            key={`${example.name}-${example.season}`}
            href={`/projects/nba/season-trajectories?season=${example.season}&player=${encodeURIComponent(example.name)}`}
            className="text-accent hover:underline"
          >
            {example.name} · {example.season}
          </Link>
        ))}
      </div>

      {error ? (
        <div className="bg-surface rounded-lg p-6" role="alert">
          {error}
        </div>
      ) : primary.length === 0 ? (
        <div className="bg-surface rounded-lg p-6" role="status">
          No game logs found for {requestedPlayer} in {season}. Try another player or season.
        </div>
      ) : (
        <>
          {requestedComparison && comparison.length === 0 && (
            <p className="text-muted text-sm" role="status">
              No {season} games found for {requestedComparison}; showing {primary[0].player_name}{' '}
              alone.
            </p>
          )}
          <SeasonTrajectoryChart
            key={`${season}-${primary[0].player_id}-${comparison[0]?.player_id ?? 'solo'}`}
            season={season}
            primary={primary}
            comparison={comparison}
          />
        </>
      )}

      <section className="border-border border-t pt-8" aria-labelledby="trajectory-method">
        <h2 id="trajectory-method" className="mb-4 text-2xl font-bold">
          How to read this
        </h2>
        <div className="text-muted grid gap-5 text-sm leading-7 md:grid-cols-2">
          <p>
            Each dot is a player&apos;s box-score plus-minus in one game: the team&apos;s scoring
            margin while that player was on court. The x-axis is the number of games their team had
            played, not the player&apos;s appearance number. Missing appearances leave gaps. A
            traded player starts a new segment on the new team&apos;s schedule.
          </p>
          <p>
            The line averages the player&apos;s most recent 5, 10, or 15 appearances, including
            early partial windows. Plus-minus reflects teammates, opponents, lineups, and minutes as
            well as the player. A rising line describes on-court results; it does not establish
            individual improvement. Shortened seasons end before game 82.
          </p>
        </div>
        <p className="text-muted mt-5 font-mono text-xs">
          Source: NBA Stats game logs · Regular seasons, 1996–97 through 2025–26
        </p>
      </section>

      <nav
        aria-label="Related NBA analysis"
        className="border-border flex flex-wrap gap-x-8 gap-y-3 border-t pt-6 font-mono text-sm"
      >
        <Link href="/projects/nba/performance-trends" className="text-accent hover:underline">
          career performance trends →
        </Link>
        <Link href="/projects/nba/peak-performance" className="text-accent hover:underline">
          peak performance analysis →
        </Link>
        <Link href="/projects/nba" className="text-accent hover:underline">
          all NBA analyses →
        </Link>
      </nav>
    </div>
  );
}

async function loadPlayerSeason(season: string, name: string): Promise<PlayerGameLog[]> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from('player_game_logs')
    .select(
      'player_id, player_name, season, game_id, game_date, team_abbreviation, opponent_abbreviation, is_home, team_game_number, player_season_game_number, win_loss, minutes, plus_minus, points, rebounds, assists, rolling_pm_5, rolling_pm_10, rolling_pm_15, is_trade_transition',
    )
    .eq('season', season)
    .ilike('player_name', name)
    .order('game_date', { ascending: true })
    .limit(100)
    .returns<PlayerGameLog[]>();

  if (error) throw new Error(error.message);
  if (!data?.length) return [];
  const playerId = data[0].player_id;
  return data.filter((row) => row.player_id === playerId);
}

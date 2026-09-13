import Link from 'next/link';
import { MetricChart, type MetricSeries } from '@/components/nba/MetricChart';
import { PlayerAutocomplete } from '@/components/nba/PlayerAutocomplete';
import {
  PlayerPredictionCard,
  PlayerPredictionUnavailable,
  type PlayerPrediction,
} from '@/components/nba/PlayerPredictionCard';
import { getPlayerIndex } from '@/lib/nba/player-index';
import {
  findPlayerNames,
  groupCareersByPlayer,
  selectCareer,
  type PlayerCareer,
} from '@/lib/nba/players';
import { createSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';

export const metadata = {
  title: 'NBA Performance Trends | Jace Kasen',
  description:
    'Explore how an NBA player’s performance changes with age and view a machine-learning outlook for their next qualified season.',
};

export const dynamic = 'force-dynamic';

const METRICS = {
  bpm: {
    label: 'Box Plus/Minus',
    shortLabel: 'BPM',
    digits: 1,
    min: -10,
    max: 15,
    reference: 0,
    referenceLabel: 'League average: 0',
  },
  ws: {
    label: 'Win Shares',
    shortLabel: 'WS',
    digits: 1,
    min: -5,
    max: 25,
    reference: 0,
    referenceLabel: 'Zero win shares',
  },
  ws_per_48: {
    label: 'Win Shares per 48 Minutes',
    shortLabel: 'WS/48',
    digits: 3,
    min: -0.1,
    max: 0.35,
    reference: 0.1,
    referenceLabel: 'League average: .100',
  },
  vorp: {
    label: 'Value Over Replacement Player',
    shortLabel: 'VORP',
    digits: 1,
    min: -5,
    max: 15,
    reference: 0,
    referenceLabel: 'Replacement level: 0',
  },
  per: {
    label: 'Player Efficiency Rating',
    shortLabel: 'PER',
    digits: 1,
    min: 0,
    max: 35,
    reference: 15,
    referenceLabel: 'League average: 15',
  },
} as const;

type MetricKey = keyof typeof METRICS;
const METRIC_ORDER: MetricKey[] = ['bpm', 'vorp', 'ws_per_48', 'ws', 'per'];

type NbaSeasonRow = {
  player_name: string;
  player_url: string;
  year_id: string;
  age: number;
  per: number;
  bpm: number;
  ws: number;
  vorp: number;
  ws_per_48: number;
};

type NbaPageProps = {
  searchParams: Promise<{
    id?: string;
    metric?: string;
    player?: string;
  }>;
};

export default async function NbaPage({ searchParams }: NbaPageProps) {
  const params = await searchParams;
  const metric = isMetricKey(params.metric) ? params.metric : 'bpm';
  const requestedPlayer = params.player?.trim() || 'LeBron James';
  const metricDetails = METRICS[metric];

  if (!isSupabaseConfigured()) {
    return <SupabaseSetupMessage />;
  }

  const supabase = createSupabaseClient();
  const playerIndex = await getPlayerIndex().catch(() => null);
  const playerNames = playerIndex ? findPlayerNames(playerIndex.players, requestedPlayer) : [];
  const [seasonResult, predictionResult] = playerNames.length
    ? await Promise.all([
        supabase
          .from('nba_player_seasons')
          .select('player_name, player_url, year_id, age, per, bpm, ws, vorp, ws_per_48')
          .in('player_name', playerNames)
          .order('age', { ascending: true })
          .returns<NbaSeasonRow[]>(),
        supabase
          .from('player_predictions')
          .select(
            'player_id, player_name, season, age, current_bpm, trajectory, improving_probability, stable_probability, regressing_probability, peak_probability, predicted_bpm_delta, prediction_factors, model_version, updated_at',
          )
          .in('player_name', playerNames)
          .returns<PlayerPrediction[]>(),
      ])
    : [
        { data: [], error: null },
        { data: [], error: null },
      ];

  const { data } = seasonResult;
  const queryError = !playerIndex || seasonResult.error;
  const careers = groupCareersByPlayer(data ?? []);
  const career = selectCareer(careers, params.id);
  const seasons = career?.seasons ?? [];
  const prediction =
    predictionResult.data?.find((row) => row.player_id === career?.playerId) ?? null;
  const forecastSeasonInData = Boolean(
    prediction && playerIndex?.latestSeason && prediction.season <= playerIndex.latestSeason,
  );

  const series: MetricSeries[] = seasons.length
    ? [
        {
          name: seasons[0].player_name,
          points: seasons.map((season) => ({
            age: Number(season.age),
            season: season.year_id,
            value: Number(season[metric]),
          })),
        },
      ]
    : [];
  const playerSeries = series[0];

  return (
    <div className="space-y-14 pt-4 md:pt-8">
      <header className="max-w-4xl">
        <p className="text-accent mb-2 font-mono text-xs tracking-[0.16em] uppercase">
          Basketball Reference · 1976–2026
        </p>
        <h1 className="mb-3 text-4xl font-bold tracking-tight md:text-5xl">
          NBA Performance Trends
        </h1>
        <p className="text-muted max-w-3xl text-lg leading-8">
          Follow one player from season-by-season performance to a probabilistic forecast of what
          comes next.
        </p>
      </header>

      <form
        aria-label="Choose player and statistic"
        className="border-border bg-surface grid gap-5 rounded-lg border p-5 md:grid-cols-[1fr_1.6fr_auto] md:items-start md:p-6"
        action="/projects/nba/performance-trends"
        method="get"
      >
        {career && careers.length > 1 && <input type="hidden" name="id" value={career.playerId} />}
        <label className="grid gap-2">
          <span className="font-mono text-xs font-bold tracking-wide uppercase">Statistic</span>
          <select
            name="metric"
            defaultValue={metric}
            className="border-border bg-background h-11 rounded border px-3"
          >
            {METRIC_ORDER.map((value) => (
              <option key={value} value={value}>
                {METRICS[value].label}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-2">
          <label
            htmlFor="nba-player-search"
            className="font-mono text-xs font-bold tracking-wide uppercase"
          >
            Player
          </label>
          <PlayerAutocomplete
            inputId="nba-player-search"
            defaultValue={seasons[0]?.player_name ?? requestedPlayer}
          />
          <span className="text-muted text-xs">Enter the player name.</span>
        </div>

        <button
          type="submit"
          className="bg-accent text-background h-11 rounded px-5 font-mono text-sm transition-opacity hover:opacity-90 md:mt-6"
        >
          update view
        </button>
      </form>

      {queryError ? (
        <DatabaseError />
      ) : series.length === 0 ? (
        <div className="bg-surface rounded p-5">
          <h2 className="mb-2 text-lg font-bold">Player not found</h2>
          <p className="text-muted">Check the spelling and enter the player&apos;s full name.</p>
        </div>
      ) : (
        <>
          <section aria-labelledby="chart-title">
            <div className="mb-6">
              <p className="text-accent mb-2 font-mono text-xs tracking-[0.14em] uppercase">
                01 · Career arc
              </p>
              <h2 id="chart-title" className="text-2xl font-bold md:text-3xl">
                {playerSeries.name} · {metricDetails.shortLabel}
              </h2>
              <p className="text-muted mt-2 text-sm">
                {metricDetails.label} across {playerSeries.points.length} recorded seasons.
              </p>
              {career && careers.length > 1 && (
                <NamesakeChooser careers={careers} selectedId={career.playerId} metric={metric} />
              )}
            </div>

            <div className="border-border bg-background rounded-lg border p-3 md:p-5">
              <MetricChart
                metricLabel={metricDetails.shortLabel}
                valueDigits={metricDetails.digits}
                referenceLine={{
                  label: metricDetails.referenceLabel,
                  value: metricDetails.reference,
                }}
                scale={{ min: metricDetails.min, max: metricDetails.max }}
                series={series}
              />
            </div>
            <p className="text-muted mt-3 text-xs">
              Fixed comparison scale: ages 18–42 and{' '}
              {formatMetric(metricDetails.min, metricDetails.digits)}–
              {formatMetric(metricDetails.max, metricDetails.digits)} {metricDetails.shortLabel}.
              The dashed line marks {metricDetails.referenceLabel.toLocaleLowerCase()}.
            </p>
          </section>

          {prediction && !predictionResult.error ? (
            <PlayerPredictionCard
              prediction={prediction}
              forecastSeasonInData={forecastSeasonInData}
            />
          ) : (
            <PlayerPredictionUnavailable />
          )}
        </>
      )}

      <nav
        aria-label="Related NBA analysis"
        className="border-border flex flex-wrap gap-x-8 gap-y-3 border-t pt-6 font-mono text-sm"
      >
        <Link href="/projects/nba/peak-performance" className="text-accent hover:underline">
          explore aggregate peak performance →
        </Link>
        <Link href="/projects/nba" className="text-accent hover:underline">
          all NBA analyses →
        </Link>
      </nav>
    </div>
  );
}

function isMetricKey(value?: string): value is MetricKey {
  return Boolean(value && value in METRICS);
}

function formatMetric(value: number, digits: number) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

function NamesakeChooser({
  careers,
  selectedId,
  metric,
}: {
  careers: PlayerCareer<NbaSeasonRow>[];
  selectedId: string;
  metric: MetricKey;
}) {
  const name = careers[0].seasons[0].player_name;

  return (
    <nav aria-label={`Players named ${name}`} className="mt-4">
      <p className="text-muted mb-2 text-sm">
        {careers.length} players are named {name}. Choose a career:
      </p>
      <ul className="flex flex-wrap gap-2 font-mono text-xs">
        {careers.map(({ playerId, seasons }) => {
          const isSelected = playerId === selectedId;
          const query = new URLSearchParams({ metric, player: name, id: playerId });

          return (
            <li key={playerId}>
              <Link
                href={`/projects/nba/performance-trends?${query}`}
                aria-current={isSelected ? 'page' : undefined}
                className={`inline-block rounded-full border px-3 py-1 transition-colors ${
                  isSelected
                    ? 'border-accent bg-accent text-background'
                    : 'border-border bg-surface hover:border-accent hover:text-accent'
                }`}
              >
                {seasons[0].year_id} to {seasons.at(-1)!.year_id} · {seasons.length} seasons
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function SupabaseSetupMessage() {
  return (
    <div className="space-y-8 pt-4 md:pt-8">
      <header>
        <h1 className="mb-3 text-4xl font-bold tracking-tight md:text-5xl">
          NBA Performance Trends
        </h1>
        <p className="text-muted max-w-2xl text-lg leading-7">
          The page is ready, but its Supabase environment variables have not been configured.
        </p>
      </header>
      <div className="bg-ink rounded p-5">
        <p className="font-mono text-sm">
          Copy <code>.env.example</code> to <code>.env.local</code>, then add the project URL and
          publishable key from the Supabase Connect panel.
        </p>
      </div>
      <Link href="/projects/nba" className="text-accent font-mono text-sm hover:underline">
        ← all NBA analyses
      </Link>
    </div>
  );
}

function DatabaseError() {
  return (
    <div className="bg-surface rounded p-5">
      <h2 className="mb-2 text-lg font-bold">Could not load the NBA data</h2>
      <p className="text-muted">
        Check that <code>nba_player_seasons</code> exists and its public read policy is enabled.
      </p>
    </div>
  );
}

import Link from 'next/link';
import { MetricChart, type MetricSeries } from '@/components/nba/MetricChart';
import { PlayerAutocomplete } from '@/components/nba/PlayerAutocomplete';
import {
  PlayerPredictionCard,
  PlayerPredictionUnavailable,
  type ObservedPredictionOutcome,
  type PlayerPrediction,
} from '@/components/nba/PlayerPredictionCard';
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
  const [seasonResult, predictionResult] = await Promise.all([
    supabase
      .from('nba_player_seasons')
      .select('player_name, year_id, age, per, bpm, ws, vorp, ws_per_48')
      .ilike('player_name', requestedPlayer)
      .order('age', { ascending: true })
      .returns<NbaSeasonRow[]>(),
    supabase
      .from('player_predictions')
      .select(
        'player_id, player_name, season, age, current_bpm, trajectory, improving_probability, stable_probability, regressing_probability, peak_probability, predicted_bpm_delta, prediction_factors, model_version, updated_at',
      )
      .ilike('player_name', requestedPlayer)
      .limit(1)
      .returns<PlayerPrediction[]>(),
  ]);

  const { data, error: queryError } = seasonResult;
  const prediction = predictionResult.data?.[0] ?? null;
  const observedOutcome = prediction ? getObservedOutcome(data ?? [], prediction) : undefined;

  const series: MetricSeries[] = data?.length
    ? [
        {
          name: data[0].player_name,
          points: data.map((season) => ({
            age: Number(season.age),
            season: season.year_id,
            value: Number(season[metric]),
          })),
        },
      ]
    : [];
  const playerSeries = series[0];
  const latestPoint = playerSeries?.points.at(-1);
  const peakPoint = playerSeries?.points.reduce((best, point) =>
    point.value > best.value ? point : best,
  );

  return (
    <div className="space-y-14 pt-4 md:pt-8">
      <header className="max-w-4xl">
        <p className="text-accent mb-2 font-mono text-xs tracking-[0.16em] uppercase">
          Basketball Reference · 1976–2026
        </p>
        <h1 className="mb-3 font-mono text-4xl tracking-tight md:text-5xl">
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
          <PlayerAutocomplete inputId="nba-player-search" defaultValue={requestedPlayer} />
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
        <div className="border-border rounded border p-5">
          <h2 className="mb-2 font-mono text-lg">Player not found</h2>
          <p className="text-muted">Check the spelling and enter the player&apos;s full name.</p>
        </div>
      ) : (
        <>
          <section aria-labelledby="chart-title">
            <div className="mb-6">
              <p className="text-accent mb-2 font-mono text-xs tracking-[0.14em] uppercase">
                01 · Career arc
              </p>
              <h2 id="chart-title" className="font-mono text-2xl md:text-3xl">
                {playerSeries.name} · {metricDetails.shortLabel}
              </h2>
              <p className="text-muted mt-2 text-sm">
                {metricDetails.label} across {playerSeries.points.length} recorded seasons.
              </p>
            </div>

            <div className="mb-5 grid gap-3 sm:grid-cols-3">
              <CareerStat
                label="Latest"
                value={formatMetric(latestPoint!.value, metricDetails.digits)}
                detail={`${metricDetails.shortLabel} · ${latestPoint!.season}`}
              />
              <CareerStat
                label="Career high"
                value={formatMetric(peakPoint.value, metricDetails.digits)}
                detail={`Age ${peakPoint.age} · ${peakPoint.season}`}
              />
              <CareerStat
                label="Career span"
                value={`${playerSeries.points.length} seasons`}
                detail={`Ages ${playerSeries.points[0].age}–${latestPoint!.age}`}
              />
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
            <PlayerPredictionCard prediction={prediction} observedOutcome={observedOutcome} />
          ) : (
            <PlayerPredictionUnavailable />
          )}

          <section aria-labelledby="data-title">
            <p className="text-accent mb-2 font-mono text-xs tracking-[0.14em] uppercase">
              03 · Season log
            </p>
            <h2 id="data-title" className="font-mono text-2xl">
              Season-by-season record
            </h2>
            <p className="text-muted mt-2 mb-5 text-sm">
              Open the complete table for the selected statistic.
            </p>
            <details className="border-border bg-surface group overflow-hidden rounded-lg border">
              <summary className="hover:bg-accent-light/10 flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-mono text-sm transition-colors">
                <span>View {playerSeries.points.length} seasons</span>
                <span className="text-accent group-open:rotate-45" aria-hidden="true">
                  +
                </span>
              </summary>
              <div className="border-border overflow-x-auto border-t">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="bg-accent-light/15 font-mono text-xs uppercase">
                    <tr>
                      <th className="px-3 py-2">Player</th>
                      <th className="px-3 py-2">Age</th>
                      <th className="px-3 py-2">Season</th>
                      <th className="px-3 py-2">{metricDetails.shortLabel}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {series.flatMap((player) =>
                      player.points.map((point) => (
                        <tr
                          key={`${player.name}-${point.season}`}
                          className="border-border border-t"
                        >
                          <td className="px-3 py-2">{player.name}</td>
                          <td className="px-3 py-2">{point.age}</td>
                          <td className="px-3 py-2 font-mono">{point.season}</td>
                          <td className="px-3 py-2">
                            {formatMetric(point.value, metricDetails.digits)}
                          </td>
                        </tr>
                      )),
                    )}
                  </tbody>
                </table>
              </div>
            </details>
          </section>
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

function CareerStat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="border-border bg-surface rounded border p-4">
      <p className="text-muted font-mono text-xs tracking-wide uppercase">{label}</p>
      <p className="mt-2 font-mono text-2xl">{value}</p>
      <p className="text-muted mt-1 text-xs">{detail}</p>
    </article>
  );
}

function getObservedOutcome(
  seasons: NbaSeasonRow[],
  prediction: PlayerPrediction,
): ObservedPredictionOutcome | undefined {
  if (prediction.current_bpm === null) return undefined;

  const forecastSeasonStart = Number.parseInt(prediction.season.slice(0, 4), 10);
  if (!Number.isFinite(forecastSeasonStart)) return undefined;

  const nextSeason = seasons.find(
    (season) => Number.parseInt(season.year_id.slice(0, 4), 10) === forecastSeasonStart,
  );
  if (!nextSeason) return undefined;

  const bpmDelta = Number(nextSeason.bpm) - Number(prediction.current_bpm);
  if (!Number.isFinite(bpmDelta)) return undefined;

  return {
    season: nextSeason.year_id,
    bpmDelta,
    trajectory: bpmDelta > 0.5 ? 'improving' : bpmDelta < -0.5 ? 'regressing' : 'stable',
  };
}

function SupabaseSetupMessage() {
  return (
    <div className="space-y-8 pt-4 md:pt-8">
      <header>
        <h1 className="mb-3 font-mono text-4xl tracking-tight md:text-5xl">
          NBA Performance Trends
        </h1>
        <p className="text-muted max-w-2xl text-lg leading-7">
          The page is ready, but its Supabase environment variables have not been configured.
        </p>
      </header>
      <div className="border-border bg-accent-light/10 rounded border p-5">
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
    <div className="border-border rounded border p-5">
      <h2 className="mb-2 font-mono text-lg">Could not load the NBA data</h2>
      <p className="text-muted">
        Check that <code>nba_player_seasons</code> exists and its public read policy is enabled.
      </p>
    </div>
  );
}

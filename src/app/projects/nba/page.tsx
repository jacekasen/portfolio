import Link from 'next/link';
import { NbaMetricChart, type MetricSeries } from '@/components/NbaMetricChart';
import { PlayerAutocomplete } from '@/components/PlayerAutocomplete';
import { createSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';

export const metadata = {
  title: 'NBA Performance Trends | Jace Kasen',
  description: 'Explore how an NBA player’s performance changes as they age.',
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
  const { data, error: queryError } = await supabase
    .from('nba_player_seasons')
    .select('player_name, year_id, age, per, bpm, ws, vorp, ws_per_48')
    .ilike('player_name', requestedPlayer)
    .order('age', { ascending: true })
    .returns<NbaSeasonRow[]>();

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

  return (
    <div className="space-y-9 pt-4 md:pt-8">
      <header>
        <p className="text-accent mb-2 font-mono text-xs tracking-[0.16em] uppercase">
          Basketball Reference · 1976–2026
        </p>
        <h1 className="mb-3 font-mono text-4xl tracking-tight md:text-5xl">
          NBA Performance Trends
        </h1>
        <p className="text-muted max-w-2xl text-lg leading-7">
          Trace how a player&apos;s performance rises, peaks, and changes across their career.
        </p>
      </header>

      <form
        className="border-border bg-surface grid gap-5 rounded-lg border p-5 md:grid-cols-[1fr_1.6fr_auto] md:items-start"
        action="/projects/nba"
        method="get"
      >
        <label className="grid gap-2">
          <span className="font-mono text-xs font-bold tracking-wide uppercase">Statistic</span>
          <select
            name="metric"
            defaultValue={metric}
            className="border-border bg-background h-11 rounded border px-3"
          >
            {Object.entries(METRICS).map(([value, details]) => (
              <option key={value} value={value}>
                {details.label}
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
          <span className="text-muted text-xs">Enter the player&apos;s full name.</span>
        </div>

        <button
          type="submit"
          className="bg-accent text-background h-11 rounded px-5 font-mono text-sm transition-opacity hover:opacity-90 md:mt-6"
        >
          view trend
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
            <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 id="chart-title" className="font-mono text-2xl">
                  {series[0].name}&apos;s {metricDetails.shortLabel} by age
                </h2>
                <p className="text-muted mt-1 text-sm">{metricDetails.label}</p>
              </div>
              <p className="text-muted font-mono text-xs">Player age →</p>
            </div>
            <div className="border-border bg-background rounded-lg border p-3 md:p-5">
              <NbaMetricChart
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

          <section aria-labelledby="peaks-title">
            <h2 id="peaks-title" className="mb-4 font-mono text-2xl">
              Peak performance
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {series.map((player) => {
                const peak = player.points.reduce((best, point) =>
                  point.value > best.value ? point : best,
                );
                return (
                  <article
                    key={player.name}
                    className="border-border bg-surface rounded border p-4"
                  >
                    <p className="text-muted mb-3 truncate font-mono text-xs">{player.name}</p>
                    <p className="text-3xl font-bold">
                      {formatMetric(peak.value, metricDetails.digits)}
                    </p>
                    <p className="text-muted mt-1 text-sm">
                      {metricDetails.shortLabel} · age {peak.age} · {peak.season}
                    </p>
                  </article>
                );
              })}
            </div>
          </section>

          <section aria-labelledby="data-title">
            <h2 id="data-title" className="mb-4 font-mono text-2xl">
              Season data
            </h2>
            <div className="border-border overflow-x-auto rounded border">
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
                      <tr key={`${player.name}-${point.season}`} className="border-border border-t">
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
          </section>
        </>
      )}

      <Link
        href="/#projects"
        className="text-accent inline-block font-mono text-sm hover:underline"
      >
        ← back to projects
      </Link>
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
      <Link href="/#projects" className="text-accent font-mono text-sm hover:underline">
        ← back to projects
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

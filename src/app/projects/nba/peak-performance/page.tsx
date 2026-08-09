import Link from 'next/link';
import { PeakPerformanceDashboard } from '@/components/nba/PeakPerformanceDashboard';
import { getPeakPerformanceData } from '@/lib/nba/peak-performance';

export const metadata = {
  title: 'NBA Peak Performance Analysis | Jace Kasen',
  description:
    'Interactive analysis of when NBA players reach peak performance across BPM, PER, Win Shares, VORP, and Win Shares per 48 minutes.',
};

export default async function PeakPerformancePage() {
  const data = await getPeakPerformanceData();
  const bpmSummary = data.summaries.bpm;

  return (
    <div className="space-y-14 pt-4 md:space-y-18 md:pt-8">
      <header>
        <p className="text-accent mb-2 font-mono text-xs tracking-[0.16em] uppercase">
          NBA Analysis · {data.meta.startSeason}–{data.meta.endSeason}
        </p>
        <h1 className="mb-4 max-w-4xl font-mono text-4xl tracking-tight md:text-5xl">
          When do NBA players reach peak performance?
        </h1>
        <p className="text-muted max-w-3xl text-lg leading-8">
          An interactive look at {data.meta.eligiblePlayers.toLocaleString()} qualifying careers
          suggests a broad prime rather than one universal peak age. Across five advanced metrics,
          the typical player’s strongest observed three-season stretch arrives around age 25–26.
        </p>
        <div className="mt-6 flex flex-wrap gap-5 font-mono text-sm">
          <Link href="/projects/nba/performance-trends" className="text-accent hover:underline">
            explore individual careers →
          </Link>
          <Link href="/projects/nba" className="text-accent hover:underline">
            all NBA analyses →
          </Link>
        </div>
      </header>

      <section className="border-border bg-accent-light/10 rounded-lg border p-5 md:p-7">
        <div className="grid gap-5 md:grid-cols-[auto_1fr] md:items-center">
          <p className="font-mono text-5xl font-bold md:text-6xl">
            {bpmSummary.q1}–{bpmSummary.q3}
          </p>
          <div>
            <h2 className="font-mono text-lg font-bold">The middle half of observed peak ages</h2>
            <p className="text-muted mt-1 max-w-2xl leading-7">
              A single age hides meaningful variation. The distribution—and its sensitivity to
              metric choice and smoothing—is more informative than declaring one definitive NBA peak
              age.
            </p>
          </div>
        </div>
      </section>

      <PeakPerformanceDashboard data={data} />

      <section className="border-border border-t pt-8" aria-labelledby="method-title">
        <h2 id="method-title" className="mb-4 font-mono text-2xl">
          Method
        </h2>
        <div className="text-muted grid gap-5 text-sm leading-7 md:grid-cols-2">
          <p>
            The source is the cleaned <code>nba_player_seasons</code> table in Supabase. Seasons
            must contain {data.meta.minimumGames}–82 games and at least{' '}
            {data.meta.minimumMinutes.toLocaleString()} minutes. Players are identified by their
            Basketball Reference URL rather than name.
          </p>
          <p>
            Observed peak age is the center of the strongest exact three-season window; all three
            seasons must be consecutive. Confidence intervals describe uncertainty around mean
            observed performance at each age, not a single “true” peak age. Active players’ peaks
            are based on their careers so far and may change in future seasons.
          </p>
        </div>
        <p className="text-muted mt-5 font-mono text-xs">
          Source: Supabase · Basketball Reference season data · Analysis window:{' '}
          {data.meta.startSeason}–{data.meta.endSeason} · {data.meta.sourceRows.toLocaleString()}{' '}
          qualifying player-seasons
        </p>
      </section>
    </div>
  );
}

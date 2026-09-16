import Link from 'next/link';
import { Activity, ArrowRight, Crosshair, Github, LineChart } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';

export const metadata = {
  title: 'Counter-Strike 2 Analysis | Jace Kasen',
  description:
    'Three interactive ways to explore professional CS2 telemetry: map-to-map rating trends, rolling form indicators, and 2D radar spatial duel heatmaps.',
};

const analyses = [
  {
    title: 'Map-to-Map Performance Trends',
    href: '/projects/cs2/trends',
    eyebrow: 'Individual match history · 65 tournaments',
    description:
      'Track map-to-map variance of HLTV Rating 3.0 across tier-1 tournaments, comparing 5, 10, 15, and 20-map moving averages against career baselines.',
    highlights: [
      '5, 10, 15, and 20-map rolling window moving averages',
      'Map pool breakdown and individual map filters',
      'Separate map variance from true player momentum',
      'Career rating baselines across tier-1 LAN tournaments',
    ],
    icon: LineChart,
  },
  {
    title: 'CS2 Form Tracker',
    href: '/projects/cs2/form',
    eyebrow: 'Rolling momentum & streaks · Tier-1 CS2',
    description:
      'Evaluate current player trajectory with rolling 10-map ratings, plain-language form verdicts, and recent match outcome breakdowns.',
    highlights: [
      'Rolling 10-map rating compared against career baseline',
      'Plain-language form verdict (Surging, Peak, Slumping, Stable)',
      'Momentum delta and performance streak indicators',
      'Recent match history strip with individual map scores',
    ],
    icon: Activity,
  },
  {
    title: '2D Radar Duel & Kill Analytics',
    href: '/projects/cs2/radar',
    eyebrow: 'Spatial combat telemetry · 598,000+ events',
    description:
      'Interactive top-down radar spatial projections rendering player duel locations, directional kill vectors, and trade attribution on official competitive maps.',
    highlights: [
      'Attacker and victim spatial positioning on official radar overviews',
      'Directional engagement vectors with weapon, headshot, and wallbang tags',
      '3-second sliding-window trade-kill attribution analysis',
      'Filterable by player, map, side (T / CT), and kill outcome',
    ],
    icon: Crosshair,
  },
] as const;

const buildDetails = [
  {
    title: 'Data collection & ingestion',
    body: 'An automated Python pipeline downloads and verifies tournament demos across 65 tier-1 events. Uses browser TLS impersonation, request jitter, circuit-breaker error handling, and SQLite WAL mode to track match processing state without data loss.',
  },
  {
    title: 'Polars ETL & event normalization',
    body: 'Processes >380 GB of raw match replays into a compact 472 MB partitioned Parquet datastore (>99.8% storage reduction). Extracts and normalizes 598,000+ combat events with sub-tick precision.',
  },
  {
    title: 'Spatial projection & trade attribution',
    body: 'Transforms in-game world coordinates into 2D radar map space. Computes directional kill vectors and executes 3-second sliding-window algorithms to identify and credit trade kills.',
  },
  {
    title: 'Interactive visualizations & caching',
    body: 'Next.js App Router renders tournament analytics, Canvas-based form curves, and interactive radar duel heatmaps. Pre-computed manifest indexes enable instant player lookups and shareable state.',
  },
] as const;

export default function Cs2LandingPage() {
  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="A personal Counter-Strike 2 telemetry project"
        title="Counter-Strike 2 Analysis"
        description="I wanted to analyze professional CS2 telemetry at scale, so I built an automated ETL pipeline that parsed >380 GB of tier-1 tournament replays into compact Parquet datastores. It powers map-to-map performance trends, rolling form indicators, and interactive 2D radar duel heatmaps."
      />

      <section className="flex flex-col gap-5" aria-label="Counter-Strike 2 analysis projects">
        {analyses.map((analysis, index) => {
          const Icon = analysis.icon;

          return (
            <Link
              key={analysis.href}
              href={analysis.href}
              className="group bg-surface hover:bg-ink grid gap-5 rounded-lg p-6 transition-colors sm:grid-cols-[auto_minmax(0,1fr)] md:grid-cols-[auto_minmax(0,1fr)_minmax(15rem,0.65fr)_auto] md:gap-8 md:p-8"
            >
              <span className="bg-accent text-background w-fit shrink-0 rounded-md p-3 md:p-4">
                <Icon aria-hidden="true" size={24} strokeWidth={1.7} />
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-muted mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs tracking-[0.12em] uppercase">
                  <span className="text-accent">0{index + 1}</span>
                  <span className="min-w-0">{analysis.eyebrow}</span>
                </p>
                <h2 className="mb-3 text-2xl font-bold tracking-tight md:text-3xl">
                  {analysis.title}
                </h2>
                <p className="text-muted max-w-2xl leading-7">{analysis.description}</p>
              </div>

              <ul className="border-border space-y-2 border-t pt-4 text-sm leading-6 sm:col-start-2 md:col-start-auto md:border-t-0 md:border-l md:pt-0 md:pl-7">
                {analysis.highlights.map((highlight) => (
                  <li key={highlight} className="flex gap-2">
                    <span className="text-accent font-mono">→</span>
                    {highlight}
                  </li>
                ))}
              </ul>

              <ArrowRight
                aria-hidden="true"
                className="text-accent shrink-0 self-end transition-transform group-hover:translate-x-1 sm:col-start-2 md:col-start-auto md:self-center"
                size={22}
              />
            </Link>
          );
        })}
      </section>

      <section aria-labelledby="build-heading" className="space-y-6">
        <div className="border-border/80 border-b pb-4">
          <p className="text-accent mb-2 font-mono text-xs tracking-[0.16em] uppercase">
            How it works
          </p>
          <h2 id="build-heading" className="text-3xl font-bold tracking-tight md:text-4xl">
            From raw demo files to the radar
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {buildDetails.map((item) => (
            <article key={item.title} className="bg-surface flex flex-col gap-3 p-6">
              <h3 className="text-xl font-bold">{item.title}</h3>
              <p className="text-muted leading-7">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="on-ink bg-ink text-on-ink flex flex-col gap-6 p-7 md:flex-row md:items-center md:justify-between md:p-9">
        <div>
          <p className="mb-2 text-lg leading-7">
            Next.js and TypeScript on the site, Python and Polars for the data pipelines, and Snappy
            Parquet / Supabase for the cleaned telemetry.
          </p>
          <p className="text-on-ink-muted font-mono text-xs leading-6">
            Next.js · TypeScript · Python · Polars · Snappy Parquet · SQLite · Supabase · Canvas ·
            SVG
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-3">
          <a
            href="https://github.com/jacekasen/cs2"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-accent text-background hover:bg-foreground inline-flex items-center gap-2 rounded-sm px-5 py-3 font-mono text-sm transition-colors"
          >
            <Github size={16} /> CS2 pipeline source
          </a>
        </div>
      </section>

      <Link href="/work" className="text-accent inline-block font-mono text-sm hover:underline">
        ← back to all projects
      </Link>
    </div>
  );
}

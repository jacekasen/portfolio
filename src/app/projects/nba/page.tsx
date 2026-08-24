import Link from 'next/link';
import { ArrowRight, CircleDollarSign, Github, LineChart, Mountain } from 'lucide-react';

export const metadata = {
  title: 'NBA Analysis | Jace Kasen',
  description:
    'Three interactive ways to look at how NBA players change — and how much they cost — over the course of a career.',
};

const analyses = [
  {
    title: 'NBA Performance Trends',
    href: '/projects/nba/performance-trends',
    eyebrow: 'Individual careers · 1976–2026',
    description:
      'Search for a player and follow BPM, VORP, win shares, win shares per 48 minutes or PER across their career.',
    highlights: [
      'Career highs, season logs and league-average references',
      'Probabilities for improving, staying stable or regressing',
      'A projected BPM change with the factors behind it',
      'Past forecasts compared with the next observed season',
    ],
    icon: LineChart,
  },
  {
    title: 'NBA Peak Performance Analysis',
    href: '/projects/nba/peak-performance',
    eyebrow: 'League-wide patterns · Updated through 2025–26',
    description:
      'See when qualifying players reached their strongest consecutive three-season stretch across the same five metrics.',
    highlights: [
      'Average performance by age with confidence intervals',
      'Peak-age distributions and metric comparisons',
      'Raw single-season peaks compared with smoothed peaks',
      'Stricter eligibility filters to check the result',
    ],
    icon: Mountain,
  },
  {
    title: 'NBA Salary Cap Explorer',
    href: '/projects/nba/salaries',
    eyebrow: 'Contracts by era · 1984-85 onward',
    description:
      'Compare contracts across eras using salary as a share of that season’s cap instead of nominal dollars.',
    highlights: [
      'Team payrolls shown as bars or a donut chart',
      'Cap share and nominal salary views',
      'Player salary histories across teams and seasons',
      'A cross-era leaderboard with season filters',
    ],
    icon: CircleDollarSign,
  },
] as const;

const buildDetails = [
  {
    title: 'Data collection',
    body: 'Python pipelines clean season, prediction, salary and salary-cap data before publishing it to Supabase. The site reads those tables instead of scraping data when a page loads.',
  },
  {
    title: 'Queries and caching',
    body: 'The pages load data on the server, while API routes handle player search and the salary explorer’s follow-up requests. Larger indexes and aggregate results are cached, and each view only sends the rows it needs to the browser.',
  },
  {
    title: 'Charts and shareable views',
    body: 'The career, peak-age and salary charts are built for this project with Canvas and SVG. Player, metric, team, season and display choices are kept in the URL where it makes sense, so a specific view can be shared.',
  },
  {
    title: 'Checks and limitations',
    body: 'The analysis defines its eligibility rules and separates observed results from forecasts. The player search, salary calculations, chart helpers, URL state and loading and error states are covered by automated tests.',
  },
] as const;

export default function NbaAnalysisPage() {
  return (
    <div className="space-y-12 pt-4 md:pt-8">
      <header className="max-w-4xl">
        <p className="text-accent mb-2 font-mono text-xs tracking-[0.16em] uppercase">
          A personal basketball data project
        </p>
        <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-6xl">NBA Analysis</h1>
        <p className="text-muted max-w-3xl text-lg leading-8">
          I wanted to know when NBA players usually peak, so I collected the data and looked at it a
          few different ways. The project now covers individual career trends, league-wide peak
          patterns, next-season forecasts and salaries across different cap eras.
        </p>
      </header>

      <section className="flex flex-col gap-5" aria-label="NBA analysis projects">
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
            From raw data to the charts
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
            Next.js and TypeScript on the site, Python for the data pipelines, and Supabase
            PostgreSQL for the cleaned data.
          </p>
          <p className="text-on-ink-muted font-mono text-xs leading-6">
            Next.js · TypeScript · Python · Supabase · PostgreSQL · Canvas · SVG · Vitest
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-3">
          <a
            href="https://github.com/jacekasen/nba-peak-analysis"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-accent text-background hover:bg-foreground inline-flex items-center gap-2 rounded-sm px-5 py-3 font-mono text-sm transition-colors"
          >
            <Github size={16} /> Performance source
          </a>
          <a
            href="https://github.com/jacekasen/nba"
            target="_blank"
            rel="noopener noreferrer"
            className="border-border hover:border-accent hover:text-accent inline-flex items-center gap-2 rounded-sm border px-5 py-3 font-mono text-sm transition-colors"
          >
            <Github size={16} /> Salary source
          </a>
        </div>
      </section>

      <Link href="/work" className="text-accent inline-block font-mono text-sm hover:underline">
        ← back to all projects
      </Link>
    </div>
  );
}

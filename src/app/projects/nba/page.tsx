import Link from 'next/link';
import { ArrowRight, CircleDollarSign, LineChart, Mountain } from 'lucide-react';

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
      'Search for an NBA player, trace five advanced metrics across their career, and explore an ML outlook for their next qualified season.',
    detail: 'Interactive career chart and probabilistic forecast',
    icon: LineChart,
  },
  {
    title: 'NBA Peak Performance Analysis',
    href: '/projects/nba/peak-performance',
    eyebrow: 'League-wide patterns · Updated through 2025–26',
    description:
      'Explore when qualifying NBA careers reached their strongest consecutive three-season stretch across five advanced metrics.',
    detail: 'Interactive age curves, distributions, and comparisons',
    icon: Mountain,
  },
  {
    title: 'NBA Salary Cap Explorer',
    href: '/projects/nba/salaries',
    eyebrow: 'Contracts by era · 1984-85 onward',
    description:
      'Compare what players cost by the only measure that survives inflation: salary as a share of that season’s salary cap.',
    detail: 'Team payroll breakdowns and career cap share histories',
    icon: CircleDollarSign,
  },
] as const;

export default function NbaAnalysisPage() {
  return (
    <div className="space-y-12 pt-4 md:pt-8">
      <header className="max-w-4xl">
        <p className="text-accent mb-2 font-mono text-xs tracking-[0.16em] uppercase">
          A basketball question that got slightly out of hand
        </p>
        <h1 className="mb-4 font-mono text-4xl tracking-tight md:text-6xl">NBA Analysis</h1>
        <p className="text-muted max-w-3xl text-lg leading-8">
          I wanted to know when NBA players really peak. That turned into three ways of looking at a
          career: follow one player season by season, step back and compare patterns across the
          league, or ask what all of it cost against the salary cap of the day.
        </p>
      </header>

      <section className="flex max-w-4xl flex-col gap-5" aria-label="NBA analysis projects">
        {analyses.map((analysis, index) => {
          const Icon = analysis.icon;

          return (
            <Link
              key={analysis.href}
              href={analysis.href}
              className="group bg-surface hover:bg-ink flex flex-col gap-5 rounded-lg p-6 transition-colors sm:flex-row sm:items-start md:gap-8 md:p-8"
            >
              <span className="bg-accent text-background w-fit shrink-0 rounded-md p-3 md:p-4">
                <Icon aria-hidden="true" size={24} strokeWidth={1.7} />
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-muted mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs tracking-[0.12em] uppercase">
                  <span className="text-accent">0{index + 1}</span>
                  <span className="min-w-0">{analysis.eyebrow}</span>
                </p>
                <h2 className="mb-3 font-mono text-2xl tracking-tight md:text-3xl">
                  {analysis.title}
                </h2>
                <p className="text-muted max-w-2xl leading-7">{analysis.description}</p>
                <p className="text-muted bg-background mt-4 inline-block rounded-md px-3 py-1.5 font-mono text-[0.68rem] leading-5 tracking-[0.04em] sm:rounded-full">
                  {analysis.detail}
                </p>
              </div>

              <ArrowRight
                aria-hidden="true"
                className="text-accent shrink-0 self-end transition-transform group-hover:translate-x-1 sm:self-center"
                size={22}
              />
            </Link>
          );
        })}
      </section>

      <Link href="/work" className="text-accent inline-block font-mono text-sm hover:underline">
        ← back to all projects
      </Link>
    </div>
  );
}

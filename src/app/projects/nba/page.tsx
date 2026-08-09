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

      <section
        className="grid gap-5 md:grid-cols-2 lg:grid-cols-3"
        aria-label="NBA analysis projects"
      >
        {analyses.map((analysis, index) => {
          const Icon = analysis.icon;

          return (
            <Link
              key={analysis.href}
              href={analysis.href}
              className="group border-border bg-surface hover:border-accent flex min-h-[330px] flex-col rounded-lg border p-6 transition-colors md:p-8"
            >
              <div className="mb-10 flex items-start justify-between gap-4">
                <span className="text-accent font-mono text-xs">0{index + 1}</span>
                <span className="bg-accent-light/20 text-accent rounded-md p-3">
                  <Icon aria-hidden="true" size={24} strokeWidth={1.7} />
                </span>
              </div>

              <p className="text-muted mb-3 font-mono text-xs tracking-[0.12em] uppercase">
                {analysis.eyebrow}
              </p>
              <h2 className="mb-4 font-mono text-2xl tracking-tight md:text-3xl">
                {analysis.title}
              </h2>
              <p className="text-muted leading-7">{analysis.description}</p>

              <div className="border-border mt-auto flex items-center justify-between gap-4 border-t pt-6">
                <span className="text-muted text-xs">{analysis.detail}</span>
                <ArrowRight
                  aria-hidden="true"
                  className="text-accent shrink-0 transition-transform group-hover:translate-x-1"
                  size={20}
                />
              </div>
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

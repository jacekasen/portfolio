import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/PageHeader';
import { Cs2FormMomentumChart } from '@/components/cs2/Cs2FormMomentumChart';
import { Cs2FormStatusMeter } from '@/components/cs2/Cs2FormStatusMeter';
import { Cs2PlayerAutocomplete } from '@/components/cs2/Cs2PlayerAutocomplete';
import { Cs2RecentFormStrip } from '@/components/cs2/Cs2RecentFormStrip';
import { Cs2SubNav } from '@/components/cs2/Cs2SubNav';
import { Cs2TournamentFormTable } from '@/components/cs2/Cs2TournamentFormTable';
import { computeFormMetrics, fetchPlayerMapHistory } from '@/lib/cs2/trends';
import { isSupabaseConfigured } from '@/lib/supabase';

export const metadata: Metadata = {
  title: 'CS2 Form Tracker & Momentum | Jace Kasen',
  description:
    'Visualizing good vs. bad form in Counter-Strike 2 using career baseline relative deltas, 20-map match ribbons, and diverging momentum charts.',
};

type PageProps = {
  searchParams: Promise<{
    player?: string;
  }>;
};

const DEFAULT_PLAYER = 'donk';
const STAR_PRESETS = ['donk', 'ZywOo', 'm0NESY', 'NiKo', 'ropz', 'b1t'];

export default async function Cs2FormPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const player = resolvedParams.player?.trim() || DEFAULT_PLAYER;

  if (!isSupabaseConfigured()) {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Counter-Strike 2 Analysis"
          title="CS2 Form Tracker"
          description="Visualizing good vs. bad form using career relative deltas and momentum charts."
        />
        <div className="border-border bg-surface rounded-lg border p-6 text-center">
          <p className="text-muted font-mono text-sm">Database connection not configured.</p>
        </div>
      </div>
    );
  }

  const rawMaps = await fetchPlayerMapHistory(player);
  const formAnalysis = computeFormMetrics(rawMaps, 10);

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Counter-Strike 2 Telemetry · Form Intelligence"
        title="CS2 Form Tracker"
        description="Instantly identify whether a player is in peak form, performing at their career standard, or in a slump. Compares rolling 10-map rating momentum against individual career baselines."
      />

      <Cs2SubNav player={player} />

      {/* Player Search and Preset Pills */}
      <section aria-label="Select player" className="space-y-4">
        <div className="border-border bg-surface grid gap-4 rounded-lg border p-5 sm:grid-cols-[1fr_auto] md:p-6">
          <div>
            <label htmlFor="cs2-form-search" className="mb-2 block font-mono text-xs font-bold tracking-wide uppercase">
              Select Professional Player
            </label>
            <form
              method="GET"
              action="/projects/cs2/form"
              className="flex max-w-md items-center gap-2"
            >
              <div className="flex-1">
                <Cs2PlayerAutocomplete
                  inputId="cs2-form-search"
                  defaultValue={player}
                />
              </div>
              <button
                type="submit"
                className="bg-accent text-background hover:bg-accent/90 h-11 rounded px-5 font-mono text-sm font-bold transition-colors"
              >
                Inspect
              </button>
            </form>
          </div>

          <div className="flex flex-col justify-end">
            <span className="text-muted mb-2 font-mono text-xs font-medium">Quick Presets:</span>
            <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
              {STAR_PRESETS.map((star) => {
                const isCurrent = star.toLowerCase() === player.toLowerCase();
                return (
                  <Link
                    key={star}
                    href={`/projects/cs2/form?player=${encodeURIComponent(star)}`}
                    className={`rounded px-2.5 py-1.5 transition-colors ${
                      isCurrent
                        ? 'bg-accent text-background font-bold'
                        : 'border-border hover:bg-ink hover:text-on-ink border bg-background'
                    }`}
                  >
                    {star}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {!formAnalysis ? (
        <div className="border-border bg-surface rounded-lg border p-8 text-center">
          <p className="text-foreground font-mono text-base font-bold">
            No match records found for &quot;{player}&quot;
          </p>
          <div className="mt-4 flex justify-center">
            <Link
              href="/projects/cs2/form?player=donk"
              className="bg-accent text-background rounded px-4 py-2 font-mono text-xs font-bold"
            >
              Reset to donk
            </Link>
          </div>
        </div>
      ) : (
        <Suspense fallback={<div className="text-muted font-mono text-sm">Analyzing form...</div>}>
          <div className="space-y-10">
            {/* 1. The Form Status Verdict & KPI Cards */}
            <Cs2FormStatusMeter form={formAnalysis} />

            {/* 2. Recent Map Match Ribbon (Heatstrip) */}
            <Cs2RecentFormStrip recentMaps={formAnalysis.recentMaps} />

            {/* 3. Diverging Form Momentum Area Chart */}
            <section aria-label="Career momentum swings" className="space-y-3">
              <div>
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
                  Career Form Swings &amp; Momentum Wave
                </h3>
                <p className="text-muted text-xs">
                  Zero-centered baseline chart displaying moving 10-map rating delta against {player}&apos;s career baseline ({formAnalysis.careerAvgRating.toFixed(2)}). Green waves indicate peak form; red valleys indicate slumps.
                </p>
              </div>

              <Cs2FormMomentumChart
                points={formAnalysis.momentumPoints}
                careerAvg={formAnalysis.careerAvgRating}
                windowSize={10}
              />
            </section>

            {/* 4. Tournament by Tournament Form Impact */}
            <Cs2TournamentFormTable tournaments={formAnalysis.tournamentBreakdown} />
          </div>
        </Suspense>
      )}
    </div>
  );
}

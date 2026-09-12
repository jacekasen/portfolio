import { Suspense } from 'react';
import type { Metadata } from 'next';
import { PageHeader } from '@/components/PageHeader';
import { Cs2SubNav } from '@/components/cs2/Cs2SubNav';
import { Cs2TrendDashboard } from '@/components/cs2/Cs2TrendDashboard';
import { fetchPlayerMapHistory } from '@/lib/cs2/trends';
import { isSupabaseConfigured } from '@/lib/supabase';

export const metadata: Metadata = {
  title: 'Counter-Strike 2 Analysis | Jace Kasen',
  description:
    'Map-to-map performance trends and rolling window smoothing on HLTV Rating 3.0 across 65 tier-1 CS2 tournaments.',
};

type PageProps = {
  searchParams: Promise<{
    player?: string;
  }>;
};

const DEFAULT_PLAYER = 'donk';

export default async function Cs2AnalysisPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const player = resolvedParams.player?.trim() || DEFAULT_PLAYER;

  if (!isSupabaseConfigured()) {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Professional CS2 Telemetry"
          title="Counter-Strike 2 Analysis"
          description="Interactive map-to-map performance trends using rolling window smoothing on HLTV Rating 3.0."
        />
        <div className="border-border bg-surface rounded-lg border p-6 text-center">
          <p className="text-muted font-mono text-sm">
            Database connection not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.
          </p>
        </div>
      </div>
    );
  }

  const rawMaps = await fetchPlayerMapHistory(player);

  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="Professional CS2 Telemetry · 2023–2026"
        title="Counter-Strike 2 Analysis"
        description="Tracking map-to-map variance, peak form, and career trajectory across professional CS2 tournaments. Uses rolling window moving averages on HLTV Rating 3.0 to filter single-map noise and surface true performance momentum."
      />

      <Cs2SubNav player={player} />

      {rawMaps.length === 0 ? (
        <div className="border-border bg-surface rounded-lg border p-8 text-center">
          <p className="text-foreground font-mono text-base font-bold">
            No CS2 match records found for &quot;{player}&quot;
          </p>
          <p className="text-muted mt-2 text-sm">
            Try searching for another player (e.g. donk, ZywOo, m0NESY, NiKo, ropz, b1t, sh1ro, KSCERATO).
          </p>
          <div className="mt-4 flex justify-center">
            <a
              href="/projects/cs2?player=donk"
              className="bg-accent text-background rounded px-4 py-2 font-mono text-xs font-bold"
            >
              Reset to donk
            </a>
          </div>
        </div>
      ) : (
        <Suspense fallback={<div className="text-muted font-mono text-sm">Loading telemetry...</div>}>
          <Cs2TrendDashboard rawMaps={rawMaps} playerNick={player} />
        </Suspense>
      )}

      {/* Methodology and Pipeline Overview */}
      <section aria-label="Methodology and engineering details" className="border-border border-t pt-10">
        <h2 className="text-foreground font-mono text-sm font-bold tracking-wider uppercase">
          Pipeline Architecture &amp; Methodology
        </h2>

        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="border-border bg-surface rounded-lg border p-5">
            <h3 className="font-mono text-xs font-bold text-foreground uppercase">1. Dataset Milestones</h3>
            <p className="text-muted mt-2 text-xs leading-relaxed">
              Ingested 100% of all 65 concluded CS2 MVP tournaments from IEM Sydney 2023 through mid-2026, comprising 1,796 matches and 40,920 map-level official boxscores.
            </p>
          </div>

          <div className="border-border bg-surface rounded-lg border p-5">
            <h3 className="font-mono text-xs font-bold text-foreground uppercase">2. Rolling Smoothing</h3>
            <p className="text-muted mt-2 text-xs leading-relaxed">
              Individual CS2 maps exhibit high variance due to economy, side imbalances, and OT rounds. Moving windows (5–20 maps) isolate genuine form trajectories and career peaks from noise.
            </p>
          </div>

          <div className="border-border bg-surface rounded-lg border p-5">
            <h3 className="font-mono text-xs font-bold text-foreground uppercase">3. HLTV Rating 3.0</h3>
            <p className="text-muted mt-2 text-xs leading-relaxed">
              Features HLTV Rating 3.0 metrics along with Average Damage per Round (ADR), KAST percentage, and Round Swing contributions extracted directly from cached match scorecards.
            </p>
          </div>

          <div className="border-border bg-surface rounded-lg border p-5">
            <h3 className="font-mono text-xs font-bold text-foreground uppercase">4. Data Lake &amp; Supabase</h3>
            <p className="text-muted mt-2 text-xs leading-relaxed">
              Demos are processed via high-performance Source 2 parsers into a Snappy Parquet lake (598k+ kills), while tournament metadata and boxscores synchronize to Supabase PostgreSQL.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

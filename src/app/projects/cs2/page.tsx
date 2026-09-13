import { Suspense } from 'react';
import type { Metadata } from 'next';
import { PageHeader } from '@/components/PageHeader';
import { Cs2RadarPlayerSearch } from '@/components/cs2/radar/Cs2RadarPlayerSearch';
import { Cs2SubNav } from '@/components/cs2/Cs2SubNav';
import { Cs2TrendDashboard } from '@/components/cs2/Cs2TrendDashboard';
import { getRadarManifest } from '@/lib/cs2/manifest';
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
            Database connection not configured. Please set NEXT_PUBLIC_SUPABASE_URL and
            NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.
          </p>
        </div>
      </div>
    );
  }

  const [manifest, rawMaps] = await Promise.all([
    getRadarManifest(),
    fetchPlayerMapHistory(player),
  ]);

  return (
    <div className="space-y-8">
      <div className="space-y-6">
        <PageHeader
          eyebrow="Professional CS2 Telemetry · 2023–2026"
          title="Counter-Strike 2 Analysis"
          description="Tracking map-to-map variance of HLTV Rating 3.0, peak form, and career trajectory across professional CS2 tournaments."
        />

        <Cs2SubNav player={player} />

        <Cs2RadarPlayerSearch
          manifest={manifest}
          selectedPlayer={player}
          basePath="/projects/cs2"
        />
      </div>

      {rawMaps.length === 0 ? (
        <div className="border-border bg-surface rounded-lg border p-8 text-center">
          <p className="text-foreground font-mono text-base font-bold">
            No CS2 match records found for &quot;{player}&quot;
          </p>
          <p className="text-muted mt-2 text-sm">
            Try searching for another player (e.g. donk, ZywOo, m0NESY, NiKo, ropz, b1t, sh1ro,
            KSCERATO).
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
        <Suspense
          fallback={<div className="text-muted font-mono text-sm">Loading telemetry...</div>}
        >
          <Cs2TrendDashboard rawMaps={rawMaps} playerNick={player} />
        </Suspense>
      )}
    </div>
  );
}

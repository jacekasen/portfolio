import { Suspense } from 'react';
import type { Metadata } from 'next';
import { PageHeader } from '@/components/PageHeader';
import { Cs2RadarPlayerSearch } from '@/components/cs2/radar/Cs2RadarPlayerSearch';
import { Cs2SubNav } from '@/components/cs2/Cs2SubNav';
import { Cs2RadarHeatmap } from '@/components/cs2/radar/Cs2RadarHeatmap';
import { getRadarManifest } from '@/lib/cs2/manifest';

export const metadata: Metadata = {
  title: 'CS2 2D Radar Heatmap & Duel Analytics | Jace Kasen',
  description:
    'Interactive 2D radar kill and duel engagement heatmaps across professional Counter-Strike 2 tournaments. Spatial vectors, opening duels, and weapon distribution.',
};

type PageProps = {
  searchParams: Promise<{
    player?: string;
    map?: string;
  }>;
};

export default async function Cs2RadarPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const player = resolvedParams.player?.trim() || 'donk';
  const map = resolvedParams.map?.trim() || 'mirage';

  const manifest = await getRadarManifest();

  return (
    <div className="space-y-8">
      <div className="space-y-6">
        <PageHeader
          eyebrow="Counter-Strike 2 Spatial Telemetry · Active Duty"
          title="2D Radar Kill & Duel Heatmap"
          description="Explore 598,000+ tier-1 combat events through engagement vectors, spatial kill clusters, opening duels, and weapon usage."
        />

        <Cs2SubNav player={player} />

        <Cs2RadarPlayerSearch
          manifest={manifest}
          selectedPlayer={player}
          basePath="/projects/cs2/radar"
        />
      </div>

      {!manifest ? (
        <div className="border-border bg-surface rounded-lg border p-6 text-center">
          <p className="text-muted font-mono text-sm">
            Radar manifest not found. Please ensure public radar datasets are built.
          </p>
        </div>
      ) : (
        <Suspense
          fallback={<div className="text-muted font-mono text-sm">Loading tactical radar...</div>}
        >
          <Cs2RadarHeatmap manifest={manifest} initialPlayer={player} initialMap={map} />
        </Suspense>
      )}
    </div>
  );
}

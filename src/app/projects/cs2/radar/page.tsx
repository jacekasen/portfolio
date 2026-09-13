import fs from 'fs/promises';
import path from 'path';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { PageHeader } from '@/components/PageHeader';
import { Cs2SubNav } from '@/components/cs2/Cs2SubNav';
import { Cs2RadarHeatmap } from '@/components/cs2/radar/Cs2RadarHeatmap';
import type { RadarManifest } from '@/lib/cs2/radar';

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

async function getManifest(): Promise<RadarManifest | null> {
  try {
    const filePath = path.join(process.cwd(), 'public/data/cs2/radar/manifest.json');
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as RadarManifest;
  } catch (err) {
    console.error('Failed to load radar manifest:', err);
    return null;
  }
}

export default async function Cs2RadarPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const player = resolvedParams.player?.trim() || 'donk';
  const map = resolvedParams.map?.trim() || 'mirage';

  const manifest = await getManifest();

  if (!manifest) {
    return (
      <div className="space-y-6">
        <PageHeader
          compact
          eyebrow="Counter-Strike 2 Spatial Telemetry"
          title="2D Radar Kill & Duel Analytics"
          description="Interactive engagement vectors and spatial kill distributions across active-duty competitive maps."
        />
        <Cs2SubNav player={player} />
        <div className="border-border bg-surface rounded-lg border p-6 text-center">
          <p className="text-muted font-mono text-sm">
            Radar manifest not found. Please ensure public radar datasets are built.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        compact
        eyebrow="Counter-Strike 2 Spatial Telemetry · Active Duty"
        title="2D Radar Kill & Duel Heatmap"
        description="Interactive 2D radar overheads projecting 598,000+ combat events from tier-1 professional tournaments. Inspect directional engagement vectors, spatial kill clusters, opening duels, and weapon distribution."
      />

      <Cs2SubNav player={player} />

      <Suspense
        fallback={<div className="text-muted font-mono text-sm">Loading tactical radar...</div>}
      >
        <Cs2RadarHeatmap manifest={manifest} initialPlayer={player} initialMap={map} />
      </Suspense>
    </div>
  );
}

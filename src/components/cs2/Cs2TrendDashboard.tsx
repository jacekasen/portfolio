'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { computeRollingRating, type PlayerMapStat } from '@/lib/cs2/trends';
import { Cs2TrendChart } from './Cs2TrendChart';

type Cs2TrendDashboardProps = {
  rawMaps: PlayerMapStat[];
  playerNick: string;
};

const WINDOW_OPTIONS = [5, 10, 15, 20];
const MAP_OPTIONS = [
  { label: 'All Maps', value: 'all' },
  { label: 'Mirage', value: 'mirage' },
  { label: 'Nuke', value: 'nuke' },
  { label: 'Ancient', value: 'ancient' },
  { label: 'Inferno', value: 'inferno' },
  { label: 'Dust2', value: 'dust2' },
  { label: 'Anubis', value: 'anubis' },
  { label: 'Vertigo', value: 'vertigo' },
  { label: 'Overpass', value: 'overpass' },
];

export function Cs2TrendDashboard({ rawMaps, playerNick }: Cs2TrendDashboardProps) {
  const searchParams = useSearchParams();

  const [windowSize, setWindowSize] = useState<number>(() => {
    const w = Number(searchParams.get('window'));
    return WINDOW_OPTIONS.includes(w) ? w : 10;
  });

  const [mapFilter, setMapFilter] = useState<string>(() => {
    const m = searchParams.get('map')?.toLowerCase();
    return MAP_OPTIONS.some((opt) => opt.value === m) ? m! : 'all';
  });

  const smoothedPoints = useMemo(() => {
    return computeRollingRating(rawMaps, windowSize, mapFilter);
  }, [rawMaps, windowSize, mapFilter]);

  const selectedMapSummary = useMemo(() => {
    if (mapFilter === 'all' || smoothedPoints.length === 0) return null;

    const totalRating = smoothedPoints.reduce((sum, point) => sum + point.rawRating, 0);
    return {
      mapName: smoothedPoints[0].mapName,
      count: smoothedPoints.length,
      avgRating: totalRating / smoothedPoints.length,
    };
  }, [mapFilter, smoothedPoints]);

  const handleWindowChange = (w: number) => {
    setWindowSize(w);
  };

  const handleMapChange = (m: string) => {
    setMapFilter(m);
  };

  return (
    <div className="space-y-3">
      {/* Main Chart Section with Filter Controls */}
      <section aria-label="Map-to-map rating trends" className="space-y-3">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-foreground text-lg font-bold">
              Map-to-Map Performance &amp; Rolling Rating 3.0
            </h2>
            <p className="text-muted text-xs">
              Chronological CS2 match maps for{' '}
              <span className="text-accent font-semibold">{playerNick}</span> with moving average
              smoothing
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:items-end">
            {/* Controls: Window Size & Map Pool */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Window Size Pills */}
              <div className="flex items-center gap-1">
                <span className="text-muted font-mono text-xs">Window:</span>
                <div className="border-border bg-background inline-flex rounded-md border p-0.5 font-mono text-xs">
                  {WINDOW_OPTIONS.map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => handleWindowChange(w)}
                      className={`rounded px-2.5 py-1 transition-colors ${
                        windowSize === w
                          ? 'bg-accent text-background font-bold'
                          : 'text-muted hover:text-foreground'
                      }`}
                    >
                      {w}M
                    </button>
                  ))}
                </div>
              </div>

              {/* Map Filter Dropdown */}
              <div className="flex items-center gap-1">
                <span className="text-muted font-mono text-xs">Map:</span>
                <select
                  value={mapFilter}
                  onChange={(e) => handleMapChange(e.target.value)}
                  className="border-border bg-background text-foreground h-8 rounded border px-2 font-mono text-xs focus:outline-none"
                >
                  {MAP_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedMapSummary && (
              <p className="text-muted font-mono text-[11px]">
                <span className="text-foreground font-semibold">{selectedMapSummary.mapName}</span>
                {' · '}
                {selectedMapSummary.count} maps · {selectedMapSummary.avgRating.toFixed(2)} average
              </p>
            )}
          </div>
        </div>

        {/* The Interactive Trend Chart */}
        <Cs2TrendChart points={smoothedPoints} windowSize={windowSize} playerNick={playerNick} />
      </section>
    </div>
  );
}

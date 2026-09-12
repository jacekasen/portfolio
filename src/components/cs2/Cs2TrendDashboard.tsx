'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { computeRollingRating, type PlayerMapStat } from '@/lib/cs2/trends';
import { Cs2PlayerAutocomplete } from './Cs2PlayerAutocomplete';
import { Cs2TrendChart } from './Cs2TrendChart';

type Cs2TrendDashboardProps = {
  rawMaps: PlayerMapStat[];
  playerNick: string;
};

const STAR_PRESETS = ['donk', 'ZywOo', 'm0NESY', 'NiKo', 'ropz', 'b1t'];
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
      {/* Search & Player Quick Select */}
      <section aria-label="Player search and filters">
        <div className="border-border bg-surface grid gap-3 rounded-lg border p-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="flex min-w-0 items-center gap-2">
            <label
              htmlFor="cs2-player-search"
              className="text-muted shrink-0 font-mono text-[11px] font-bold tracking-wide uppercase"
            >
              Player
            </label>
            <form
              method="GET"
              action="/projects/cs2"
              className="flex max-w-md min-w-0 flex-1 items-center gap-2"
            >
              <div className="flex-1">
                <Cs2PlayerAutocomplete inputId="cs2-player-search" defaultValue={playerNick} />
              </div>
              <button
                type="submit"
                className="bg-accent text-background hover:bg-accent/90 h-11 rounded px-5 font-mono text-sm font-bold transition-colors"
              >
                Go
              </button>
            </form>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted font-mono text-[11px] font-medium">Quick Select:</span>
            <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
              {STAR_PRESETS.map((star) => {
                const isCurrent = star.toLowerCase() === playerNick.toLowerCase();
                return (
                  <Link
                    key={star}
                    href={`/projects/cs2?player=${encodeURIComponent(star)}`}
                    className={`rounded px-2.5 py-1.5 transition-colors ${
                      isCurrent
                        ? 'bg-accent text-background font-bold'
                        : 'border-border hover:bg-ink hover:text-on-ink bg-background border'
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

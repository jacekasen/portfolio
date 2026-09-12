'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Activity, Award, Flame, MapPin, Swords, TrendingUp } from 'lucide-react';
import {
  computeCareerSummary,
  computeRollingRating,
  type PlayerMapStat,
} from '@/lib/cs2/trends';
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
  const router = useRouter();
  const searchParams = useSearchParams();

  const [windowSize, setWindowSize] = useState<number>(() => {
    const w = Number(searchParams.get('window'));
    return WINDOW_OPTIONS.includes(w) ? w : 10;
  });

  const [mapFilter, setMapFilter] = useState<string>(() => {
    const m = searchParams.get('map')?.toLowerCase();
    return MAP_OPTIONS.some((opt) => opt.value === m) ? m! : 'all';
  });

  // Calculate career metrics and smoothed points
  const summary = useMemo(() => {
    return computeCareerSummary(rawMaps, windowSize);
  }, [rawMaps, windowSize]);

  const smoothedPoints = useMemo(() => {
    return computeRollingRating(rawMaps, windowSize, mapFilter);
  }, [rawMaps, windowSize, mapFilter]);

  const handleWindowChange = (w: number) => {
    setWindowSize(w);
  };

  const handleMapChange = (m: string) => {
    setMapFilter(m);
  };

  return (
    <div className="space-y-8">
      {/* Search & Player Quick Select */}
      <section aria-label="Player search and filters" className="space-y-4">
        <div className="border-border bg-surface grid gap-4 rounded-lg border p-5 sm:grid-cols-[1fr_auto] md:p-6">
          <div>
            <label htmlFor="cs2-player-search" className="mb-2 block font-mono text-xs font-bold tracking-wide uppercase">
              Select Professional Player
            </label>
            <form
              method="GET"
              action="/projects/cs2"
              className="flex max-w-md items-center gap-2"
            >
              <div className="flex-1">
                <Cs2PlayerAutocomplete
                  inputId="cs2-player-search"
                  defaultValue={playerNick}
                />
              </div>
              <button
                type="submit"
                className="bg-accent text-background hover:bg-accent/90 h-11 rounded px-5 font-mono text-sm font-bold transition-colors"
              >
                Go
              </button>
            </form>
          </div>

          <div className="flex flex-col justify-end">
            <span className="text-muted mb-2 font-mono text-xs font-medium">Quick Select:</span>
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

      {/* Summary KPI Cards */}
      {summary && (
        <section aria-label="Player telemetry summary" className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="border-border bg-surface rounded-lg border p-4">
            <div className="text-muted flex items-center gap-2 font-mono text-xs">
              <Award size={15} className="text-accent" />
              <span>Career Rating</span>
            </div>
            <div className="mt-2 font-mono text-2xl font-bold tracking-tight text-foreground">
              {summary.avgRating.toFixed(2)}
            </div>
            <p className="text-muted mt-1 text-xs">Across {summary.totalMaps} maps</p>
          </div>

          <div className="border-border bg-surface rounded-lg border p-4">
            <div className="text-muted flex items-center gap-2 font-mono text-xs">
              <Flame size={15} className="text-amber-700" />
              <span>Peak Form ({windowSize}M)</span>
            </div>
            <div className="mt-2 font-mono text-2xl font-bold tracking-tight text-amber-800">
              {summary.peakSmoothedRating.toFixed(2)}
            </div>
            <p className="text-muted mt-1 truncate text-xs">
              {summary.peakWindowInfo?.tournament ?? 'Tournament'}
            </p>
          </div>

          <div className="border-border bg-surface rounded-lg border p-4">
            <div className="text-muted flex items-center gap-2 font-mono text-xs">
              <TrendingUp size={15} className="text-emerald-700" />
              <span>Current Form</span>
            </div>
            <div className="mt-2 font-mono text-2xl font-bold tracking-tight text-emerald-800">
              {summary.currentFormRating.toFixed(2)}
            </div>
            <p className="text-muted mt-1 text-xs">Last 10 map average</p>
          </div>

          <div className="border-border bg-surface rounded-lg border p-4">
            <div className="text-muted flex items-center gap-2 font-mono text-xs">
              <Swords size={15} className="text-sky-700" />
              <span>K/D &amp; ADR</span>
            </div>
            <div className="mt-2 font-mono text-2xl font-bold tracking-tight text-sky-900">
              {summary.kdRatio.toFixed(2)}
            </div>
            <p className="text-muted mt-1 text-xs">{summary.avgAdr.toFixed(1)} ADR · {summary.avgKast.toFixed(0)}% KAST</p>
          </div>
        </section>
      )}

      {/* Main Chart Section with Filter Controls */}
      <section aria-label="Map-to-map rating trends" className="space-y-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-foreground text-lg font-bold">
              Map-to-Map Performance &amp; Rolling Rating 3.0
            </h2>
            <p className="text-muted text-xs">
              Chronological CS2 match maps for <span className="text-accent font-semibold">{playerNick}</span> with moving average smoothing
            </p>
          </div>

          {/* Controls: Window Size & Map Pool */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Window Size Pills */}
            <div className="flex items-center gap-1">
              <span className="text-muted font-mono text-xs">Window:</span>
              <div className="border-border inline-flex rounded-md border bg-background p-0.5 font-mono text-xs">
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
        </div>

        {/* The Interactive Trend Chart */}
        <Cs2TrendChart
          points={smoothedPoints}
          windowSize={windowSize}
          playerNick={playerNick}
        />
      </section>

      {/* Map Pool Breakdown Table */}
      {summary && summary.mapBreakdown.length > 0 && (
        <section aria-label="Map pool breakdown" className="space-y-3 pt-4">
          <h3 className="text-foreground flex items-center gap-2 font-mono text-sm font-bold tracking-wide uppercase">
            <MapPin size={16} className="text-accent" />
            <span>Map Pool Performance Breakdown</span>
          </h3>

          <div className="border-border bg-surface grid gap-3 rounded-lg border p-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {summary.mapBreakdown.map((m) => {
              const isSelected = mapFilter.toLowerCase() === m.mapName.toLowerCase();
              return (
                <button
                  key={m.mapName}
                  type="button"
                  onClick={() => handleMapChange(isSelected ? 'all' : m.mapName.toLowerCase())}
                  className={`border-border flex flex-col justify-between rounded-md border p-3 text-left transition-all ${
                    isSelected
                      ? 'border-accent bg-accent/10 ring-1 ring-accent'
                      : 'bg-background hover:border-muted hover:bg-black/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-foreground">{m.mapName}</span>
                    <span className="text-muted font-mono text-[11px]">{m.count} maps</span>
                  </div>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span
                      className={`font-mono text-base font-bold ${
                        m.avgRating >= 1.15
                          ? 'text-emerald-800'
                          : m.avgRating >= 1.0
                          ? 'text-accent'
                          : 'text-rose-800'
                      }`}
                    >
                      {m.avgRating.toFixed(2)}
                    </span>
                    <span className="text-muted text-[10px]">Avg Rating</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

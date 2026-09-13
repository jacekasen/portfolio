'use client';

import { useState } from 'react';
import { RATING_TIERS, ratingTier, type RatingTierId } from '@/lib/cs2/form-display';
import type { PlayerMapStat } from '@/lib/cs2/trends';

const TIER_STYLES: Record<RatingTierId, string> = {
  excellent: 'border-emerald-500 bg-emerald-100 text-emerald-950',
  strong: 'border-emerald-300 bg-emerald-50 text-emerald-900',
  solid: 'border-sky-300 bg-sky-50 text-sky-950',
  below: 'border-amber-300 bg-amber-50 text-amber-950',
  poor: 'border-rose-300 bg-rose-50 text-rose-950',
};

export function Cs2RecentFormStrip({ recentMaps }: { recentMaps: PlayerMapStat[] }) {
  const [activeId, setActiveId] = useState<number | null>(null);
  const activeMap = recentMaps.find((map) => map.id === activeId) ?? recentMaps.at(-1);

  return (
    <div className="space-y-3">
      <ul
        aria-label="Rating tiers"
        className="text-muted flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs"
      >
        {RATING_TIERS.map((tier) => (
          <li key={tier.id} className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className={`h-2.5 w-2.5 rounded-sm border ${TIER_STYLES[tier.id]}`}
            />
            {tier.label} {tier.range}
          </li>
        ))}
      </ul>

      <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-10">
        {recentMaps.map((map) => {
          const isActive = map.id === activeMap?.id;

          return (
            <button
              key={map.id}
              type="button"
              aria-pressed={isActive}
              aria-label={`${map.mapName}, rating ${map.rating.toFixed(2)}, ${map.kills}-${map.deaths}`}
              onClick={() => setActiveId(map.id)}
              onMouseEnter={() => setActiveId(map.id)}
              onFocus={() => setActiveId(map.id)}
              className={`flex h-20 flex-col justify-between rounded border p-2 text-center font-mono transition-shadow ${
                TIER_STYLES[ratingTier(map.rating).id]
              } ${isActive ? 'ring-accent ring-2 ring-offset-1' : ''}`}
            >
              <span className="truncate text-[11px] opacity-80">{map.mapName}</span>
              <span className="text-sm font-bold">{map.rating.toFixed(2)}</span>
              <span className="truncate text-[11px] opacity-70">
                {map.kills}-{map.deaths}
              </span>
            </button>
          );
        })}
      </div>

      <div aria-hidden="true" className="text-muted flex justify-between font-mono text-xs">
        <span>← Oldest</span>
        <span>Most recent →</span>
      </div>

      {activeMap && (
        <div
          aria-live="polite"
          className="border-border bg-surface flex flex-wrap items-center justify-between gap-x-6 gap-y-2 rounded-lg border p-3 font-mono text-xs"
        >
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-accent font-bold">{activeMap.mapName}</span>
            <span className="text-muted">vs {activeMap.opponent}</span>
            <span className="text-muted">· {activeMap.tournament}</span>
            {activeMap.matchDate && (
              <span className="text-muted">· {activeMap.matchDate.slice(0, 10)}</span>
            )}
          </p>

          <dl className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <DetailStat label="Rating" value={activeMap.rating.toFixed(2)} />
            <DetailStat
              label="K-D"
              value={`${activeMap.kills}-${activeMap.deaths} (${activeMap.plusMinus >= 0 ? '+' : ''}${activeMap.plusMinus})`}
            />
            <DetailStat label="ADR" value={activeMap.adr.toFixed(1)} />
            <DetailStat label="KAST" value={`${activeMap.kastPct.toFixed(0)}%`} />
          </dl>
        </div>
      )}
    </div>
  );
}

function DetailStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-1.5">
      <dt className="text-muted">{label}</dt>
      <dd className="text-foreground font-bold">{value}</dd>
    </div>
  );
}

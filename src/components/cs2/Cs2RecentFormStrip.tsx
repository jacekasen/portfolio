'use client';

import { useState } from 'react';
import type { PlayerMapStat } from '@/lib/cs2/trends';

type Cs2RecentFormStripProps = {
  recentMaps: PlayerMapStat[];
};

export function Cs2RecentFormStrip({ recentMaps }: Cs2RecentFormStripProps) {
  const [activeMap, setActiveMap] = useState<PlayerMapStat | null>(null);

  const getTier = (r: number) => {
    if (r >= 1.40) {
      return {
        bg: 'bg-emerald-100 border-emerald-500 text-emerald-950 font-bold ring-1 ring-emerald-500/40',
        label: 'Godlike',
      };
    }
    if (r >= 1.15) {
      return {
        bg: 'bg-emerald-50 border-emerald-400 text-emerald-900',
        label: 'In Form',
      };
    }
    if (r >= 1.00) {
      return {
        bg: 'bg-sky-50 border-sky-300 text-sky-950',
        label: 'Solid',
      };
    }
    if (r >= 0.85) {
      return {
        bg: 'bg-amber-50 border-amber-300 text-amber-950',
        label: 'Sub-par',
      };
    }
    return {
      bg: 'bg-rose-50 border-rose-300 text-rose-950',
      label: 'Cold',
    };
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
            Recent Map Form Ribbon (Last {recentMaps.length} Maps)
          </h3>
          <p className="text-muted text-[11px]">
            Chronological match-by-match performance strip. Green highlights surges; red highlights cold spells.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 font-mono text-[10px] text-muted">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-100 border border-emerald-500" />
            <span>&ge; 1.40</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-50 border border-emerald-400" />
            <span>1.15+</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-sky-50 border border-sky-300" />
            <span>1.00+</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-50 border border-rose-300" />
            <span>&lt; 1.00</span>
          </span>
        </div>
      </div>

      {/* Ribbon Grid */}
      <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
        {recentMaps.map((m, idx) => {
          const tier = getTier(m.rating);
          const isSelected = activeMap?.id === m.id;

          return (
            <button
              key={m.id}
              type="button"
              onMouseEnter={() => setActiveMap(m)}
              onFocus={() => setActiveMap(m)}
              className={`rounded border p-2 text-center transition-all cursor-pointer font-mono flex flex-col justify-between h-20 ${tier.bg} ${
                isSelected ? 'scale-105 shadow-lg brightness-125 ring-2 ring-white/40 z-10' : ''
              }`}
            >
              <div className="text-[10px] opacity-75 truncate">{m.mapName}</div>
              <div className="text-sm font-bold tracking-tight my-0.5">{m.rating.toFixed(2)}</div>
              <div className="text-[9px] opacity-70 truncate">{m.kills}-{m.deaths}</div>
            </button>
          );
        })}
      </div>

      {/* Details Box for Hovered Map */}
      {activeMap && (
        <div className="border-border bg-surface rounded-lg border p-3 flex flex-wrap items-center justify-between gap-3 font-mono text-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <span className="text-accent font-bold">{activeMap.mapName}</span>
            <span className="text-muted">vs {activeMap.opponent}</span>
            <span className="text-muted">({activeMap.tournament})</span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span>
              Rating: <strong className={activeMap.rating >= 1.0 ? 'text-emerald-800 font-bold' : 'text-rose-800 font-bold'}>{activeMap.rating.toFixed(2)}</strong>
            </span>
            <span>
              K-D: <strong className="text-foreground font-bold">{activeMap.kills}-{activeMap.deaths}</strong> ({activeMap.plusMinus >= 0 ? `+${activeMap.plusMinus}` : activeMap.plusMinus})
            </span>
            <span>
              ADR: <strong className="text-foreground font-bold">{activeMap.adr.toFixed(1)}</strong>
            </span>
            <span>
              KAST: <strong className="text-foreground font-bold">{activeMap.kastPct.toFixed(0)}%</strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

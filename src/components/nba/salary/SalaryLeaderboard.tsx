'use client';

import { useEffect, useRef, useState } from 'react';
import type { PlayerSalaryRow } from '@/lib/nba/salaries';
import {
  formatPercent,
  formatSalary,
  formatSalaryExact,
  qualityLabel,
  repairPlayerName,
} from '@/lib/nba/salary-format';
import { teamName } from '@/lib/nba/teams';
import { cn } from '@/lib/utils';
import { EmptyState, segmentColor } from './chart-ui';

const ALL_SEASONS = 'all';
const LIMIT = 25;

type SalaryLeaderboardProps = {
  seasons: string[];
  onSelectPlayer: (playerId: string, playerName: string) => void;
  selectedPlayerId: string | null;
};

/**
 * Historical cap share leaders. Loaded on its own, after the team view, and only for the
 * season currently being asked about.
 */
export function SalaryLeaderboard({
  seasons,
  onSelectPlayer,
  selectedPlayerId,
}: SalaryLeaderboardProps) {
  const [season, setSeason] = useState<string>(ALL_SEASONS);
  const [rows, setRows] = useState<PlayerSalaryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cache = useRef(new Map<string, PlayerSalaryRow[]>());

  useEffect(() => {
    const cached = cache.current.get(season);
    if (cached) {
      setRows(cached);
      setLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetch(`/api/nba/salaries/leaderboard?season=${encodeURIComponent(season)}&limit=${LIMIT}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('Request failed');
        return (await response.json()) as PlayerSalaryRow[];
      })
      .then((data) => {
        cache.current.set(season, data);
        setRows(data);
        setLoading(false);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setError(cause instanceof Error ? cause.message : 'Unknown error');
        setLoading(false);
      });

    return () => controller.abort();
  }, [season]);

  const max = Math.max(...rows.map((row) => row.cap_share ?? 0), 0);

  return (
    <section aria-labelledby="leaderboard-title" className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-accent mb-2 font-mono text-xs tracking-[0.14em] uppercase">
            03 · Across eras
          </p>
          <h2 id="leaderboard-title" className="font-mono text-2xl md:text-3xl">
            Highest cap shares
          </h2>
          <p className="text-muted mt-2 max-w-2xl text-sm leading-6">
            Ranked by share of that season&apos;s salary cap, which is what makes a $3M contract
            from the 1980s comparable to a $50M contract today.
          </p>
        </div>
        <label className="grid gap-2">
          <span className="font-mono text-xs font-bold tracking-wide uppercase">Season</span>
          <select
            value={season}
            onChange={(event) => setSeason(event.target.value)}
            className="border-border bg-background h-11 min-w-[12rem] rounded border px-3"
          >
            <option value={ALL_SEASONS}>All seasons</option>
            {seasons.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <p className="text-muted font-mono text-sm">Loading cap share leaders…</p>
      ) : error ? (
        <EmptyState title="Could not load the cap share leaders">
          The salary database did not respond. Change the season filter to try again.
        </EmptyState>
      ) : !rows.length ? (
        <EmptyState title="No salary records for this season">
          The dataset has no usable salary rows for {season === ALL_SEASONS ? 'any season' : season}
          .
        </EmptyState>
      ) : (
        <ol className="space-y-1">
          {rows.map((row, index) => {
            const percent = max > 0 ? ((row.cap_share ?? 0) / max) * 100 : 0;
            const isSelected = row.player_id === selectedPlayerId;

            return (
              <li key={`${row.player_id}-${row.season}-${row.team}`}>
                <button
                  type="button"
                  onClick={() => onSelectPlayer(row.player_id, row.player_name)}
                  aria-label={`Rank ${index + 1}: ${repairPlayerName(row.player_name)}, ${teamName(row.team)}, ${row.season}, salary ${formatSalaryExact(row.salary)}, salary cap ${formatSalaryExact(row.salary_cap)}, cap share ${formatPercent(row.cap_share)}. ${qualityLabel(row.salary_quality)}. Select for career history.`}
                  className={cn(
                    'focus-visible:ring-accent hover:bg-accent-light/10 flex w-full flex-col gap-1 rounded px-2 py-2 text-left focus-visible:ring-2 focus-visible:outline-none sm:grid sm:grid-cols-[1.75rem_11rem_1fr_4.5rem] sm:items-center sm:gap-x-3',
                    isSelected && 'bg-accent-light/15',
                  )}
                >
                  <span className="flex items-baseline gap-2 sm:contents">
                    <span className="text-muted font-mono text-xs">{index + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          'block truncate text-sm',
                          isSelected && 'text-accent font-bold',
                        )}
                      >
                        {repairPlayerName(row.player_name)}
                      </span>
                      <span className="text-muted block truncate font-mono text-[11px]">
                        {row.team} · {row.season} · {formatSalary(row.salary)} of{' '}
                        {formatSalary(row.salary_cap)}
                      </span>
                    </span>
                    <span className="font-mono text-sm sm:hidden">
                      {formatPercent(row.cap_share)}
                    </span>
                  </span>
                  <span className="bg-surface h-4 overflow-hidden rounded-sm">
                    <span
                      className="block h-full rounded-sm"
                      style={{
                        width: `${Math.max(percent, 1)}%`,
                        backgroundColor: segmentColor(index),
                      }}
                    />
                  </span>
                  <span className="hidden text-right font-mono text-sm sm:block">
                    {formatPercent(row.cap_share)}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

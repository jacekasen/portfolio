'use client';

import { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import type { PlayerSalaryRow } from '@/lib/nba/salaries';
import {
  careerPeak,
  formatPercent,
  formatSalary,
  formatSalaryExact,
  groupSeasonRecords,
  measureLabel,
  measureValue,
  qualityLabel,
  repairPlayerName,
  type SalaryMeasure,
} from '@/lib/nba/salary-format';
import { teamName } from '@/lib/nba/teams';
import { cn } from '@/lib/utils';
import { chartDomain, EmptyState, InspectorCard, niceTicks } from './chart-ui';

const CHART_WIDTH = 880;
const CHART_HEIGHT = 300;
const PADDING = { top: 20, right: 24, bottom: 46, left: 62 };

type PlayerSalaryPanelProps = {
  playerName: string;
  history: PlayerSalaryRow[];
  measure: SalaryMeasure;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onOpenTeamSeason: (row: PlayerSalaryRow) => void;
};

/** Career salary history for the selected player, measured against the cap of each season. */
export function PlayerSalaryPanel({
  playerName,
  history,
  measure,
  loading,
  error,
  onClose,
  onOpenTeamSeason,
}: PlayerSalaryPanelProps) {
  const seasons = useMemo(() => groupSeasonRecords(history), [history]);
  const peak = useMemo(() => careerPeak(history), [history]);
  const name = repairPlayerName(playerName);

  return (
    <section
      aria-labelledby="player-history-title"
      className="border-border bg-surface/50 rounded-lg border p-5 md:p-7"
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-accent mb-1 font-mono text-xs tracking-[0.14em] uppercase">
            02 · Player history
          </p>
          <h2 id="player-history-title" className="text-2xl font-bold">
            {name}
          </h2>
          {peak ? (
            <p className="text-muted mt-2 text-sm">
              Career high {formatPercent(peak.cap_share)} of the cap in {peak.season} with{' '}
              {teamName(peak.team)} · {formatSalaryExact(peak.salary)}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-muted hover:text-accent inline-flex items-center gap-1 font-mono text-xs"
        >
          <X size={14} aria-hidden="true" />
          close
        </button>
      </div>

      {loading ? (
        <p className="text-muted font-mono text-sm">Loading salary history…</p>
      ) : error ? (
        <EmptyState title="Could not load this player's salary history">
          {error} Try selecting the player again.
        </EmptyState>
      ) : !seasons.length ? (
        <EmptyState title="No salary records for this player">
          The salary dataset has no rows for {name}. Coverage is thinner before the modern contract
          era, and some careers are missing entirely.
        </EmptyState>
      ) : (
        <>
          <CareerChart seasons={seasons} measure={measure} name={name} />
          <RecordsTable seasons={seasons} onOpenTeamSeason={onOpenTeamSeason} />
        </>
      )}
    </section>
  );
}

type SeasonRecords = ReturnType<typeof groupSeasonRecords>[number];

function CareerChart({
  seasons,
  measure,
  name,
}: {
  seasons: SeasonRecords[];
  measure: SalaryMeasure;
  name: string;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const plotted = seasons.filter((season) => season.primary !== null);
  if (!plotted.length) {
    return (
      <EmptyState title="No usable salary values to chart">
        Every recorded season for {name} is missing a salary amount, so there is nothing to plot
        against the cap.
      </EmptyState>
    );
  }

  const values = plotted.flatMap((season) =>
    season.records.map((row) => measureValue(row, measure) ?? 0),
  );
  const domain = chartDomain(Math.max(...values));
  const ticks = niceTicks(Math.max(...values));
  const plotWidth = CHART_WIDTH - PADDING.left - PADDING.right;
  const plotHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;
  const xFor = (index: number) =>
    PADDING.left +
    (plotted.length === 1 ? plotWidth / 2 : (index / (plotted.length - 1)) * plotWidth);
  const yFor = (value: number) => PADDING.top + (1 - value / domain) * plotHeight;
  const labelStep = Math.ceil(plotted.length / 9);

  const linePath = plotted
    .map((season, index) => {
      const value = measureValue(season.primary!, measure) ?? 0;
      return `${index === 0 ? 'M' : 'L'} ${xFor(index)} ${yFor(value)}`;
    })
    .join(' ');

  const active = activeIndex === null ? null : plotted[activeIndex];
  const multiTeamSeasons = plotted.filter((season) => season.multiTeam).length;

  return (
    <div className="relative">
      <div className="border-border bg-background rounded-lg border p-3 md:p-4">
        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          className="h-auto w-full touch-none"
          role="button"
          tabIndex={0}
          aria-label={`${measureLabel(measure)} by season for ${name}, ${plotted.length} seasons from ${plotted[0].season} to ${plotted[plotted.length - 1].season}. Use the left and right arrow keys to step through seasons.`}
          onPointerLeave={() => setActiveIndex(null)}
          onPointerMove={(event) => {
            const bounds = event.currentTarget.getBoundingClientRect();
            const pointerX = ((event.clientX - bounds.left) / bounds.width) * CHART_WIDTH;
            const ratio = (pointerX - PADDING.left) / plotWidth;
            const index = Math.round(ratio * Math.max(plotted.length - 1, 1));
            setActiveIndex(Math.max(0, Math.min(plotted.length - 1, index)));
          }}
          onKeyDown={(event) => {
            if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
            event.preventDefault();
            setActiveIndex((current) => {
              const next = (current ?? -1) + (event.key === 'ArrowRight' ? 1 : -1);
              return Math.max(0, Math.min(plotted.length - 1, next));
            });
          }}
        >
          {ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={PADDING.left}
                x2={CHART_WIDTH - PADDING.right}
                y1={yFor(tick)}
                y2={yFor(tick)}
                className="stroke-border"
              />
              <text
                x={PADDING.left - 10}
                y={yFor(tick) + 4}
                textAnchor="end"
                className="fill-muted font-mono text-[11px]"
              >
                {measure === 'cap' ? `${tick}%` : formatSalary(tick)}
              </text>
            </g>
          ))}

          <path d={linePath} fill="none" stroke="var(--accent)" strokeWidth="2.5" />

          {plotted.map((season, index) => {
            const seasonValues = season.records
              .map((row) => measureValue(row, measure))
              .filter((value): value is number => value !== null);
            if (!seasonValues.length) return null;

            const x = xFor(index);
            const isActive = index === activeIndex;

            return (
              <g key={season.season}>
                {season.multiTeam ? (
                  <line
                    x1={x}
                    x2={x}
                    y1={yFor(Math.min(...seasonValues))}
                    y2={yFor(Math.max(...seasonValues))}
                    stroke="var(--accent)"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />
                ) : null}
                {season.records.map((row) => {
                  const value = measureValue(row, measure);
                  if (value === null) return null;
                  const isPrimary = row === season.primary;

                  return (
                    <circle
                      key={`${row.team}-${row.player_id}`}
                      cx={x}
                      cy={yFor(value)}
                      r={isActive ? 6 : isPrimary ? 3.5 : 3}
                      fill={isPrimary && !season.multiTeam ? 'var(--accent)' : 'var(--background)'}
                      stroke="var(--accent)"
                      strokeWidth="2"
                    />
                  );
                })}
              </g>
            );
          })}

          {plotted.map((season, index) =>
            index % labelStep === 0 || index === plotted.length - 1 ? (
              <text
                key={`label-${season.season}`}
                x={xFor(index)}
                y={CHART_HEIGHT - 16}
                textAnchor="middle"
                className="fill-muted font-mono text-[11px]"
              >
                {season.season}
              </text>
            ) : null,
          )}
        </svg>
      </div>

      {active ? (
        <InspectorCard
          className="top-2"
          anchorPercent={(xFor(plotted.indexOf(active)) / CHART_WIDTH) * 100}
          title={active.season}
          rows={
            active.multiTeam
              ? active.records.map((row) => ({
                  label: teamName(row.team),
                  value: `${formatSalary(row.salary)} · ${formatPercent(row.cap_share)}`,
                }))
              : [
                  { label: 'Salary', value: formatSalaryExact(active.primary!.salary) },
                  { label: 'Salary cap', value: formatSalaryExact(active.primary!.salary_cap) },
                  { label: 'Cap share', value: formatPercent(active.primary!.cap_share) },
                  { label: 'Team', value: teamName(active.primary!.team) },
                ]
          }
          note={
            active.multiTeam
              ? `${active.records.length} team records in this season, shown separately`
              : qualityLabel(active.primary!.salary_quality)
          }
        />
      ) : null}

      <p className="text-muted mt-3 text-xs leading-5">
        {measure === 'cap'
          ? 'Each point is one salary record as a share of that season’s cap, which makes eras directly comparable.'
          : 'Nominal dollars are not comparable across eras — switch back to cap share for that.'}{' '}
        {multiTeamSeasons
          ? `${multiTeamSeasons} ${multiTeamSeasons === 1 ? 'season has' : 'seasons have'} more than one team record; every record is drawn and joined by a dashed line, and the trend line follows the largest single record. Records are never added together, because the source rows are not consistently split amounts.`
          : ''}
      </p>
      <p className="sr-only" aria-live="polite">
        {active
          ? `${active.season}: ${active.records
              .map(
                (row) =>
                  `${teamName(row.team)}, ${formatSalaryExact(row.salary)}, ${formatPercent(row.cap_share)} of the cap`,
              )
              .join('; ')}`
          : ''}
      </p>
    </div>
  );
}

function RecordsTable({
  seasons,
  onOpenTeamSeason,
}: {
  seasons: SeasonRecords[];
  onOpenTeamSeason: (row: PlayerSalaryRow) => void;
}) {
  return (
    <details className="border-border bg-surface group mt-5 overflow-hidden rounded-lg border">
      <summary className="hover:bg-accent-light/10 flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-3 font-mono text-sm transition-colors">
        <span>
          View all {seasons.reduce((total, season) => total + season.records.length, 0)} salary
          records
        </span>
        <span className="text-accent group-open:rotate-45" aria-hidden="true">
          +
        </span>
      </summary>
      <div className="border-border overflow-x-auto border-t">
        <table className="w-full min-w-[38rem] text-left text-sm">
          <thead className="bg-accent-light/15 font-mono text-xs uppercase">
            <tr>
              <th className="px-3 py-2">Season</th>
              <th className="px-3 py-2">Team</th>
              <th className="px-3 py-2 text-right">Salary</th>
              <th className="px-3 py-2 text-right">Salary cap</th>
              <th className="px-3 py-2 text-right">Cap share</th>
            </tr>
          </thead>
          <tbody>
            {seasons.flatMap((season) =>
              season.records.map((row) => (
                <tr key={`${season.season}-${row.team}`} className="border-border border-t">
                  <td className="px-3 py-2 font-mono">{season.season}</td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => onOpenTeamSeason(row)}
                      className="hover:text-accent text-left hover:underline"
                    >
                      {teamName(row.team)}
                    </button>
                  </td>
                  <td
                    className={cn(
                      'px-3 py-2 text-right font-mono',
                      row.salary === null && 'text-muted',
                    )}
                  >
                    {formatSalaryExact(row.salary)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono">
                    {formatSalaryExact(row.salary_cap)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono">{formatPercent(row.cap_share)}</td>
                </tr>
              )),
            )}
          </tbody>
        </table>
      </div>
    </details>
  );
}

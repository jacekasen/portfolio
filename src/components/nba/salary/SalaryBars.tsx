'use client';

import { useState } from 'react';
import type { PlayerSalaryRow } from '@/lib/nba/salaries';
import {
  formatMeasure,
  formatPercent,
  formatSalaryExact,
  measureValue,
  qualityLabel,
  repairPlayerName,
  sortSalaryRows,
  type SalaryMeasure,
} from '@/lib/nba/salary-format';
import { teamName } from '@/lib/nba/teams';
import { cn } from '@/lib/utils';
import { chartDomain, InspectorCard, niceTicks, segmentColor } from './chart-ui';

const ROW_GRID = 'sm:grid sm:grid-cols-[9.5rem_1fr_5rem] sm:items-center sm:gap-x-3';

type SalaryBarsProps = {
  rows: PlayerSalaryRow[];
  measure: SalaryMeasure;
  salaryCap: number | null;
  selectedPlayerId: string | null;
  onSelect: (row: PlayerSalaryRow) => void;
};

/**
 * Primary visualization: one horizontal bar per roster salary record, sorted by the
 * active measure. Values are printed next to every bar, so nothing is hover-only.
 */
export function SalaryBars({
  rows,
  measure,
  salaryCap,
  selectedPlayerId,
  onSelect,
}: SalaryBarsProps) {
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const known = sortSalaryRows(
    rows.filter((row) => measureValue(row, measure) !== null),
    measure,
  );
  const missing = rows.filter((row) => row.salary === null);
  const maxValue = Math.max(...known.map((row) => measureValue(row, measure) ?? 0), 0);
  const domain = chartDomain(maxValue);
  const ticks = niceTicks(maxValue);
  const stepPercent = ticks.length > 1 ? ((ticks[1] - ticks[0]) / domain) * 100 : 100;

  // The cap reference only belongs on this chart when a contract actually approaches it.
  const capReference = measure === 'cap' ? 100 : salaryCap;
  const showCapReference = capReference !== null && capReference <= domain;
  const capReferencePercent = showCapReference ? ((capReference ?? 0) / domain) * 100 : 0;

  return (
    <div>
      <div className={cn('mb-2', ROW_GRID)}>
        <span className="text-muted hidden font-mono text-[11px] tracking-wide uppercase sm:block">
          Player
        </span>
        <div className="relative hidden h-4 sm:block" aria-hidden="true">
          {ticks.map((tick) => (
            <span
              key={tick}
              className="text-muted absolute font-mono text-[10px]"
              style={{ left: `${(tick / domain) * 100}%`, transform: 'translateX(-50%)' }}
            >
              {measure === 'cap' ? `${tick}%` : compactAxisDollars(tick)}
            </span>
          ))}
          {showCapReference ? (
            <span
              className="text-accent absolute font-mono text-[10px] font-bold"
              style={{ left: `${capReferencePercent}%`, transform: 'translateX(-50%)' }}
            >
              cap
            </span>
          ) : null}
        </div>
        <span className="text-muted hidden text-right font-mono text-[11px] tracking-wide uppercase sm:block">
          {measure === 'cap' ? 'Cap %' : 'Salary'}
        </span>
      </div>

      <ul className="space-y-1.5">
        {known.map((row, index) => {
          const key = rowKey(row);
          const value = measureValue(row, measure) ?? 0;
          const percent = domain > 0 ? (value / domain) * 100 : 0;
          const isSelected = row.player_id === selectedPlayerId;
          const isActive = activeKey === key;
          const name = repairPlayerName(row.player_name);

          return (
            <li key={key} className="relative">
              <button
                type="button"
                onClick={() => onSelect(row)}
                onPointerEnter={() => setActiveKey(key)}
                onPointerLeave={() => setActiveKey((current) => (current === key ? null : current))}
                onFocus={() => setActiveKey(key)}
                onBlur={() => setActiveKey((current) => (current === key ? null : current))}
                aria-label={barDescription(row, measure)}
                className={cn(
                  'focus-visible:ring-accent w-full rounded px-1 py-1 text-left focus-visible:ring-2 focus-visible:outline-none',
                  'hover:bg-accent-light/10',
                  isSelected && 'bg-accent-light/15',
                  ROW_GRID,
                )}
              >
                <span className="flex items-baseline justify-between gap-3 sm:block">
                  <span
                    className={cn(
                      'block truncate text-sm',
                      isSelected ? 'text-accent font-bold' : 'group-hover:text-accent',
                    )}
                    title={name}
                  >
                    {name}
                  </span>
                  <span className="font-mono text-xs sm:hidden">
                    {formatMeasure(value, measure)}
                  </span>
                </span>

                <span
                  className="bg-surface relative mt-1 block h-6 overflow-hidden rounded-sm sm:mt-0"
                  style={{
                    backgroundImage: `repeating-linear-gradient(to right, var(--border) 0 1px, transparent 1px ${stepPercent}%)`,
                  }}
                >
                  <span
                    className={cn(
                      'absolute inset-y-0 left-0 rounded-sm transition-[width] duration-200',
                      isSelected && 'ring-foreground/60 ring-2',
                    )}
                    style={{
                      width: `${Math.max(percent, 0.6)}%`,
                      backgroundColor: segmentColor(index),
                    }}
                  />
                  {showCapReference ? (
                    <span
                      className="border-accent absolute inset-y-0 border-l border-dashed"
                      style={{ left: `${capReferencePercent}%` }}
                    />
                  ) : null}
                </span>

                <span className="hidden text-right font-mono text-xs sm:block">
                  {formatMeasure(value, measure)}
                </span>
              </button>

              {isActive ? (
                <InspectorCard
                  className="top-full mt-1"
                  anchorPercent={percent}
                  title={name}
                  rows={inspectorRows(row)}
                  note={qualityLabel(row.salary_quality)}
                />
              ) : null}
            </li>
          );
        })}
      </ul>

      {missing.length ? (
        <div className="border-border mt-5 rounded border border-dashed p-4">
          <p className="font-mono text-xs tracking-wide uppercase">
            Salary not recorded · {missing.length}
          </p>
          <p className="text-muted mt-1 text-xs leading-5">
            These players appear on the roster in the source data with no usable salary value. They
            are left out of the chart and every payroll total rather than being counted as $0.
          </p>
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
            {missing.map((row) => (
              <li key={rowKey(row)}>
                <button
                  type="button"
                  onClick={() => onSelect(row)}
                  className="hover:text-accent text-sm hover:underline"
                >
                  {repairPlayerName(row.player_name)}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Team payroll measured against the league cap. This is the one place where 100% of the
 * cap is a meaningful boundary, and payroll is free to run past it.
 */
export function PayrollCapStrip({
  rows,
  payrollVsCap,
  selectedPlayerId,
}: {
  rows: PlayerSalaryRow[];
  payrollVsCap: number | null;
  selectedPlayerId: string | null;
}) {
  if (payrollVsCap === null) return null;

  const segments = sortSalaryRows(
    rows.filter((row) => row.cap_share !== null),
    'cap',
  );
  const domain = Math.max(100, chartDomain(payrollVsCap));
  const capPercent = (100 / domain) * 100;

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="text-muted font-mono text-[11px] tracking-wide uppercase">
          Team payroll against the salary cap
        </p>
        <p className="font-mono text-sm">
          {formatPercent(payrollVsCap)} <span className="text-muted text-xs">of cap</span>
        </p>
      </div>
      <div className="bg-surface border-border relative h-9 overflow-hidden rounded border">
        <div className="absolute inset-0 flex">
          {segments.map((row, index) => (
            <div
              key={rowKey(row)}
              title={`${repairPlayerName(row.player_name)} · ${formatPercent(row.cap_share)} of cap`}
              className={cn(
                'h-full',
                row.player_id === selectedPlayerId && 'ring-foreground/60 ring-2 ring-inset',
              )}
              style={{
                width: `${((row.cap_share ?? 0) / domain) * 100}%`,
                backgroundColor: segmentColor(index),
              }}
            />
          ))}
        </div>
        <div
          className="border-foreground/70 absolute inset-y-0 border-l-2 border-dashed"
          style={{ left: `${capPercent}%` }}
        >
          <span className="bg-background/85 text-foreground absolute top-0.5 left-1 rounded px-1 font-mono text-[10px] whitespace-nowrap">
            100% cap
          </span>
        </div>
      </div>
      <p className="text-muted mt-2 text-xs leading-5">
        Each block is one player&apos;s share of the league cap, stacked. Payroll is not limited to
        the cap, so the bar can extend past the marker. Luxury-tax and apron thresholds are not part
        of this dataset, so they are not drawn.
      </p>
    </div>
  );
}

export function rowKey(row: PlayerSalaryRow) {
  return `${row.player_id}-${row.season}-${row.team}`;
}

export function inspectorRows(row: PlayerSalaryRow) {
  const rows = [
    { label: 'Salary', value: formatSalaryExact(row.salary) },
    { label: 'Cap share', value: formatPercent(row.cap_share) },
    { label: 'Salary cap', value: formatSalaryExact(row.salary_cap) },
  ];

  if (row.team_payroll_share !== null) {
    rows.push({ label: 'Team payroll share', value: formatPercent(row.team_payroll_share) });
  }

  return rows;
}

function barDescription(row: PlayerSalaryRow, measure: SalaryMeasure) {
  const parts = [
    repairPlayerName(row.player_name),
    `${teamName(row.team)} ${row.season}`,
    `salary ${formatSalaryExact(row.salary)}`,
    `cap share ${formatPercent(row.cap_share)}`,
  ];

  if (row.team_payroll_share !== null) {
    parts.push(`team payroll share ${formatPercent(row.team_payroll_share)}`);
  }
  parts.push(qualityLabel(row.salary_quality));
  parts.push(`Sorted by ${measure === 'cap' ? 'cap share' : 'salary'}. Select for career history.`);

  return parts.join(', ');
}

function compactAxisDollars(value: number) {
  if (value >= 1_000_000) return `$${Math.round(value / 1_000_000)}M`;
  if (value >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return `$${value}`;
}

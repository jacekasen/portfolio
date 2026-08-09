'use client';

import { useState } from 'react';
import type { PlayerSalaryRow } from '@/lib/nba/salaries';
import {
  formatPercent,
  formatSalary,
  formatSalaryExact,
  qualityLabel,
  repairPlayerName,
  type PayrollComposition,
} from '@/lib/nba/salary-format';
import { cn } from '@/lib/utils';
import { EmptyState, InspectorCard, segmentColor } from './chart-ui';
import { inspectorRows, rowKey } from './SalaryBars';

const SIZE = 220;
const CENTER = SIZE / 2;
const OUTER = 100;
const INNER = 62;

type SalaryDonutProps = {
  composition: PayrollComposition;
  payrollVsCap: number | null;
  selectedPlayerId: string | null;
  onSelect: (row: PlayerSalaryRow) => void;
};

/**
 * Team payroll composition. Segments are shares of the team's known payroll — cap share
 * is measured against the league cap and would not sum to a whole.
 */
export function SalaryDonut({
  composition,
  payrollVsCap,
  selectedPlayerId,
  onSelect,
}: SalaryDonutProps) {
  const [activeKey, setActiveKey] = useState<string | null>(null);

  if (!composition.available) {
    return (
      <EmptyState title="Payroll composition is not available for this team-season">
        {composition.reason === 'no-records'
          ? 'No salary records with a usable amount exist here, so there is no payroll to divide.'
          : `Only ${composition.knownCount} ${composition.knownCount === 1 ? 'salary is' : 'salaries are'} recorded for this roster. The salary pipeline requires at least ${composition.required} before treating a team payroll as a complete enough whole, so this view stays disabled rather than implying the roster is fully covered. The bar view still shows every recorded contract.`}
      </EmptyState>
    );
  }

  const { segments, payroll } = composition;
  const active = segments.find((segment) => rowKey(segment.row) === activeKey) ?? null;

  const arcs = segments.map((segment, index) => {
    const start = segments
      .slice(0, index)
      .reduce((total, previous) => total + (previous.share / 100) * 360, 0);
    return {
      segment,
      index,
      path: annularSector(start, start + (segment.share / 100) * 360),
    };
  });

  return (
    <div className="relative grid gap-6 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] md:items-start">
      <div className="mx-auto w-full max-w-[15rem]">
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="h-auto w-full"
          role="img"
          aria-label={`Team payroll composition across ${segments.length} recorded salaries totalling ${formatSalaryExact(payroll)}. The list beside the chart gives every player's share.`}
        >
          {arcs.map(({ segment, index, path }) => {
            const key = rowKey(segment.row);
            const isActive = key === activeKey;
            const isSelected = segment.row.player_id === selectedPlayerId;

            return (
              <path
                key={key}
                d={path}
                aria-hidden="true"
                fill={segmentColor(index)}
                stroke="var(--background)"
                strokeWidth={isActive || isSelected ? 3 : 1}
                opacity={activeKey && !isActive ? 0.55 : 1}
                onPointerEnter={() => setActiveKey(key)}
                onPointerLeave={() => setActiveKey((current) => (current === key ? null : current))}
                onClick={() => onSelect(segment.row)}
                className="cursor-pointer"
              />
            );
          })}
          <text
            x={CENTER}
            y={CENTER - 6}
            textAnchor="middle"
            className="fill-foreground font-mono text-[15px]"
          >
            {formatSalary(payroll)}
          </text>
          <text
            x={CENTER}
            y={CENTER + 14}
            textAnchor="middle"
            className="fill-muted font-mono text-[11px]"
          >
            {payrollVsCap === null ? 'known payroll' : `${formatPercent(payrollVsCap)} of cap`}
          </text>
        </svg>
      </div>

      <div>
        <p className="text-muted mb-2 font-mono text-[11px] tracking-wide uppercase">
          Share of known team payroll
        </p>
        <ul className="max-h-[22rem] space-y-0.5 overflow-y-auto pr-1">
          {segments.map((segment, index) => {
            const key = rowKey(segment.row);
            const isSelected = segment.row.player_id === selectedPlayerId;

            return (
              <li key={key}>
                <button
                  type="button"
                  onClick={() => onSelect(segment.row)}
                  onPointerEnter={() => setActiveKey(key)}
                  onPointerLeave={() =>
                    setActiveKey((current) => (current === key ? null : current))
                  }
                  onFocus={() => setActiveKey(key)}
                  onBlur={() => setActiveKey((current) => (current === key ? null : current))}
                  aria-label={`${repairPlayerName(segment.row.player_name)}, salary ${formatSalaryExact(segment.row.salary)}, cap share ${formatPercent(segment.row.cap_share)}, team payroll share ${formatPercent(segment.share)}. ${qualityLabel(segment.row.salary_quality)}. Select for career history.`}
                  className={cn(
                    'focus-visible:ring-accent flex w-full items-center gap-3 rounded px-2 py-1.5 text-left focus-visible:ring-2 focus-visible:outline-none',
                    'hover:bg-accent-light/10',
                    isSelected && 'bg-accent-light/15',
                  )}
                >
                  <span
                    aria-hidden="true"
                    className="h-3 w-3 shrink-0 rounded-sm"
                    style={{ backgroundColor: segmentColor(index) }}
                  />
                  <span
                    className={cn('flex-1 truncate text-sm', isSelected && 'text-accent font-bold')}
                  >
                    {repairPlayerName(segment.row.player_name)}
                  </span>
                  <span className="text-muted font-mono text-xs">
                    {formatPercent(segment.row.cap_share)}
                  </span>
                  <span className="w-14 text-right font-mono text-xs">
                    {formatPercent(segment.share)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <p className="text-muted mt-2 text-[11px] leading-4">
          Grey column: share of the league salary cap. Right column: share of this team&apos;s known
          payroll.
        </p>
      </div>

      {active ? (
        <InspectorCard
          className="top-0 right-0"
          title={repairPlayerName(active.row.player_name)}
          rows={[
            ...inspectorRows(active.row),
            { label: 'Share of payroll', value: formatPercent(active.share) },
          ]}
          note={qualityLabel(active.row.salary_quality)}
        />
      ) : null}
    </div>
  );
}

/** Annular sector path between two angles, measured clockwise from 12 o'clock. */
function annularSector(startAngle: number, endAngle: number) {
  const sweep = Math.min(endAngle - startAngle, 359.999);
  const end = startAngle + sweep;
  const largeArc = sweep > 180 ? 1 : 0;

  const outerStart = pointOnCircle(OUTER, startAngle);
  const outerEnd = pointOnCircle(OUTER, end);
  const innerEnd = pointOnCircle(INNER, end);
  const innerStart = pointOnCircle(INNER, startAngle);

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${OUTER} ${OUTER} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${INNER} ${INNER} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
    'Z',
  ].join(' ');
}

function pointOnCircle(radius: number, angle: number) {
  const radians = ((angle - 90) * Math.PI) / 180;
  return {
    x: Number((CENTER + radius * Math.cos(radians)).toFixed(3)),
    y: Number((CENTER + radius * Math.sin(radians)).toFixed(3)),
  };
}

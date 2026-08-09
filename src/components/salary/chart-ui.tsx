'use client';

import { cn } from '@/lib/utils';

/** Shared building blocks for the salary explorer charts. */

export function StatCard({
  label,
  value,
  detail,
  muted,
}: {
  label: string;
  value: string;
  detail?: string;
  muted?: boolean;
}) {
  return (
    <article className="border-border bg-surface rounded border p-4">
      <p className="text-muted font-mono text-[11px] tracking-wide uppercase">{label}</p>
      <p className={cn('mt-2 font-mono text-2xl', muted && 'text-muted')}>{value}</p>
      {detail ? <p className="text-muted mt-1 text-xs">{detail}</p> : null}
    </article>
  );
}

export function ToggleGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="border-border bg-surface inline-flex w-fit rounded-lg border p-1"
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'rounded-md px-3 py-2 font-mono text-xs transition-colors',
            value === option.value
              ? 'bg-accent text-background'
              : 'text-muted hover:text-foreground hover:bg-accent-light/15',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Hover/focus detail card. Anchored inside its container and width-clamped, so it can
 * never push past the viewport on a narrow screen.
 */
export function InspectorCard({
  title,
  rows,
  note,
  anchorPercent,
  className,
}: {
  title: string;
  rows: { label: string; value: string }[];
  note?: string;
  anchorPercent?: number;
  className?: string;
}) {
  const anchor =
    anchorPercent === undefined ? undefined : Math.max(0, Math.min(100, anchorPercent));

  return (
    <div
      role="tooltip"
      style={
        anchor === undefined
          ? undefined
          : {
              left: `clamp(0px, calc(${anchor}% - 3rem), calc(100% - min(17rem, 100%)))`,
            }
      }
      className={cn(
        'border-border bg-surface pointer-events-none absolute z-20 w-[min(17rem,100%)] rounded-lg border p-3 shadow-sm',
        className,
      )}
    >
      <p className="font-mono text-sm font-bold">{title}</p>
      <dl className="mt-2 space-y-1">
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between gap-3 text-xs">
            <dt className="text-muted">{row.label}</dt>
            <dd className="font-mono">{row.value}</dd>
          </div>
        ))}
      </dl>
      {note ? <p className="text-muted mt-2 text-[11px] leading-4">{note}</p> : null}
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-border bg-surface/60 rounded-lg border border-dashed p-6 text-center">
      <p className="font-mono text-sm">{title}</p>
      <p className="text-muted mx-auto mt-2 max-w-md text-sm leading-6">{children}</p>
    </div>
  );
}

/** Evenly spaced axis ticks ending at or just past `max`. */
export function niceTicks(max: number, count = 4): number[] {
  if (!Number.isFinite(max) || max <= 0) return [0];

  const rawStep = max / count;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const step = [1, 2, 2.5, 5, 10]
    .map((factor) => factor * magnitude)
    .find((candidate) => candidate >= rawStep)!;

  const ticks: number[] = [];
  for (let tick = 0; tick <= max + step / 2; tick += step) {
    ticks.push(Number(tick.toFixed(6)));
  }
  return ticks;
}

/** Upper bound of a bar chart domain: a round number at or above the largest value. */
export function chartDomain(max: number) {
  if (!Number.isFinite(max) || max <= 0) return 1;
  const ticks = niceTicks(max);
  return Math.max(ticks[ticks.length - 1], max);
}

/**
 * Pastel categorical palette, warm enough to sit with the site's earthy theme.
 * Rank order is stable across the bars, payroll strip, and donut, so the same player
 * keeps the same colour when the view changes.
 */
const PALETTE = [
  '#c07a52',
  '#6f9bc4',
  '#7cb391',
  '#d2a65a',
  '#a48ac4',
  '#d98b83',
  '#5fa8a2',
  '#c67fa4',
  '#9cb069',
  '#8a97d0',
  '#d9a06b',
  '#79b7c9',
  '#bf8fb5',
  '#8fb87f',
];

/** Colour for the segment at `index` in a ranked series. */
export function segmentColor(index: number) {
  return PALETTE[((index % PALETTE.length) + PALETTE.length) % PALETTE.length];
}

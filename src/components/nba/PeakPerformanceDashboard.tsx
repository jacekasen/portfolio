'use client';

import { useMemo, useState } from 'react';
import type { PeakMetricKey, PeakPerformanceData } from '@/lib/nba/peak-performance';

type MetricKey = PeakMetricKey;

const METRICS: Record<
  MetricKey,
  { label: string; shortLabel: string; color: string; digits: number }
> = {
  bpm: {
    label: 'Box Plus/Minus',
    shortLabel: 'BPM',
    color: '#7a4f28',
    digits: 1,
  },
  per: {
    label: 'Player Efficiency Rating',
    shortLabel: 'PER',
    color: '#2563a8',
    digits: 1,
  },
  ws: {
    label: 'Win Shares',
    shortLabel: 'WS',
    color: '#297a51',
    digits: 1,
  },
  vorp: {
    label: 'Value Over Replacement Player',
    shortLabel: 'VORP',
    color: '#c05a3a',
    digits: 1,
  },
  ws_per_48: {
    label: 'Win Shares per 48 Minutes',
    shortLabel: 'WS/48',
    color: '#8b4a8f',
    digits: 3,
  },
};

const METRIC_ORDER: MetricKey[] = ['bpm', 'vorp', 'ws_per_48', 'ws', 'per'];
const CHART_WIDTH = 900;
const CHART_HEIGHT = 430;
const PADDING = { top: 28, right: 28, bottom: 78, left: 66 };

export function PeakPerformanceDashboard({ data }: { data: PeakPerformanceData }) {
  const [metric, setMetric] = useState<MetricKey>('bpm');
  const details = METRICS[metric];
  const summary = data.summaries[metric];
  const robustness = data.robustness[metric];
  const sensitivity = data.sensitivity[metric];

  return (
    <div className="space-y-12">
      <section aria-labelledby="metric-explorer-title">
        <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h2 id="metric-explorer-title" className="text-2xl font-bold">
              Explore the evidence
            </h2>
            <p className="text-muted mt-1 text-sm">
              Change the metric to update every graph on this page.
            </p>
          </div>
          <div className="border-border bg-surface inline-flex w-fit flex-wrap rounded-lg border p-1">
            {METRIC_ORDER.map((key) => (
              <button
                key={key}
                type="button"
                aria-pressed={metric === key}
                onClick={() => setMetric(key)}
                className={`rounded-md px-3 py-2 font-mono text-xs transition-colors ${
                  metric === key
                    ? 'bg-accent text-background'
                    : 'text-muted hover:text-foreground hover:bg-accent-light/15'
                }`}
              >
                {METRICS[key].shortLabel}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Median smoothed peak" value={`Age ${formatAge(summary.median)}`} />
          <StatCard
            label="Middle 50%"
            value={`${formatAge(summary.q1)}–${formatAge(summary.q3)}`}
          />
          <StatCard label="Players" value={summary.count.toLocaleString()} />
          <StatCard label="Raw ↔ smoothed" value={`${robustness.correlation.toFixed(3)} r`} />
        </div>
      </section>

      <ChartSection
        eyebrow="01 · Shape"
        title={`${details.shortLabel} performance by age`}
        description="Average qualifying-season performance with a 95% confidence interval. Hover an age to inspect its estimate and sample size."
      >
        <AgingCurveChart metric={metric} data={data} />
      </ChartSection>

      <div className="grid gap-12">
        <ChartSection
          eyebrow="02 · Distribution"
          title="When individual players peak"
          description="Each player’s peak is the strongest centered three-season average, reducing the effect of one unusually strong season."
        >
          <PeakAgeHistogram metric={metric} data={data} />
        </ChartSection>

        <ChartSection
          eyebrow="03 · Robustness"
          title="Raw versus smoothed peak age"
          description="Bubbles group players with the same raw and smoothed peak ages; larger bubbles represent more players. Hover a bubble for the count and examples."
        >
          <RawVsSmoothedScatter metric={metric} data={data} />
        </ChartSection>
      </div>

      <section className="border-border bg-surface/60 rounded-lg border p-5 md:p-7">
        <div className="grid gap-7 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="text-accent mb-2 font-mono text-xs tracking-[0.14em] uppercase">
              What survives scrutiny
            </p>
            <h2 className="mb-3 text-2xl font-bold">Your prime years are broad</h2>
            <p className="text-muted leading-7">
              Across {summary.count.toLocaleString()} qualifying modern-era careers, the median
              observed {details.shortLabel} peak is age {formatAge(summary.median)}, while the
              middle half of players peak between {formatAge(summary.q1)} and{' '}
              {formatAge(summary.q3)}. Under a stricter {data.meta.strictGames}-game and{' '}
              {data.meta.strictMinutes.toLocaleString()}-minute threshold, the median remains age{' '}
              {formatAge(sensitivity.strictMedian)} across{' '}
              {sensitivity.strictCount.toLocaleString()} players.
            </p>
          </div>
          <div className="border-border border-t pt-5 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-7">
            <h3 className="mb-3 text-sm font-bold uppercase">Interpretation limits</h3>
            <ul className="text-muted space-y-2 text-sm leading-6">
              <li>• Curves describe observed seasons, not a causal effect of aging.</li>
              <li>• Active players may reach a higher peak in a future season.</li>
              <li>
                • Late-career estimates reflect the smaller group of players who remain in the NBA.
              </li>
              <li>• Total Win Shares also reflects games and minutes, unlike rate metrics.</li>
              <li>• The analysis excludes incomplete decade and talent-tier comparisons.</li>
            </ul>
          </div>
        </div>
      </section>

      <section aria-labelledby="metric-comparison-title">
        <div className="mb-5">
          <p className="text-accent mb-2 font-mono text-xs tracking-[0.14em] uppercase">
            04 · Comparison
          </p>
          <h2 id="metric-comparison-title" className="text-2xl font-bold">
            Peak estimates across metrics
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {METRIC_ORDER.map((key) => {
            const metricSummary = data.summaries[key];
            const selected = key === metric;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setMetric(key)}
                className={`rounded-lg border p-4 text-left transition-colors ${
                  selected
                    ? 'border-accent bg-accent-light/15'
                    : 'border-border hover:border-accent-light bg-background'
                }`}
              >
                <span className="text-muted font-mono text-xs">{METRICS[key].shortLabel}</span>
                <span className="mt-2 block text-2xl font-bold">
                  Age {formatAge(metricSummary.median)}
                </span>
                <span className="text-muted mt-1 block text-xs">
                  IQR {formatAge(metricSummary.q1)}–{formatAge(metricSummary.q3)}
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function ChartSection({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="min-w-0">
      <div className="mb-5">
        <p className="text-accent mb-2 font-mono text-xs tracking-[0.14em] uppercase">{eyebrow}</p>
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="text-muted mt-2 max-w-3xl text-sm leading-6">{description}</p>
      </div>
      <div className="border-border bg-background rounded-lg border p-2 md:p-4">{children}</div>
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-border bg-surface rounded-lg border p-4">
      <p className="text-muted font-mono text-xs">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}

function AgingCurveChart({ metric, data }: { metric: MetricKey; data: PeakPerformanceData }) {
  const [showAllAges, setShowAllAges] = useState(false);
  const [hoveredAge, setHoveredAge] = useState<number | null>(null);
  const details = METRICS[metric];
  const allPoints = data.curves[metric];
  const points = showAllAges
    ? allPoints
    : allPoints.filter((point) => point.age >= 20 && point.age <= 35);

  const yValues = points.flatMap((point) => [point.lower, point.upper]);
  const yPadding = (Math.max(...yValues) - Math.min(...yValues)) * 0.12 || 1;
  const yMin = Math.min(...yValues) - yPadding;
  const yMax = Math.max(...yValues) + yPadding;
  const xMin = points[0].age;
  const xMax = points[points.length - 1].age;
  const plotWidth = CHART_WIDTH - PADDING.left - PADDING.right;
  const plotHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;
  const curveHeight = plotHeight - 46;
  const xFor = (age: number) =>
    PADDING.left + ((age - xMin) / Math.max(xMax - xMin, 1)) * plotWidth;
  const yFor = (value: number) =>
    PADDING.top + ((yMax - value) / Math.max(yMax - yMin, Number.EPSILON)) * curveHeight;
  const maxCount = Math.max(...points.map((point) => point.count));
  const highestMean = points.reduce((best, point) => (point.mean > best.mean ? point : best));
  const activeAge = hoveredAge ?? highestMean.age;
  const activePoint = points.find((point) => point.age === activeAge) ?? highestMean;
  const showTooltip = hoveredAge !== null;
  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${xFor(point.age)} ${yFor(point.mean)}`)
    .join(' ');
  const bandPath = [
    ...points.map(
      (point, index) => `${index === 0 ? 'M' : 'L'} ${xFor(point.age)} ${yFor(point.upper)}`,
    ),
    ...[...points].reverse().map((point) => `L ${xFor(point.age)} ${yFor(point.lower)}`),
    'Z',
  ].join(' ');
  const yTicks = Array.from({ length: 5 }, (_, index) => yMin + (index / 4) * (yMax - yMin));

  return (
    <div>
      <div className="mb-2 flex justify-end">
        <button
          type="button"
          onClick={() => {
            setShowAllAges((value) => !value);
            setHoveredAge(null);
          }}
          className="text-accent font-mono text-xs hover:underline"
        >
          {showAllAges ? 'focus on ages 20–35' : 'show all observed ages'}
        </button>
      </div>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          className="h-auto min-w-[640px] touch-none md:w-full"
          role="img"
          aria-label={`${details.label} average by age. The highest observed mean in the displayed range is age ${highestMean.age}.`}
          onPointerLeave={() => setHoveredAge(null)}
          onPointerMove={(event) => {
            const bounds = event.currentTarget.getBoundingClientRect();
            const pointerX = ((event.clientX - bounds.left) / bounds.width) * CHART_WIDTH;
            const age = Math.round(xMin + ((pointerX - PADDING.left) / plotWidth) * (xMax - xMin));
            if (age >= xMin && age <= xMax) setHoveredAge(age);
          }}
        >
          {yTicks.map((tick) => (
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
                {tick.toFixed(details.digits)}
              </text>
            </g>
          ))}

          <path d={bandPath} fill={details.color} opacity="0.13" />
          <path d={linePath} fill="none" stroke={details.color} strokeWidth="3" />

          {points.map((point) => (
            <circle
              key={point.age}
              cx={xFor(point.age)}
              cy={yFor(point.mean)}
              r={point.age === hoveredAge ? 6 : 3}
              fill={point.age === hoveredAge ? details.color : 'var(--background)'}
              stroke={details.color}
              strokeWidth="2"
            />
          ))}

          <text
            x={PADDING.left}
            y={PADDING.top + curveHeight + 24}
            className="fill-muted font-mono text-[10px]"
          >
            sample size by age
          </text>
          {points.map((point) => {
            const barHeight = (point.count / maxCount) * 26;
            return (
              <rect
                key={`n-${point.age}`}
                x={xFor(point.age) - Math.max(plotWidth / points.length / 2 - 1, 2)}
                y={PADDING.top + curveHeight + 38 - barHeight}
                width={Math.max(plotWidth / points.length - 2, 3)}
                height={barHeight}
                fill={details.color}
                opacity={point.age === activePoint.age ? 0.8 : 0.22}
              />
            );
          })}

          {points
            .filter((point) => (point.age - xMin) % 2 === 0 || point.age === xMax)
            .map((point) => (
              <text
                key={`age-${point.age}`}
                x={xFor(point.age)}
                y={CHART_HEIGHT - 10}
                textAnchor="middle"
                className="fill-muted font-mono text-[11px]"
              >
                {point.age}
              </text>
            ))}

          {showTooltip && (
            <ChartTooltip
              x={xFor(activePoint.age)}
              y={yFor(activePoint.mean)}
              lines={[
                `Age ${activePoint.age}`,
                `${details.shortLabel}: ${activePoint.mean.toFixed(details.digits)}`,
                `95% CI: ${activePoint.lower.toFixed(details.digits)}–${activePoint.upper.toFixed(details.digits)}`,
                `n = ${activePoint.count.toLocaleString()} seasons`,
              ]}
              width={190}
              chartWidth={CHART_WIDTH}
            />
          )}
        </svg>
      </div>
      <p className="text-muted px-2 pb-1 text-xs">
        The shaded interval narrows where more qualifying player-seasons are observed. Hover an age
        for details; use the toggle to inspect the sparse late-career tail.
      </p>
    </div>
  );
}

function PeakAgeHistogram({ metric, data }: { metric: MetricKey; data: PeakPerformanceData }) {
  const [hoveredAge, setHoveredAge] = useState<number | null>(null);
  const [selectedAge, setSelectedAge] = useState<number | null>(null);
  const details = METRICS[metric];
  const summary = data.summaries[metric];
  const domainMin = 18;
  const domainMax = 42;
  const counts = useMemo(() => {
    const map = new Map<number, number>();
    data.players.forEach((player) => {
      const peak = player.peaks[metric];
      if (peak) map.set(peak[1], (map.get(peak[1]) ?? 0) + 1);
    });
    return Array.from({ length: domainMax - domainMin + 1 }, (_, index) => {
      const age = index + domainMin;
      return { age, count: map.get(age) ?? 0 };
    });
  }, [data.players, domainMax, domainMin, metric]);
  const width = 650;
  const height = 420;
  const padding = { top: 24, right: 20, bottom: 48, left: 54 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const maxCount = Math.max(...counts.map((item) => item.count));
  const barWidth = plotWidth / counts.length;
  const activeAge = hoveredAge ?? selectedAge;

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto min-w-[520px] md:w-full"
        role="img"
        aria-label={`${details.label} smoothed peak-age distribution. Median age ${formatAge(summary.median)}.`}
        onPointerLeave={() => setHoveredAge(null)}
      >
        {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
          const value = Math.round(maxCount * fraction);
          const y = padding.top + plotHeight - fraction * plotHeight;
          return (
            <g key={fraction}>
              <line
                x1={padding.left}
                x2={width - padding.right}
                y1={y}
                y2={y}
                className="stroke-border"
              />
              <text
                x={padding.left - 8}
                y={y + 4}
                textAnchor="end"
                className="fill-muted font-mono text-[10px]"
              >
                {value}
              </text>
            </g>
          );
        })}
        {counts.map((item, index) => {
          const barHeight = (item.count / maxCount) * plotHeight;
          return (
            <g key={item.age}>
              <rect
                x={padding.left + index * barWidth + 1}
                y={padding.top + plotHeight - barHeight}
                width={Math.max(barWidth - 2, 1)}
                height={barHeight}
                rx="2"
                fill={details.color}
                opacity={activeAge === null || activeAge === item.age ? 0.8 : 0.3}
                onPointerEnter={() => setHoveredAge(item.age)}
                onClick={() => setSelectedAge(item.age)}
                className="cursor-pointer"
              />
              {(item.age - domainMin) % 2 === 0 && (
                <text
                  x={padding.left + (index + 0.5) * barWidth}
                  y={height - 15}
                  textAnchor="middle"
                  className="fill-muted font-mono text-[10px]"
                >
                  {item.age}
                </text>
              )}
            </g>
          );
        })}
        <line
          x1={padding.left + (summary.median - domainMin + 0.5) * barWidth}
          x2={padding.left + (summary.median - domainMin + 0.5) * barWidth}
          y1={padding.top}
          y2={padding.top + plotHeight}
          stroke="var(--foreground)"
          strokeWidth="2"
          strokeDasharray="6 5"
        />
        <text
          x={padding.left + (summary.median - domainMin + 0.5) * barWidth + 7}
          y={padding.top + 13}
          className="fill-foreground font-mono text-[10px]"
        >
          median {formatAge(summary.median)}
        </text>
        {activeAge !== null && (
          <ChartTooltip
            x={padding.left + (activeAge - domainMin + 0.5) * barWidth}
            y={
              padding.top +
              plotHeight -
              ((counts[activeAge - domainMin]?.count ?? 0) / maxCount) * plotHeight
            }
            lines={[
              `Age ${activeAge}`,
              `${counts[activeAge - domainMin]?.count ?? 0} players`,
              `${(((counts[activeAge - domainMin]?.count ?? 0) / summary.count) * 100).toFixed(1)}% of sample`,
            ]}
            width={150}
            chartWidth={width}
          />
        )}
      </svg>
    </div>
  );
}

function RawVsSmoothedScatter({ metric, data }: { metric: MetricKey; data: PeakPerformanceData }) {
  const [hoveredPair, setHoveredPair] = useState<string | null>(null);
  const details = METRICS[metric];
  const robustness = data.robustness[metric];
  const bubbles = useMemo(() => {
    const grouped = new Map<
      string,
      { key: string; raw: number; smooth: number; names: string[] }
    >();

    data.players.forEach((player) => {
      const peak = player.peaks[metric];
      if (!peak) return;

      const key = `${peak[0]}-${peak[1]}`;
      const bubble = grouped.get(key) ?? {
        key,
        raw: peak[0],
        smooth: peak[1],
        names: [],
      };
      bubble.names.push(player.name);
      grouped.set(key, bubble);
    });

    return Array.from(grouped.values()).sort((a, b) => b.names.length - a.names.length);
  }, [data.players, metric]);
  const width = 450;
  const height = 420;
  const padding = { top: 24, right: 24, bottom: 52, left: 54 };
  const plotSize = Math.min(
    width - padding.left - padding.right,
    height - padding.top - padding.bottom,
  );
  const domainMin = 18;
  const domainMax = 42;
  const xFor = (age: number) =>
    padding.left + ((age - domainMin) / (domainMax - domainMin)) * plotSize;
  const yFor = (age: number) =>
    padding.top + ((domainMax - age) / (domainMax - domainMin)) * plotSize;
  const maxBubbleCount = Math.max(...bubbles.map((bubble) => bubble.names.length));
  const activeBubble = hoveredPair ? bubbles.find((bubble) => bubble.key === hoveredPair) : null;

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-4 px-2 font-mono text-xs">
        <span>
          <span className="text-muted">correlation:</span> {robustness.correlation.toFixed(3)}
        </span>
        <span>
          <span className="text-muted">same exact age:</span> {robustness.samePercent.toFixed(1)}%
        </span>
        <span className="text-muted">bubble area = players</span>
      </div>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-auto min-w-[420px] md:w-full"
          role="img"
          aria-label={`${details.label} raw versus smoothed player peak ages grouped into bubbles sized by player count. Correlation ${robustness.correlation.toFixed(3)}.`}
          onPointerLeave={() => setHoveredPair(null)}
        >
          {[20, 25, 30, 35, 40].map((age) => (
            <g key={age}>
              <line
                x1={xFor(age)}
                x2={xFor(age)}
                y1={padding.top}
                y2={padding.top + plotSize}
                className="stroke-border"
              />
              <line
                x1={padding.left}
                x2={padding.left + plotSize}
                y1={yFor(age)}
                y2={yFor(age)}
                className="stroke-border"
              />
              <text
                x={xFor(age)}
                y={height - 18}
                textAnchor="middle"
                className="fill-muted font-mono text-[10px]"
              >
                {age}
              </text>
              <text
                x={padding.left - 9}
                y={yFor(age) + 4}
                textAnchor="end"
                className="fill-muted font-mono text-[10px]"
              >
                {age}
              </text>
            </g>
          ))}
          <line
            x1={xFor(domainMin)}
            y1={yFor(domainMin)}
            x2={xFor(domainMax)}
            y2={yFor(domainMax)}
            stroke="var(--muted)"
            strokeDasharray="6 5"
            strokeWidth="1.5"
          />
          {bubbles.map((bubble) => {
            const selected = hoveredPair === bubble.key;
            const radius = 3 + Math.sqrt(bubble.names.length / maxBubbleCount) * 8;

            return (
              <circle
                key={bubble.key}
                cx={xFor(bubble.raw)}
                cy={yFor(bubble.smooth)}
                r={selected ? radius + 2 : radius}
                fill={details.color}
                opacity={hoveredPair === null || selected ? 0.62 : 0.14}
                stroke={selected ? 'var(--foreground)' : 'var(--background)'}
                strokeWidth={selected ? 1.5 : 1}
                onPointerEnter={() => setHoveredPair(bubble.key)}
                className="cursor-crosshair"
              />
            );
          })}
          <text
            x={padding.left + plotSize / 2}
            y={height - 3}
            textAnchor="middle"
            className="fill-muted font-mono text-[10px]"
          >
            raw peak age
          </text>
          <text
            x="13"
            y={padding.top + plotSize / 2}
            textAnchor="middle"
            transform={`rotate(-90 13 ${padding.top + plotSize / 2})`}
            className="fill-muted font-mono text-[10px]"
          >
            smoothed peak age
          </text>
          {activeBubble && (
            <ChartTooltip
              x={xFor(activeBubble.raw)}
              y={yFor(activeBubble.smooth)}
              lines={[
                `${activeBubble.names.length} ${activeBubble.names.length === 1 ? 'player' : 'players'}`,
                `Raw ${activeBubble.raw} → smoothed ${activeBubble.smooth}`,
                ...activeBubble.names.slice(0, 3),
                ...(activeBubble.names.length > 3
                  ? [`+${activeBubble.names.length - 3} more`]
                  : []),
              ]}
              width={210}
              chartWidth={width}
            />
          )}
        </svg>
      </div>
    </div>
  );
}

function ChartTooltip({
  x,
  y,
  lines,
  width,
  chartWidth,
}: {
  x: number;
  y: number;
  lines: string[];
  width: number;
  chartWidth: number;
}) {
  const height = 14 + lines.length * 18;
  const tooltipX = x + width + 18 > chartWidth ? x - width - 12 : x + 12;
  const tooltipY = Math.max(8, y - height - 10);

  return (
    <g pointerEvents="none">
      <rect
        x={tooltipX}
        y={tooltipY}
        width={width}
        height={height}
        rx="6"
        fill="var(--surface)"
        stroke="var(--border)"
      />
      {lines.map((line, index) => (
        <text
          key={line}
          x={tooltipX + 10}
          y={tooltipY + 18 + index * 18}
          className={`${index === 0 ? 'fill-foreground font-semibold' : 'fill-muted'} font-mono text-[11px]`}
        >
          {line}
        </text>
      ))}
    </g>
  );
}

function formatAge(value: number) {
  return Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1);
}

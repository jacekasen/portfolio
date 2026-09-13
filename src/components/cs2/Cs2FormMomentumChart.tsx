'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { formExtremes, signedRating, yearSpans } from '@/lib/cs2/form-display';
import type { MomentumDataPoint } from '@/lib/cs2/trends';

type Cs2FormMomentumChartProps = {
  points: MomentumDataPoint[];
  careerAvg: number;
  windowSize: number;
  heightClassName?: string;
};

const PADDING = { top: 26, right: 24, bottom: 40, left: 55 };
const POSITIVE = '#22c55e';
const NEGATIVE = '#ef4444';
const POSITIVE_FILL = 'rgba(34, 197, 94, 0.22)';
const NEGATIVE_FILL = 'rgba(239, 68, 68, 0.22)';
const ACCENT = '#7a4f28';
const AXIS_TEXT = 'rgba(111, 98, 87, 0.9)';
const MIN_YEAR_LABEL_WIDTH = 36;

export function Cs2FormMomentumChart({
  points,
  careerAvg,
  windowSize,
  heightClassName = 'h-[340px] sm:h-[380px]',
}: Cs2FormMomentumChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Before the first full window the average covers fewer maps, which exaggerates early swings.
  const chartPoints = useMemo(
    () => (points.length > windowSize ? points.slice(windowSize - 1) : points),
    [points, windowSize],
  );
  const years = useMemo(() => yearSpans(chartPoints), [chartPoints]);
  const extremes = useMemo(() => formExtremes(chartPoints), [chartPoints]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || chartPoints.length === 0) return;

    const draw = () => {
      const context = canvas.getContext('2d');
      if (!context) return;

      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, width, height);

      const mono =
        getComputedStyle(document.documentElement)
          .getPropertyValue('--font-jetbrains-mono')
          .trim() || 'ui-monospace, monospace';
      const plotWidth = width - PADDING.left - PADDING.right;
      const plotHeight = height - PADDING.top - PADDING.bottom;
      const plotBottom = height - PADDING.bottom;
      const lastIndex = chartPoints.length - 1;
      const maxDelta = Math.max(0.25, ...chartPoints.map((point) => Math.abs(point.deltaVsCareer)));
      const yBound = Math.ceil(maxDelta * 10) / 10;

      const getX = (index: number) =>
        chartPoints.length <= 1
          ? PADDING.left + plotWidth / 2
          : PADDING.left + (index / lastIndex) * plotWidth;
      const getY = (delta: number) =>
        PADDING.top + plotHeight / 2 - (delta / yBound) * (plotHeight / 2);
      const yZero = getY(0);

      // Grid and y-axis labels
      context.strokeStyle = 'rgba(150, 150, 150, 0.12)';
      context.lineWidth = 1;
      context.fillStyle = AXIS_TEXT;
      context.font = `10px ${mono}`;
      context.textAlign = 'right';
      context.textBaseline = 'middle';
      for (const step of [-yBound, -yBound / 2, 0, yBound / 2, yBound]) {
        const y = getY(step);
        context.beginPath();
        context.moveTo(PADDING.left, y);
        context.lineTo(width - PADDING.right, y);
        context.stroke();
        context.fillText(signedRating(step), PADDING.left - 8, y);
      }

      // Year boundaries
      const showYears = years.length > 1;
      if (showYears) {
        context.save();
        context.strokeStyle = 'rgba(150, 150, 150, 0.35)';
        context.setLineDash([2, 4]);
        for (const { start } of years.slice(1)) {
          const x = getX(start);
          context.beginPath();
          context.moveTo(x, PADDING.top);
          context.lineTo(x, plotBottom);
          context.stroke();
        }
        context.restore();
      }

      // The latest point averages these maps, so shade them as "now"
      if (chartPoints.length > 1) {
        const bandLeft = getX(Math.max(0, chartPoints.length - windowSize));
        const bandRight = getX(lastIndex);
        context.fillStyle = 'rgba(122, 79, 40, 0.09)';
        context.fillRect(bandLeft, PADDING.top, Math.max(bandRight - bandLeft, 3), plotHeight);

        context.fillStyle = ACCENT;
        context.font = `600 10px ${mono}`;
        context.textAlign = 'right';
        context.textBaseline = 'middle';
        context.fillText(`LAST ${windowSize} MAPS`, bandRight, PADDING.top / 2);
      }

      // Fill above and below the career baseline, splitting segments where they cross it
      for (let i = 0; i < lastIndex; i++) {
        const d1 = chartPoints[i].deltaVsCareer;
        const d2 = chartPoints[i + 1].deltaVsCareer;
        const x1 = getX(i);
        const x2 = getX(i + 1);
        const y1 = getY(d1);
        const y2 = getY(d2);

        if ((d1 >= 0 && d2 >= 0) || (d1 <= 0 && d2 <= 0)) {
          context.beginPath();
          context.moveTo(x1, yZero);
          context.lineTo(x1, y1);
          context.lineTo(x2, y2);
          context.lineTo(x2, yZero);
          context.closePath();
          context.fillStyle = d1 >= 0 && d2 >= 0 ? POSITIVE_FILL : NEGATIVE_FILL;
          context.fill();
        } else {
          const xCross = x1 + (Math.abs(d1) / (Math.abs(d1) + Math.abs(d2))) * (x2 - x1);

          context.beginPath();
          context.moveTo(x1, yZero);
          context.lineTo(x1, y1);
          context.lineTo(xCross, yZero);
          context.closePath();
          context.fillStyle = d1 >= 0 ? POSITIVE_FILL : NEGATIVE_FILL;
          context.fill();

          context.beginPath();
          context.moveTo(xCross, yZero);
          context.lineTo(x2, y2);
          context.lineTo(x2, yZero);
          context.closePath();
          context.fillStyle = d2 >= 0 ? POSITIVE_FILL : NEGATIVE_FILL;
          context.fill();
        }
      }

      // Career baseline
      context.strokeStyle = 'rgba(122, 79, 40, 0.45)';
      context.lineWidth = 1.5;
      context.beginPath();
      context.moveTo(PADDING.left, yZero);
      context.lineTo(width - PADDING.right, yZero);
      context.stroke();

      // Momentum line
      context.save();
      context.lineWidth = 2.5;
      context.lineJoin = 'round';
      context.lineCap = 'round';
      for (let i = 0; i < lastIndex; i++) {
        const d1 = chartPoints[i].deltaVsCareer;
        const d2 = chartPoints[i + 1].deltaVsCareer;
        context.strokeStyle = (d1 + d2) / 2 >= 0 ? POSITIVE : NEGATIVE;
        context.beginPath();
        context.moveTo(getX(i), getY(d1));
        context.lineTo(getX(i + 1), getY(d2));
        context.stroke();
      }
      context.restore();

      // Peak, low, and latest markers
      const drawMarker = (index: number, filled: boolean) => {
        const delta = chartPoints[index].deltaVsCareer;
        context.beginPath();
        context.arc(getX(index), getY(delta), filled ? 5 : 4.5, 0, Math.PI * 2);
        context.fillStyle = filled ? (delta >= 0 ? POSITIVE : NEGATIVE) : '#ffffff';
        context.fill();
        context.strokeStyle = filled ? '#ffffff' : delta >= 0 ? POSITIVE : NEGATIVE;
        context.lineWidth = 2;
        context.stroke();
      };
      if (extremes) {
        drawMarker(extremes.peak, false);
        drawMarker(extremes.low, false);
      }
      drawMarker(lastIndex, true);

      // X-axis
      context.strokeStyle = 'rgba(150, 150, 150, 0.25)';
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(PADDING.left, plotBottom);
      context.lineTo(width - PADDING.right, plotBottom);
      context.stroke();

      context.fillStyle = AXIS_TEXT;
      context.font = `11px ${mono}`;
      context.textBaseline = 'alphabetic';
      const labelY = plotBottom + 18;

      if (showYears) {
        context.textAlign = 'center';
        for (const { year, start, end } of years) {
          const left = getX(start);
          const right = getX(end);
          if (right - left < MIN_YEAR_LABEL_WIDTH) continue;
          context.fillText(year, (left + right) / 2, labelY);
        }
      } else {
        const tickCount = Math.min(width < 500 ? 3 : 6, chartPoints.length);
        const tickIndices =
          tickCount <= 1
            ? [0]
            : Array.from(
                new Set(
                  Array.from({ length: tickCount }, (_, k) =>
                    Math.round((k * lastIndex) / (tickCount - 1)),
                  ),
                ),
              );

        tickIndices.forEach((index, position) => {
          context.textAlign =
            position === 0 ? 'left' : position === tickIndices.length - 1 ? 'right' : 'center';
          context.fillText(`Map ${chartPoints[index].mapIndex}`, getX(index), labelY);
        });
      }

      // Active point
      const active = activeIndex !== null ? chartPoints[activeIndex] : null;
      if (active && activeIndex !== null) {
        const x = getX(activeIndex);
        const y = getY(active.deltaVsCareer);

        context.save();
        context.setLineDash([3, 3]);
        context.strokeStyle = 'rgba(111, 98, 87, 0.45)';
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(x, PADDING.top);
        context.lineTo(x, plotBottom);
        context.stroke();
        context.restore();

        context.beginPath();
        context.arc(x, y, 5.5, 0, Math.PI * 2);
        context.fillStyle = active.deltaVsCareer >= 0 ? POSITIVE : NEGATIVE;
        context.fill();
        context.strokeStyle = '#ffffff';
        context.lineWidth = 2;
        context.stroke();
      }
    };

    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [activeIndex, chartPoints, extremes, windowSize, years]);

  const indexAtPointer = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || chartPoints.length === 0) return null;

    const x = event.clientX - canvas.getBoundingClientRect().left;
    const plotWidth = canvas.clientWidth - PADDING.left - PADDING.right;
    if (x < PADDING.left || x > canvas.clientWidth - PADDING.right) return null;

    const index = Math.round(((x - PADDING.left) / plotWidth) * (chartPoints.length - 1));
    return Math.max(0, Math.min(chartPoints.length - 1, index));
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLCanvasElement>) => {
    const lastIndex = chartPoints.length - 1;
    const step = event.shiftKey ? 10 : 1;

    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      const direction = event.key === 'ArrowRight' ? 1 : -1;
      setActiveIndex((current) =>
        current === null ? lastIndex : Math.max(0, Math.min(lastIndex, current + direction * step)),
      );
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      setActiveIndex(event.key === 'Home' ? 0 : lastIndex);
    } else if (event.key === 'Escape') {
      setActiveIndex(null);
    }
  };

  const toggleActive = (index: number) =>
    setActiveIndex((current) => (current === index ? null : index));

  const activePoint = activeIndex !== null ? chartPoints[activeIndex] : null;
  const firstPoint = chartPoints[0];
  const lastPoint = chartPoints.at(-1);

  return (
    <div className="space-y-3">
      <div
        className={`border-border bg-surface relative w-full rounded-lg border p-2 ${heightClassName}`}
      >
        <canvas
          ref={canvasRef}
          role="button"
          tabIndex={0}
          aria-label={
            firstPoint && lastPoint
              ? `Rolling ${windowSize}-map rating compared with the ${careerAvg.toFixed(2)} career average, from ${firstPoint.matchDate.slice(0, 7) || `map ${firstPoint.mapIndex}`} to ${lastPoint.matchDate.slice(0, 7) || `map ${lastPoint.mapIndex}`}. The latest value is ${signedRating(lastPoint.deltaVsCareer)}. Use the left and right arrow keys to inspect maps; hold Shift to move 10 at a time.`
              : `No ${windowSize}-map form history yet.`
          }
          onPointerDown={(event) => setActiveIndex(indexAtPointer(event))}
          onPointerMove={(event) => setActiveIndex(indexAtPointer(event))}
          onPointerLeave={(event) => {
            if (event.pointerType === 'mouse') setActiveIndex(null);
          }}
          onKeyDown={handleKeyDown}
          onBlur={() => setActiveIndex(null)}
          className="h-full w-full cursor-crosshair touch-pan-y"
        />

        {activePoint && (
          <div
            className={`border-border bg-surface text-foreground pointer-events-none absolute top-8 z-10 max-w-xs rounded-md border p-3.5 shadow-xl sm:max-w-sm ${
              activeIndex !== null && activeIndex > chartPoints.length / 2 ? 'left-16' : 'right-4'
            }`}
          >
            <div className="border-border flex items-center justify-between gap-2 border-b pb-1.5 font-mono text-xs">
              <span className="text-accent font-bold">
                Map {activePoint.mapIndex} · {activePoint.mapName}
              </span>
              {activePoint.matchDate && (
                <span className="text-muted">{activePoint.matchDate.slice(0, 10)}</span>
              )}
            </div>

            <p className="text-foreground mt-1 truncate text-xs font-semibold">
              {activePoint.tournament}
            </p>
            <p className="text-muted text-xs">vs {activePoint.opponent}</p>

            <dl className="border-border mt-2.5 grid grid-cols-2 gap-2 border-t pt-2 font-mono text-xs">
              <TooltipStat
                label="vs career"
                value={signedRating(activePoint.deltaVsCareer)}
                valueClassName={
                  activePoint.deltaVsCareer >= 0 ? 'text-emerald-800' : 'text-rose-800'
                }
              />
              <TooltipStat
                label={`${windowSize}-map average`}
                value={activePoint.rollingRating.toFixed(2)}
              />
              <TooltipStat label="Career average" value={careerAvg.toFixed(2)} />
              <TooltipStat label="This map" value={activePoint.rawRating.toFixed(2)} />
            </dl>
          </div>
        )}
      </div>

      <p className="sr-only" aria-live="polite">
        {activePoint
          ? `Map ${activePoint.mapIndex}, ${activePoint.mapName}: ${windowSize}-map average ${activePoint.rollingRating.toFixed(2)}, ${signedRating(activePoint.deltaVsCareer)} versus career.`
          : ''}
      </p>

      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 font-mono text-xs">
        {extremes && (
          <div className="flex flex-wrap items-center gap-2">
            <ExtremeButton
              label="Peak"
              point={chartPoints[extremes.peak]}
              isActive={activeIndex === extremes.peak}
              onSelect={() => toggleActive(extremes.peak)}
            />
            <ExtremeButton
              label="Low"
              point={chartPoints[extremes.low]}
              isActive={activeIndex === extremes.low}
              onSelect={() => toggleActive(extremes.low)}
            />
          </div>
        )}
        <span className="text-muted">Hover, tap, or use the arrow keys to inspect a map</span>
      </div>

      <p className="text-muted text-xs leading-5">
        Each point is the average of the previous {windowSize} maps minus the {careerAvg.toFixed(2)}{' '}
        career average: green above it, red below. The shaded strip is the last {windowSize} maps
        and dotted lines mark the start of each year.
      </p>
    </div>
  );
}

function ExtremeButton({
  label,
  point,
  isActive,
  onSelect,
}: {
  label: string;
  point: MomentumDataPoint;
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={isActive}
      onClick={onSelect}
      className={`bg-background inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1 transition-colors ${
        isActive ? 'border-accent' : 'border-border hover:border-accent'
      }`}
    >
      <span className="text-muted uppercase">{label}</span>
      <span
        className={`font-bold ${point.deltaVsCareer >= 0 ? 'text-emerald-800' : 'text-rose-800'}`}
      >
        {signedRating(point.deltaVsCareer)}
      </span>
      <span className="text-foreground truncate">{point.tournament}</span>
      {point.matchDate && <span className="text-muted">{point.matchDate.slice(0, 7)}</span>}
    </button>
  );
}

function TooltipStat({
  label,
  value,
  valueClassName = 'text-foreground',
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div>
      <dt className="text-muted text-[11px] uppercase">{label}</dt>
      <dd className={`text-sm font-bold ${valueClassName}`}>{value}</dd>
    </div>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';

export type MetricSeries = {
  name: string;
  points: {
    age: number;
    season: string;
    value: number;
  }[];
};

export type MetricProjection = {
  age: number;
  season: string;
  value: number;
};

type MetricChartProps = {
  metricLabel: string;
  valueDigits: number;
  referenceLine: {
    label: string;
    value: number;
  };
  scale: {
    max: number;
    min: number;
  };
  series: MetricSeries[];
  /** Projected next season for the first series, drawn as a dotted extension of its line. */
  projection?: MetricProjection;
  heightClassName?: string;
};

type SelectedPoint =
  | { kind: 'season'; playerIndex: number; pointIndex: number }
  | { kind: 'projection' };

type SelectablePoint = {
  selection: SelectedPoint;
  age: number;
  value: number;
};

const SERIES_COLORS = ['#7a4f28', '#2563a8', '#297a51', '#8b4a8f', '#b45309'];
const MIN_AGE = 18;
const MAX_AGE = 42;
const PLOT_PADDING = { top: 24, right: 20, bottom: 50, left: 58 };
const HIT_RADIUS = 14;

export function MetricChart({
  metricLabel,
  valueDigits,
  referenceLine,
  scale,
  series,
  projection,
  heightClassName = 'h-[320px] md:h-[400px]',
}: MetricChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedPoint, setSelectedPoint] = useState<SelectedPoint | null>(null);
  const shownProjection =
    projection && projection.age <= MAX_AGE && series[0]?.points.length ? projection : undefined;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const draw = () => {
      const context = canvas.getContext('2d');
      if (!context) return;

      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);

      const styles = getComputedStyle(document.documentElement);
      const background = styles.getPropertyValue('--background').trim() || '#fbf7f2';
      const surface = styles.getPropertyValue('--surface').trim() || '#f6efe7';
      const foreground = styles.getPropertyValue('--foreground').trim() || '#37281d';
      const muted = styles.getPropertyValue('--muted').trim() || '#6f6257';
      const border = styles.getPropertyValue('--border').trim() || '#e6ddd4';
      const mono =
        styles.getPropertyValue('--font-jetbrains-mono').trim() ||
        'ui-monospace, SFMono-Regular, monospace';

      context.fillStyle = background;
      context.fillRect(0, 0, width, height);

      const values = series.flatMap((player) => player.points.map((point) => point.value));
      if (values.length === 0) return;

      const yMin = scale.min;
      const yMax = scale.max;
      const { padding, plotHeight, xFor, yFor } = plotLayout(width, height, scale);

      context.font = `11px ${mono}`;
      context.textBaseline = 'middle';
      context.lineWidth = 1;

      for (let step = 0; step <= 4; step += 1) {
        const y = padding.top + (step / 4) * plotHeight;
        const value = yMax - (step / 4) * (yMax - yMin);
        context.strokeStyle = border;
        context.beginPath();
        context.moveTo(padding.left, y);
        context.lineTo(width - padding.right, y);
        context.stroke();

        context.fillStyle = muted;
        context.textAlign = 'right';
        context.fillText(formatAxisValue(value), padding.left - 9, y);
      }

      const ageStep = width < 500 ? 4 : 2;
      for (let age = MIN_AGE; age <= MAX_AGE; age += ageStep) {
        const x = xFor(age);
        context.fillStyle = muted;
        context.textAlign = 'center';
        context.fillText(String(age), x, height - 32);
      }

      context.fillStyle = foreground;
      context.font = `12px ${mono}`;
      context.fillText('Age', xFor((MIN_AGE + MAX_AGE) / 2), height - 12);

      if (referenceLine.value >= yMin && referenceLine.value <= yMax) {
        const referenceY = yFor(referenceLine.value);
        context.save();
        context.strokeStyle = SERIES_COLORS[0];
        context.lineWidth = 1.5;
        context.setLineDash([5, 5]);
        context.beginPath();
        context.moveTo(padding.left, referenceY);
        context.lineTo(width - padding.right, referenceY);
        context.stroke();
        context.setLineDash([]);

        context.font = `11px ${mono}`;
        context.textAlign = 'right';
        const labelWidth = context.measureText(referenceLine.label).width;
        context.fillStyle = background;
        context.fillRect(
          width - padding.right - labelWidth - 8,
          referenceY - 9,
          labelWidth + 8,
          18,
        );
        context.fillStyle = SERIES_COLORS[0];
        context.fillText(referenceLine.label, width - padding.right - 4, referenceY);
        context.restore();
      }

      // Drawn before the series so the last season's marker sits on top of the dotted segment.
      const lastPoint = series[0]?.points.at(-1);
      if (shownProjection && lastPoint) {
        const projectionX = xFor(shownProjection.age);
        const projectionY = yFor(shownProjection.value);
        context.save();
        context.strokeStyle = SERIES_COLORS[0];
        context.lineWidth = 3;
        context.lineCap = 'round';
        context.setLineDash([0.5, 6]);
        context.beginPath();
        context.moveTo(xFor(lastPoint.age), yFor(lastPoint.value));
        context.lineTo(projectionX, projectionY);
        context.stroke();
        context.setLineDash([]);

        context.lineWidth = 2;
        context.beginPath();
        context.arc(projectionX, projectionY, 5, 0, Math.PI * 2);
        context.fillStyle = background;
        context.fill();
        context.stroke();
        context.beginPath();
        context.arc(projectionX, projectionY, 2, 0, Math.PI * 2);
        context.fillStyle = SERIES_COLORS[0];
        context.fill();
        context.restore();
      }

      series.forEach((player, playerIndex) => {
        const color = SERIES_COLORS[playerIndex % SERIES_COLORS.length];
        context.strokeStyle = color;
        context.lineWidth = 2.5;
        context.lineJoin = 'round';
        context.lineCap = 'round';
        context.beginPath();

        player.points.forEach((point, pointIndex) => {
          const x = xFor(point.age);
          const y = yFor(point.value);
          if (pointIndex === 0) context.moveTo(x, y);
          else context.lineTo(x, y);
        });
        context.stroke();

        context.fillStyle = background;
        context.strokeStyle = color;
        context.lineWidth = 2;
        player.points.forEach((point) => {
          context.beginPath();
          context.arc(xFor(point.age), yFor(point.value), 3, 0, Math.PI * 2);
          context.fill();
          context.stroke();
        });
      });

      const selection = resolveSelection(selectedPoint, series, shownProjection);
      if (selection) {
        const { color, point } = selection;
        const pointX = xFor(point.age);
        const pointY = yFor(point.value);
        context.beginPath();
        context.arc(pointX, pointY, 7, 0, Math.PI * 2);
        context.fillStyle = background;
        context.fill();
        context.strokeStyle = color;
        context.lineWidth = 3;
        context.stroke();

        const tooltipLines = [
          selection.name,
          `${metricLabel}: ${point.value.toFixed(valueDigits)}${selection.projected ? ' (projected)' : ''}`,
          `Season: ${point.season}`,
          `Age: ${point.age}`,
        ];
        context.font = `12px ${mono}`;
        const tooltipPadding = 12;
        const tooltipWidth =
          Math.max(...tooltipLines.map((line) => context.measureText(line).width)) +
          tooltipPadding * 2;
        const tooltipHeight = 82;
        const tooltipGap = 12;
        let tooltipX = pointX + tooltipGap;
        let tooltipY = pointY - tooltipHeight - tooltipGap;

        if (tooltipX + tooltipWidth > width - padding.right) {
          tooltipX = pointX - tooltipWidth - tooltipGap;
        }
        if (tooltipY < padding.top) {
          tooltipY = pointY + tooltipGap;
        }
        tooltipY = Math.min(tooltipY, height - padding.bottom - tooltipHeight);

        context.fillStyle = surface;
        context.strokeStyle = border;
        context.lineWidth = 1;
        context.beginPath();
        context.roundRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, 6);
        context.fill();
        context.stroke();

        context.textAlign = 'left';
        context.textBaseline = 'top';
        tooltipLines.forEach((line, index) => {
          context.fillStyle = index === 0 ? foreground : index === 1 ? color : muted;
          context.font = `${index <= 1 ? '600 ' : ''}12px ${mono}`;
          context.fillText(line, tooltipX + tooltipPadding, tooltipY + 10 + index * 17);
        });
      }

      context.save();
      context.translate(15, padding.top + plotHeight / 2);
      context.rotate(-Math.PI / 2);
      context.fillStyle = foreground;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.font = `12px ${mono}`;
      context.fillText(metricLabel, 0, 0);
      context.restore();
    };

    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [metricLabel, referenceLine, scale, selectedPoint, series, shownProjection, valueDigits]);

  const selectablePoints: SelectablePoint[] = [
    ...series.flatMap((player, playerIndex) =>
      player.points.map((point, pointIndex) => ({
        selection: { kind: 'season' as const, playerIndex, pointIndex },
        age: point.age,
        value: point.value,
      })),
    ),
    ...(shownProjection
      ? [
          {
            selection: { kind: 'projection' as const },
            age: shownProjection.age,
            value: shownProjection.value,
          },
        ]
      : []),
  ];

  const selectPointAt = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const bounds = canvas.getBoundingClientRect();
    const x = clientX - bounds.left;
    const y = clientY - bounds.top;
    const { xFor, yFor } = plotLayout(bounds.width, bounds.height, scale);

    let nearest: SelectedPoint | null = null;
    let nearestDistance = HIT_RADIUS;
    for (const candidate of selectablePoints) {
      const distance = Math.hypot(x - xFor(candidate.age), y - yFor(candidate.value));
      if (distance <= nearestDistance) {
        nearest = candidate.selection;
        nearestDistance = distance;
      }
    }

    setSelectedPoint(nearest);
  };

  const selectAdjacentPoint = (direction: -1 | 1) => {
    if (selectablePoints.length === 0) return;

    const currentIndex = selectedPoint
      ? selectablePoints.findIndex(({ selection }) => isSameSelection(selection, selectedPoint))
      : direction === 1
        ? -1
        : 0;
    const nextIndex =
      (currentIndex + direction + selectablePoints.length) % selectablePoints.length;
    setSelectedPoint(selectablePoints[nextIndex].selection);
  };

  const announced = resolveSelection(selectedPoint, series, shownProjection);

  return (
    <div>
      {series.length > 1 && (
        <div className="mb-4 flex flex-wrap gap-x-5 gap-y-2 font-mono text-xs">
          {series.map((player, index) => (
            <span key={player.name} className="inline-flex items-center gap-2">
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: SERIES_COLORS[index % SERIES_COLORS.length] }}
              />
              {player.name}
            </span>
          ))}
        </div>
      )}
      <canvas
        ref={canvasRef}
        className={`${heightClassName} w-full cursor-crosshair`}
        role="button"
        tabIndex={0}
        aria-label={`${metricLabel} by player age from 18 to 42 for ${series.map((player) => player.name).join(', ')}. ${referenceLine.label} is marked with a dashed line.${shownProjection ? ` A dotted segment extends to the projected ${shownProjection.season} value of ${shownProjection.value.toFixed(valueDigits)}.` : ''} Click a data point, or use the left and right arrow keys, to inspect its exact value and season.`}
        onClick={(event) => selectPointAt(event.clientX, event.clientY)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            event.preventDefault();
            selectAdjacentPoint(event.key === 'ArrowRight' ? 1 : -1);
          }
        }}
      />
      <p className="sr-only" aria-live="polite">
        {announced
          ? `${announced.name}, ${metricLabel}${announced.projected ? ' projection' : ''}: ${announced.point.value.toFixed(valueDigits)}, season ${announced.point.season}, age ${announced.point.age}`
          : ''}
      </p>
    </div>
  );
}

export function plotLayout(width: number, height: number, scale: { min: number; max: number }) {
  const plotWidth = width - PLOT_PADDING.left - PLOT_PADDING.right;
  const plotHeight = height - PLOT_PADDING.top - PLOT_PADDING.bottom;
  const valueRange = scale.max - scale.min || 1;

  return {
    padding: PLOT_PADDING,
    plotHeight,
    xFor: (age: number) => PLOT_PADDING.left + ((age - MIN_AGE) / (MAX_AGE - MIN_AGE)) * plotWidth,
    yFor: (value: number) => PLOT_PADDING.top + ((scale.max - value) / valueRange) * plotHeight,
  };
}

function resolveSelection(
  selection: SelectedPoint | null,
  series: MetricSeries[],
  projection: MetricProjection | undefined,
) {
  if (!selection) return null;

  if (selection.kind === 'projection') {
    return projection && series[0]
      ? { name: series[0].name, point: projection, color: SERIES_COLORS[0], projected: true }
      : null;
  }

  const player = series[selection.playerIndex];
  const point = player?.points[selection.pointIndex];
  return point
    ? {
        name: player.name,
        point,
        color: SERIES_COLORS[selection.playerIndex % SERIES_COLORS.length],
        projected: false,
      }
    : null;
}

function isSameSelection(a: SelectedPoint, b: SelectedPoint) {
  if (a.kind === 'projection' || b.kind === 'projection') return a.kind === b.kind;
  return a.playerIndex === b.playerIndex && a.pointIndex === b.pointIndex;
}

function formatAxisValue(value: number) {
  const absolute = Math.abs(value);
  if (absolute >= 100) return value.toFixed(0);
  if (absolute >= 1) return value.toFixed(1);
  return value.toFixed(2);
}

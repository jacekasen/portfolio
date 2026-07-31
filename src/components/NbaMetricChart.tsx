'use client';

import { useEffect, useRef } from 'react';

export type MetricSeries = {
  name: string;
  points: {
    age: number;
    season: string;
    value: number;
  }[];
};

type NbaMetricChartProps = {
  metricLabel: string;
  referenceLine: {
    label: string;
    value: number;
  };
  scale: {
    max: number;
    min: number;
  };
  series: MetricSeries[];
};

const SERIES_COLORS = ['#7a4f28', '#2563a8', '#297a51', '#8b4a8f', '#b45309'];
const MIN_AGE = 18;
const MAX_AGE = 42;

export function NbaMetricChart({ metricLabel, referenceLine, scale, series }: NbaMetricChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
      const padding = { top: 24, right: 20, bottom: 50, left: 58 };
      const plotWidth = width - padding.left - padding.right;
      const plotHeight = height - padding.top - padding.bottom;
      const xFor = (age: number) =>
        padding.left + ((age - MIN_AGE) / (MAX_AGE - MIN_AGE)) * plotWidth;
      const yFor = (value: number) =>
        padding.top + ((yMax - value) / Math.max(yMax - yMin, 1)) * plotHeight;

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
        context.fillText(String(age), x, height - 22);
      }

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

      context.save();
      context.translate(15, padding.top + plotHeight / 2);
      context.rotate(-Math.PI / 2);
      context.fillStyle = foreground;
      context.textAlign = 'center';
      context.font = `12px ${mono}`;
      context.fillText(metricLabel, 0, 0);
      context.restore();
    };

    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [metricLabel, referenceLine, scale, series]);

  return (
    <div>
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
      <canvas
        ref={canvasRef}
        className="h-[320px] w-full md:h-[400px]"
        role="img"
        aria-label={`${metricLabel} by player age from 18 to 42 for ${series.map((player) => player.name).join(', ')}. ${referenceLine.label} is marked with a dashed line.`}
      />
    </div>
  );
}

function formatAxisValue(value: number) {
  const absolute = Math.abs(value);
  if (absolute >= 100) return value.toFixed(0);
  if (absolute >= 1) return value.toFixed(1);
  return value.toFixed(2);
}

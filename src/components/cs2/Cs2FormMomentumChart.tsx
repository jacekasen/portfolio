'use client';

import { useEffect, useRef, useState } from 'react';
import type { MomentumDataPoint } from '@/lib/cs2/trends';

type Cs2FormMomentumChartProps = {
  points: MomentumDataPoint[];
  careerAvg: number;
  windowSize: number;
};

export function Cs2FormMomentumChart({ points, careerAvg, windowSize }: Cs2FormMomentumChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || points.length === 0) return;

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

      const padding = { top: 30, right: 45, bottom: 40, left: 55 };
      const plotWidth = width - padding.left - padding.right;
      const plotHeight = height - padding.top - padding.bottom;

      // Delta bounds
      const maxDelta = Math.max(0.25, ...points.map((p) => Math.abs(p.deltaVsCareer)));
      const yBound = Math.ceil(maxDelta * 10) / 10;

      const getX = (index: number) => {
        if (points.length <= 1) return padding.left + plotWidth / 2;
        return padding.left + (index / (points.length - 1)) * plotWidth;
      };

      const getY = (delta: number) => {
        // Centerline delta = 0 is halfway
        return padding.top + plotHeight / 2 - (delta / yBound) * (plotHeight / 2);
      };

      const yZero = getY(0);

      // 1. Grid Lines
      context.strokeStyle = 'rgba(150, 150, 150, 0.12)';
      context.lineWidth = 1;
      context.fillStyle = 'rgba(150, 150, 150, 0.75)';
      context.font = '10px ui-monospace, monospace';
      context.textAlign = 'right';

      const steps = [-yBound, -yBound / 2, 0, yBound / 2, yBound];
      for (const step of steps) {
        const y = getY(step);
        context.beginPath();
        context.moveTo(padding.left, y);
        context.lineTo(width - padding.right, y);
        context.stroke();

        const label = step > 0 ? `+${step.toFixed(2)}` : step.toFixed(2);
        context.fillText(label, padding.left - 8, y + 3);
      }

      // 2. Green Positive Area & Red Negative Area Fill
      // Split points into segments above/below zero
      for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];
        const x1 = getX(i);
        const x2 = getX(i + 1);
        const y1 = getY(p1.deltaVsCareer);
        const y2 = getY(p2.deltaVsCareer);

        // Does the line cross zero between p1 and p2?
        const d1 = p1.deltaVsCareer;
        const d2 = p2.deltaVsCareer;

        if ((d1 >= 0 && d2 >= 0) || (d1 <= 0 && d2 <= 0)) {
          // Pure positive or pure negative segment
          const isPos = d1 >= 0 && d2 >= 0;
          context.beginPath();
          context.moveTo(x1, yZero);
          context.lineTo(x1, y1);
          context.lineTo(x2, y2);
          context.lineTo(x2, yZero);
          context.closePath();

          context.fillStyle = isPos ? 'rgba(34, 197, 94, 0.22)' : 'rgba(239, 68, 68, 0.22)';
          context.fill();
        } else {
          // Line crosses zero: compute intersection point
          const t = Math.abs(d1) / (Math.abs(d1) + Math.abs(d2));
          const xCross = x1 + t * (x2 - x1);

          // Sub-segment 1
          context.beginPath();
          context.moveTo(x1, yZero);
          context.lineTo(x1, y1);
          context.lineTo(xCross, yZero);
          context.closePath();
          context.fillStyle = d1 >= 0 ? 'rgba(34, 197, 94, 0.22)' : 'rgba(239, 68, 68, 0.22)';
          context.fill();

          // Sub-segment 2
          context.beginPath();
          context.moveTo(xCross, yZero);
          context.lineTo(x2, y2);
          context.lineTo(x2, yZero);
          context.closePath();
          context.fillStyle = d2 >= 0 ? 'rgba(34, 197, 94, 0.22)' : 'rgba(239, 68, 68, 0.22)';
          context.fill();
        }
      }

      // 3. Centerline Baseline (\Delta = 0)
      context.save();
      context.strokeStyle = 'rgba(122, 79, 40, 0.45)';
      context.lineWidth = 1.5;
      context.beginPath();
      context.moveTo(padding.left, yZero);
      context.lineTo(width - padding.right, yZero);
      context.stroke();

      context.fillStyle = '#7a4f28';
      context.font = 'bold 10px ui-monospace, monospace';
      context.textAlign = 'left';
      context.fillText(`CAREER BASELINE (${careerAvg.toFixed(2)})`, padding.left + 6, yZero - 6);
      context.restore();

      // 4. Momentum Delta Trendline
      context.save();
      context.lineWidth = 2.5;
      context.lineJoin = 'round';
      context.lineCap = 'round';

      for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];
        const x1 = getX(i);
        const x2 = getX(i + 1);
        const y1 = getY(p1.deltaVsCareer);
        const y2 = getY(p2.deltaVsCareer);

        const avgDelta = (p1.deltaVsCareer + p2.deltaVsCareer) / 2;
        context.strokeStyle = avgDelta >= 0 ? '#22c55e' : '#ef4444';

        context.beginPath();
        context.moveTo(x1, y1);
        context.lineTo(x2, y2);
        context.stroke();
      }
      context.restore();

      // 5. X-Axis Baseline and Evenly Distributed Labels
      context.strokeStyle = 'rgba(150, 150, 150, 0.25)';
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(padding.left, height - padding.bottom);
      context.lineTo(width - padding.right, height - padding.bottom);
      context.stroke();

      const kCount = Math.min(6, points.length);
      const tickIndices =
        kCount <= 1
          ? [0]
          : Array.from(
              new Set(
                Array.from({ length: kCount }, (_, k) =>
                  Math.round((k * (points.length - 1)) / (kCount - 1))
                )
              )
            ).sort((a, b) => a - b);

      context.fillStyle = 'rgba(150, 150, 150, 0.85)';
      context.font = '11px ui-monospace, monospace';

      for (let i = 0; i < tickIndices.length; i++) {
        const idx = tickIndices[i];
        const x = getX(idx);

        context.beginPath();
        context.moveTo(x, height - padding.bottom);
        context.lineTo(x, height - padding.bottom + 4);
        context.strokeStyle = 'rgba(150, 150, 150, 0.4)';
        context.stroke();

        if (i === 0) context.textAlign = 'left';
        else if (i === tickIndices.length - 1) context.textAlign = 'right';
        else context.textAlign = 'center';

        context.fillText(`Map ${idx + 1}`, x, height - padding.bottom + 18);
      }

      // 6. Hover Focus Line & Point
      if (hoverIndex !== null && points[hoverIndex]) {
        const p = points[hoverIndex];
        const hx = getX(hoverIndex);
        const hy = getY(p.deltaVsCareer);

        context.save();
        context.setLineDash([3, 3]);
        context.strokeStyle = 'rgba(111, 98, 87, 0.45)';
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(hx, padding.top);
        context.lineTo(hx, height - padding.bottom);
        context.stroke();
        context.restore();

        context.beginPath();
        context.arc(hx, hy, 5.5, 0, Math.PI * 2);
        context.fillStyle = p.deltaVsCareer >= 0 ? '#22c55e' : '#ef4444';
        context.fill();
        context.strokeStyle = '#ffffff';
        context.lineWidth = 2;
        context.stroke();
      }
    };

    draw();

    const handleResize = () => draw();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [points, careerAvg, hoverIndex]);

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || points.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const paddingLeft = 55;
    const paddingRight = 45;
    const plotWidth = canvas.clientWidth - paddingLeft - paddingRight;

    if (x < paddingLeft || x > canvas.clientWidth - paddingRight) {
      setHoverIndex(null);
      return;
    }

    const ratio = (x - paddingLeft) / plotWidth;
    const index = Math.round(ratio * (points.length - 1));
    const clamped = Math.max(0, Math.min(points.length - 1, index));
    setHoverIndex(clamped);
  };

  const handlePointerLeave = () => {
    setHoverIndex(null);
  };

  const activePoint = hoverIndex !== null ? points[hoverIndex] : null;

  return (
    <div ref={containerRef} className="space-y-3">
      <div className="border-border bg-surface relative h-[340px] w-full rounded-lg border p-2 sm:h-[380px]">
        <canvas
          ref={canvasRef}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          className="h-full w-full cursor-crosshair touch-none"
        />

        {activePoint && (
          <div
            className={`border-border bg-surface text-foreground pointer-events-none absolute top-4 z-10 max-w-xs rounded-md border p-3.5 shadow-xl backdrop-blur-sm sm:max-w-sm ${
              hoverIndex !== null && hoverIndex > points.length / 2 ? 'left-16' : 'right-4'
            }`}
          >
            <div className="flex items-center justify-between gap-2 border-b border-border pb-1.5 font-mono text-xs">
              <span className="text-accent font-bold">
                Map #{activePoint.mapIndex} · {activePoint.mapName}
              </span>
              <span className="text-muted text-[11px]">
                {activePoint.matchDate ? activePoint.matchDate.slice(0, 10) : 'Match'}
              </span>
            </div>

            <p className="mt-1 truncate text-xs font-semibold text-foreground">
              {activePoint.tournament}
            </p>
            <p className="text-muted text-xs">vs {activePoint.opponent}</p>

            <div className="mt-2.5 grid grid-cols-2 gap-2 border-t border-border pt-2 font-mono text-xs">
              <div>
                <span className="text-muted block text-[10px] uppercase">Form Delta</span>
                <span
                  className={`text-sm font-bold ${
                    activePoint.deltaVsCareer >= 0 ? 'text-emerald-800' : 'text-rose-800'
                  }`}
                >
                  {activePoint.deltaVsCareer >= 0
                    ? `+${activePoint.deltaVsCareer.toFixed(2)}`
                    : activePoint.deltaVsCareer.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-muted block text-[10px] uppercase">{windowSize}-Map Form</span>
                <span className="text-sm font-bold text-foreground">
                  {activePoint.rollingRating.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-muted block text-[10px] uppercase">Career Baseline</span>
                <span className="font-semibold text-foreground">{careerAvg.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-muted block text-[10px] uppercase">Map Rating</span>
                <span className="font-semibold text-foreground">{activePoint.rawRating.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="text-muted flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-5 rounded bg-emerald-100 border border-emerald-400" />
            <span className="text-emerald-800 font-semibold">In Form (Above Career Baseline)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-5 rounded bg-rose-100 border border-rose-400" />
            <span className="text-rose-800 font-semibold">Slump (Below Career Baseline)</span>
          </span>
        </div>
        <span className="text-[11px]">Hover over timeline to see form swings</span>
      </div>
    </div>
  );
}

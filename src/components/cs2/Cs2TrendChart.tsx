'use client';

import { useEffect, useRef, useState } from 'react';
import type { SmoothedMapPoint } from '@/lib/cs2/trends';

type Cs2TrendChartProps = {
  points: SmoothedMapPoint[];
  windowSize: number;
  playerNick: string;
};

export function Cs2TrendChart({ points, windowSize, playerNick }: Cs2TrendChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

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

      context.clearRect(0, 0, width, height);

      if (points.length === 0) {
        context.fillStyle = '#888888';
        context.font = '14px ui-monospace, monospace';
        context.textAlign = 'center';
        context.fillText('No map data available for selected filter', width / 2, height / 2);
        return;
      }

      const padding = { top: 30, right: 45, bottom: 40, left: 45 };
      const plotWidth = width - padding.left - padding.right;
      const plotHeight = height - padding.top - padding.bottom;

      // Rating domain calculation
      const minVal = Math.min(0.5, ...points.map((p) => p.rawRating));
      const maxVal = Math.max(2.0, ...points.map((p) => p.rawRating));
      const yMin = Math.max(0, Math.floor(minVal * 10) / 10);
      const yMax = Math.ceil(maxVal * 10) / 10;

      const getX = (index: number) => {
        if (points.length <= 1) return padding.left + plotWidth / 2;
        return padding.left + (index / (points.length - 1)) * plotWidth;
      };

      const getY = (val: number) => {
        return padding.top + plotHeight - ((val - yMin) / (yMax - yMin)) * plotHeight;
      };

      // 1. Grid lines and Y-axis labels
      context.strokeStyle = 'rgba(150, 150, 150, 0.15)';
      context.lineWidth = 1;
      context.fillStyle = 'rgba(150, 150, 150, 0.8)';
      context.font = '11px ui-monospace, monospace';
      context.textAlign = 'right';

      const yStep = 0.5;
      for (let v = yMin; v <= yMax + 0.001; v += yStep) {
        const y = getY(v);
        context.beginPath();
        context.moveTo(padding.left, y);
        context.lineTo(width - padding.right, y);
        context.stroke();

        context.fillText(v.toFixed(1), padding.left - 8, y + 4);
      }

      // 2. HLTV 1.00 Baseline Reference Line
      if (yMin <= 1.0 && yMax >= 1.0) {
        const y100 = getY(1.0);
        context.save();
        context.setLineDash([4, 4]);
        context.strokeStyle = 'rgba(234, 88, 12, 0.5)';
        context.lineWidth = 1.5;
        context.beginPath();
        context.moveTo(padding.left, y100);
        context.lineTo(width - padding.right, y100);
        context.stroke();

        context.fillStyle = 'rgba(234, 88, 12, 0.85)';
        context.textAlign = 'left';
        context.font = 'bold 10px ui-monospace, monospace';
        context.fillText('HLTV 1.00 AVG', padding.left + 6, y100 - 5);
        context.restore();
      }

      // 3. Raw Map Connecting Line (Faint)
      context.beginPath();
      context.strokeStyle = 'rgba(160, 160, 160, 0.18)';
      context.lineWidth = 1;
      points.forEach((p, idx) => {
        const x = getX(idx);
        const y = getY(p.rawRating);
        if (idx === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      });
      context.stroke();

      // 4. Raw Map Points (Scattered)
      points.forEach((p, idx) => {
        const x = getX(idx);
        const y = getY(p.rawRating);
        context.beginPath();
        context.arc(x, y, 2.5, 0, Math.PI * 2);
        context.fillStyle =
          p.rawRating >= 1.0 ? 'rgba(34, 197, 94, 0.35)' : 'rgba(239, 68, 68, 0.35)';
        context.fill();
      });

      // 5. Smoothed Moving Average Trendline (Bold)
      context.save();
      context.beginPath();
      context.strokeStyle = '#f59e0b'; // Amber / gold accent
      context.lineWidth = 2.75;
      context.lineJoin = 'round';
      context.lineCap = 'round';

      points.forEach((p, idx) => {
        const x = getX(idx);
        const y = getY(p.smoothedRating);
        if (idx === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      });
      context.stroke();
      context.restore();

      // 6. X-axis baseline and tick labels
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

        // Small tick mark extending down from axis
        context.beginPath();
        context.moveTo(x, height - padding.bottom);
        context.lineTo(x, height - padding.bottom + 4);
        context.strokeStyle = 'rgba(150, 150, 150, 0.4)';
        context.stroke();

        // Edge labels align flush to avoid clipping canvas borders
        if (i === 0) {
          context.textAlign = 'left';
        } else if (i === tickIndices.length - 1) {
          context.textAlign = 'right';
        } else {
          context.textAlign = 'center';
        }

        context.fillText(`Map ${idx + 1}`, x, height - padding.bottom + 18);
      }

      // 7. Hover Guide and Focus Points
      if (hoverIndex !== null && points[hoverIndex]) {
        const p = points[hoverIndex];
        const hx = getX(hoverIndex);
        const hyRaw = getY(p.rawRating);
        const hySmooth = getY(p.smoothedRating);

        // Vertical Guide Line
        context.save();
        context.setLineDash([3, 3]);
        context.strokeStyle = 'rgba(111, 98, 87, 0.45)';
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(hx, padding.top);
        context.lineTo(hx, height - padding.bottom);
        context.stroke();
        context.restore();

        // Highlight Raw Point
        context.beginPath();
        context.arc(hx, hyRaw, 5, 0, Math.PI * 2);
        context.fillStyle = p.rawRating >= 1.0 ? '#22c55e' : '#ef4444';
        context.fill();
        context.strokeStyle = '#ffffff';
        context.lineWidth = 1.5;
        context.stroke();

        // Highlight Smoothed Point
        context.beginPath();
        context.arc(hx, hySmooth, 6, 0, Math.PI * 2);
        context.fillStyle = '#f59e0b';
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
  }, [points, hoverIndex]);

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || points.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const paddingLeft = 45;
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
    <div ref={containerRef} className="space-y-4">
      {/* Chart Canvas Area */}
      <div className="border-border bg-surface relative h-[360px] w-full rounded-lg border p-2 sm:h-[420px]">
        <canvas
          ref={canvasRef}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          className="h-full w-full cursor-crosshair touch-none"
        />

        {/* Floating Tooltip */}
        {activePoint && (
          <div
            className={`border-border bg-surface text-foreground pointer-events-none absolute top-4 z-10 max-w-xs rounded-md border p-3.5 shadow-xl backdrop-blur-sm sm:max-w-sm ${
              hoverIndex !== null && hoverIndex > points.length / 2 ? 'left-14' : 'right-4'
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

            <p className="mt-1.5 truncate text-xs font-semibold text-foreground">
              {activePoint.tournament}
            </p>
            <p className="text-muted text-xs">vs {activePoint.opponent}</p>

            <div className="mt-2.5 grid grid-cols-2 gap-2 border-t border-border pt-2 font-mono text-xs">
              <div>
                <span className="text-muted block text-[10px] uppercase">Smoothed ({windowSize}-map)</span>
                <span className="text-accent text-sm font-bold">
                  {activePoint.smoothedRating.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-muted block text-[10px] uppercase">Raw Map Rating</span>
                <span
                  className={`text-sm font-bold ${
                    activePoint.rawRating >= 1.0 ? 'text-emerald-800' : 'text-rose-800'
                  }`}
                >
                  {activePoint.rawRating.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-muted block text-[10px] uppercase">K - D (+/-)</span>
                <span className="font-semibold text-foreground">
                  {activePoint.kills} - {activePoint.deaths} (
                  {activePoint.kills - activePoint.deaths >= 0
                    ? `+${activePoint.kills - activePoint.deaths}`
                    : activePoint.kills - activePoint.deaths}
                  )
                </span>
              </div>
              <div>
                <span className="text-muted block text-[10px] uppercase">ADR / KAST</span>
                <span className="font-semibold text-foreground">
                  {activePoint.adr.toFixed(1)} / {activePoint.kastPct.toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chart Legend */}
      <div className="text-muted flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-5 rounded-full bg-[#f59e0b]" />
            <span className="text-foreground font-semibold">
              {windowSize}-Map Rolling Moving Average
            </span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
            <span>Raw Map &ge; 1.00</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-rose-500/70" />
            <span>Raw Map &lt; 1.00</span>
          </span>
        </div>
        <div>
          <span>Hover or drag over chart to inspect map telemetry</span>
        </div>
      </div>
    </div>
  );
}

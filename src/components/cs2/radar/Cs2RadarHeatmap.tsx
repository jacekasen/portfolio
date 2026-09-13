'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Crosshair, Flame, Maximize2, Shield, Target, Zap } from 'lucide-react';
import { Cs2RadarPlayerSearch } from './Cs2RadarPlayerSearch';
import {
  ANGLES_KERNEL_RADIUS,
  computeRadarMetrics,
  filterRadarEvents,
  findSpatialHotspots,
  formatWeaponName,
  HEATMAP_PALETTES,
  MAP_DISPLAY_NAMES,
  toCanvasCoords,
  type CombatSide,
  type HeatmapTheme,
  type RadarFilterOptions,
  type RadarKillEvent,
  type RadarManifest,
  type RadarPerspective,
  type RadarPlayerDetail,
  type SpatialHotspot,
  type WeaponCategory,
} from '@/lib/cs2/radar';

type Props = {
  manifest: RadarManifest;
  initialPlayer?: string;
  initialMap?: string;
};

const HEATMAP_THEME: HeatmapTheme = 'cyber';
const HEATMAP_OPACITY = 0.85;
const MIN_POINT_INTENSITY = 0.07;
const MAX_POINT_INTENSITY = 0.16;

export function Cs2RadarHeatmap({ manifest, initialPlayer, initialMap }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedPlayer = searchParams.get('player') || initialPlayer || 'donk';
  const activePlayerSummary = useMemo(
    () => manifest.players.find((p) => p.player.toLowerCase() === selectedPlayer.toLowerCase()),
    [manifest.players, selectedPlayer],
  );
  const availableMaps = useMemo(() => manifest.allMaps || manifest.activeMaps || [], [manifest]);
  const [selectedMap, setSelectedMap] = useState<string>(
    initialMap || availableMaps[0] || 'mirage',
  );
  const [perspective, setPerspective] = useState<RadarPerspective>('attacker');
  const [combatSide, setCombatSide] = useState<CombatSide>('all');
  const [weaponCategory, setWeaponCategory] = useState<WeaponCategory>('all');
  const [firstKillOnly, setFirstKillOnly] = useState(false);
  const [tradeKillOnly, setTradeKillOnly] = useState(false);

  const [showKillPins, setShowKillPins] = useState(false);

  const [playerDetail, setPlayerDetail] = useState<RadarPlayerDetail | null>(null);
  const [hoveredEvent, setHoveredEvent] = useState<RadarKillEvent | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mapImageRef = useRef<HTMLImageElement | null>(null);
  const cacheRef = useRef<Map<string, RadarPlayerDetail>>(new Map());

  // Palette LUT cache
  const paletteCacheRef = useRef<Map<HeatmapTheme, Uint8ClampedArray>>(new Map());

  const handlePlayerChange = (newPlayer: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('player', newPlayer);
    router.push(`/projects/cs2/radar?${params.toString()}`);
  };

  // Fetch player detail data
  useEffect(() => {
    let isCancelled = false;

    async function loadPlayerData() {
      if (cacheRef.current.has(selectedPlayer)) {
        setPlayerDetail(cacheRef.current.get(selectedPlayer)!);
        return;
      }

      try {
        const res = await fetch(`/data/cs2/radar/${encodeURIComponent(selectedPlayer)}.json`);
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const data: RadarPlayerDetail = await res.json();
        if (!isCancelled) {
          cacheRef.current.set(selectedPlayer, data);
          setPlayerDetail(data);
        }
      } catch (err) {
        console.error('Failed to load CS2 radar data for player:', selectedPlayer, err);
      }
    }

    loadPlayerData();
    return () => {
      isCancelled = true;
    };
  }, [selectedPlayer]);

  // Preload map image
  useEffect(() => {
    const img = new Image();
    img.src = `/images/cs2/maps/de_${selectedMap}.png`;
    img.onload = () => {
      mapImageRef.current = img;
      renderCanvas();
    };
    img.onerror = () => {
      const fallbackImg = new Image();
      fallbackImg.src = `/images/cs2/maps/${selectedMap}.png`;
      fallbackImg.onload = () => {
        mapImageRef.current = fallbackImg;
        renderCanvas();
      };
    };
  }, [selectedMap]);

  // Compute filtered events
  const filterOptions: RadarFilterOptions = useMemo(
    () => ({
      map: selectedMap,
      perspective,
      side: combatSide,
      weaponCategory,
      headshotsOnly: false,
      firstKillOnly,
      tradeKillOnly,
    }),
    [selectedMap, perspective, combatSide, weaponCategory, firstKillOnly, tradeKillOnly],
  );

  const { events: activeEvents } = useMemo(() => {
    if (!playerDetail) return { events: [], perspectiveUsed: perspective };
    return filterRadarEvents(playerDetail, filterOptions);
  }, [playerDetail, filterOptions, perspective]);

  const metrics = useMemo(() => computeRadarMetrics(activeEvents), [activeEvents]);

  // Top Spatial Hotspots
  const spatialHotspots: SpatialHotspot[] = useMemo(() => {
    return findSpatialHotspots(activeEvents, perspective, 3);
  }, [activeEvents, perspective]);

  // Helper: Build or retrieve color palette lookup table (256x1)
  const getPaletteLUT = useCallback((theme: HeatmapTheme): Uint8ClampedArray => {
    if (paletteCacheRef.current.has(theme)) {
      return paletteCacheRef.current.get(theme)!;
    }

    const pCanvas = document.createElement('canvas');
    pCanvas.width = 256;
    pCanvas.height = 1;
    const pCtx = pCanvas.getContext('2d');
    if (!pCtx) return new Uint8ClampedArray(256 * 4);

    const grad = pCtx.createLinearGradient(0, 0, 256, 0);
    const paletteDef = HEATMAP_PALETTES[theme];
    for (const [stop, color] of paletteDef.stops) {
      grad.addColorStop(stop, color);
    }

    pCtx.fillStyle = grad;
    pCtx.fillRect(0, 0, 256, 1);
    const lut = pCtx.getImageData(0, 0, 256, 1).data;
    paletteCacheRef.current.set(theme, lut);
    return lut;
  }, []);

  // Main Canvas Render
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // 1. Draw Map Background
    if (mapImageRef.current && mapImageRef.current.complete) {
      ctx.drawImage(mapImageRef.current, 0, 0, width, height);

      // Contrast enhancement overlay: desaturates map textures so heat glow pops
      ctx.fillStyle = 'rgba(10, 15, 28, 0.48)';
      ctx.fillRect(0, 0, width, height);
    } else {
      ctx.fillStyle = '#0b0f19';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#475569';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Loading tactical radar map...', width / 2, height / 2);
      return;
    }

    // Tactical Range Rings (Center guides)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    const cx = width / 2;
    const cy = height / 2;
    [width * 0.2, width * 0.35, width * 0.5].forEach((r) => {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Subtle tactical grid
    const step = width / 8;
    for (let i = step; i < width; i += step) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(width, i);
      ctx.stroke();
    }

    if (activeEvents.length === 0) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '13px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('No combat telemetry matches active filters', width / 2, height / 2);
      return;
    }

    // 2. High-Fidelity Kernel Density Estimation (KDE) Heatmap
    const bufferSize = 512;
    const densityCanvas = document.createElement('canvas');
    densityCanvas.width = bufferSize;
    densityCanvas.height = bufferSize;
    const densityCtx = densityCanvas.getContext('2d');

    if (densityCtx) {
      densityCtx.clearRect(0, 0, bufferSize, bufferSize);
      densityCtx.globalCompositeOperation = 'lighter';

      const baseRadius = ANGLES_KERNEL_RADIUS;
      const renderedPointCount = activeEvents.length * (perspective === 'both' ? 2 : 1);
      // Normalize exposure by rendered point count so overlapping events retain color detail.
      const intensity = Math.max(
        MIN_POINT_INTENSITY,
        Math.min(MAX_POINT_INTENSITY, 1.8 / Math.sqrt(renderedPointCount + 1)),
      );

      for (const ev of activeEvents) {
        const pointsToDraw: { rx: number; ry: number }[] = [];
        if (perspective === 'attacker') {
          pointsToDraw.push({ rx: ev.ax, ry: ev.ay });
        } else if (perspective === 'victim') {
          pointsToDraw.push({ rx: ev.vx, ry: ev.vy });
        } else {
          pointsToDraw.push({ rx: ev.ax, ry: ev.ay });
          pointsToDraw.push({ rx: ev.vx, ry: ev.vy });
        }

        for (const pt of pointsToDraw) {
          const bx = pt.rx * bufferSize;
          const by = pt.ry * bufferSize;

          const grad = densityCtx.createRadialGradient(bx, by, 0, bx, by, baseRadius);
          grad.addColorStop(0, `rgba(0, 0, 0, ${intensity})`);
          grad.addColorStop(0.35, `rgba(0, 0, 0, ${intensity * 0.6})`);
          grad.addColorStop(0.7, `rgba(0, 0, 0, ${intensity * 0.2})`);
          grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

          densityCtx.fillStyle = grad;
          densityCtx.beginPath();
          densityCtx.arc(bx, by, baseRadius, 0, Math.PI * 2);
          densityCtx.fill();
        }
      }

      // Colorize using Palette Transfer LUT
      const densityImageData = densityCtx.getImageData(0, 0, bufferSize, bufferSize);
      const data = densityImageData.data;
      const palette = getPaletteLUT(HEATMAP_THEME);
      const len = data.length;

      for (let i = 0; i < len; i += 4) {
        const alpha = data[i + 3];
        if (alpha > 0) {
          const lutIndex = alpha * 4;
          data[i] = palette[lutIndex]; // R
          data[i + 1] = palette[lutIndex + 1]; // G
          data[i + 2] = palette[lutIndex + 2]; // B
          data[i + 3] = Math.min(255, Math.round(palette[lutIndex + 3] * HEATMAP_OPACITY));
        }
      }

      densityCtx.putImageData(densityImageData, 0, 0);

      // Composite colored density onto main canvas
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(densityCanvas, 0, 0, width, height);
      ctx.restore();
    }

    // 3. Optional Micro Kill Pins Overlay
    if (showKillPins) {
      for (const ev of activeEvents) {
        const isHovered = hoveredEvent === ev;
        const pt =
          perspective === 'victim'
            ? toCanvasCoords(ev.vx, ev.vy, width, height)
            : toCanvasCoords(ev.ax, ev.ay, width, height);

        // Draw pin
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, isHovered ? 5.5 : 2, 0, Math.PI * 2);
        ctx.fillStyle = isHovered
          ? '#ffffff'
          : ev.s === 'T'
            ? 'rgba(245, 158, 11, 0.85)'
            : ev.s === 'CT'
              ? 'rgba(59, 130, 246, 0.85)'
              : perspective === 'victim'
                ? 'rgba(244, 63, 94, 0.75)'
                : 'rgba(52, 211, 153, 0.75)';
        ctx.fill();

        if (isHovered) {
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Outer pulse ring
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 10, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }
    }
  }, [activeEvents, perspective, showKillPins, hoveredEvent, getPaletteLUT]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Handle Mouse Hover
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || activeEvents.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const mouseCanvasX = (e.clientX - rect.left) * scaleX;
    const mouseCanvasY = (e.clientY - rect.top) * scaleY;

    let closestEvent: RadarKillEvent | null = null;
    let minDistance = 24;

    for (const ev of activeEvents) {
      const pt =
        perspective === 'victim'
          ? toCanvasCoords(ev.vx, ev.vy, canvas.width, canvas.height)
          : toCanvasCoords(ev.ax, ev.ay, canvas.width, canvas.height);

      const d = Math.hypot(pt.x - mouseCanvasX, pt.y - mouseCanvasY);
      if (d < minDistance) {
        minDistance = d;
        closestEvent = ev;
      }
    }

    if (closestEvent) {
      setHoveredEvent(closestEvent);
      setTooltipPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    } else {
      setHoveredEvent(null);
      setTooltipPos(null);
    }
  };

  const handleCanvasMouseLeave = () => {
    setHoveredEvent(null);
    setTooltipPos(null);
  };

  return (
    <div className="space-y-4">
      {/* Pro Player Search & Popular Players */}
      <Cs2RadarPlayerSearch
        manifest={manifest}
        selectedPlayer={selectedPlayer}
        onSelectPlayer={handlePlayerChange}
      />

      {/* Top Filter Bar */}
      <div className="border-border bg-surface space-y-3 rounded-lg border p-3">
        {/* Row 1: Active Player Profile Badge & Map Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Active Player Profile Badge */}
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <span className="text-muted tracking-wider uppercase">Active:</span>
            <span className="text-foreground font-bold">
              {activePlayerSummary?.player || selectedPlayer}
            </span>
            {activePlayerSummary?.team && (
              <span className="text-muted">· {activePlayerSummary.team}</span>
            )}
            {activePlayerSummary?.role && (
              <span className="border-border bg-background text-muted rounded border px-1.5 py-0.5 text-[10px]">
                {activePlayerSummary.role}
              </span>
            )}
            {activePlayerSummary?.country && (
              <span className="text-muted text-[11px]">({activePlayerSummary.country})</span>
            )}
          </div>

          {/* Map Tabs (All 10 Maps) */}
          <div className="flex flex-wrap items-center gap-1">
            {availableMaps.map((map) => (
              <button
                key={map}
                type="button"
                onClick={() => setSelectedMap(map)}
                className={`rounded px-2 py-1 font-mono text-xs transition-colors ${
                  selectedMap === map
                    ? 'bg-accent text-background font-bold'
                    : 'text-muted hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                {MAP_DISPLAY_NAMES[map] || map}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Perspective & Combat Side */}
        <div className="border-border/60 flex flex-wrap items-center justify-between gap-3 border-t pt-2 font-mono text-xs">
          {/* Perspective Buttons */}
          <div className="flex items-center gap-1">
            <span className="text-muted mr-1">Perspective:</span>
            {(['attacker', 'victim', 'both'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setPerspective(mode)}
                className={`rounded px-2.5 py-1 transition-colors ${
                  perspective === mode
                    ? 'bg-ink text-on-ink font-bold'
                    : 'text-muted hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                {mode === 'attacker'
                  ? 'Kills (Attacker)'
                  : mode === 'victim'
                    ? 'Deaths (Victim)'
                    : 'All Positions'}
              </button>
            ))}
          </div>

          {/* Combat Side Separator: All Sides, Terrorist (T), Counter-Terrorist (CT) */}
          <div className="flex items-center gap-1">
            <span className="text-muted mr-1">Side:</span>
            {(['all', 'T', 'CT'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setCombatSide(s)}
                className={`rounded px-2.5 py-1 transition-colors ${
                  combatSide === s
                    ? s === 'T'
                      ? 'bg-amber-600 font-bold text-white'
                      : s === 'CT'
                        ? 'bg-blue-600 font-bold text-white'
                        : 'bg-ink text-on-ink font-bold'
                    : s === 'T'
                      ? 'text-amber-500 hover:bg-amber-500/10 hover:text-amber-400'
                      : s === 'CT'
                        ? 'text-blue-500 hover:bg-blue-500/10 hover:text-blue-400'
                        : 'text-muted hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                {s === 'all' ? 'All Sides' : s === 'T' ? 'Terrorist (T)' : 'Counter-Terrorist (CT)'}
              </button>
            ))}
          </div>
        </div>

        {/* Row 3: Weapon Category Pills */}
        <div className="border-border/60 flex flex-wrap items-center justify-between gap-2 border-t pt-2 font-mono text-xs">
          <div className="flex items-center gap-1">
            <span className="text-muted mr-1">Weapon:</span>
            {(['all', 'rifles', 'snipers', 'pistols', 'smg_heavy'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setWeaponCategory(cat)}
                className={`rounded px-1.5 py-0.5 text-[11px] transition-colors ${
                  weaponCategory === cat
                    ? 'bg-accent text-background font-bold'
                    : 'text-muted hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                {cat === 'all'
                  ? 'All'
                  : cat === 'rifles'
                    ? 'Rifles'
                    : cat === 'snipers'
                      ? 'Snipers'
                      : cat === 'pistols'
                        ? 'Pistols'
                        : 'SMG'}
              </button>
            ))}
          </div>

          {/* Display & Filter Toggles */}
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <label className="flex cursor-pointer items-center gap-1.5 select-none">
              <input
                type="checkbox"
                checked={showKillPins}
                onChange={(e) => setShowKillPins(e.target.checked)}
                className="accent-accent h-3.5 w-3.5 rounded"
              />
              <span className={showKillPins ? 'text-foreground font-bold' : 'text-muted'}>
                Kill Pins
              </span>
            </label>

            <label className="flex cursor-pointer items-center gap-1.5 select-none">
              <input
                type="checkbox"
                checked={firstKillOnly}
                onChange={(e) => setFirstKillOnly(e.target.checked)}
                className="accent-accent h-3.5 w-3.5 rounded"
              />
              <span className={firstKillOnly ? 'text-foreground font-bold' : 'text-muted'}>
                Opening Duels
              </span>
            </label>

            <label className="flex cursor-pointer items-center gap-1.5 select-none">
              <input
                type="checkbox"
                checked={tradeKillOnly}
                onChange={(e) => setTradeKillOnly(e.target.checked)}
                className="accent-accent h-3.5 w-3.5 rounded"
              />
              <span className={tradeKillOnly ? 'text-foreground font-bold' : 'text-muted'}>
                Trade Kills
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Main Radar Display & Stats Split */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Left Column: Interactive Radar Canvas */}
        <div className="flex flex-col items-center lg:col-span-8">
          <div className="border-border relative aspect-square w-full max-w-[720px] overflow-hidden rounded-xl border bg-slate-950 shadow-2xl">
            <canvas
              ref={canvasRef}
              width={1024}
              height={1024}
              onMouseMove={handleCanvasMouseMove}
              onMouseLeave={handleCanvasMouseLeave}
              className="h-full w-full cursor-crosshair object-contain"
            />

            {/* Cyber Neon Density Legend */}
            <div className="pointer-events-none absolute bottom-3 left-3 rounded-md border border-white/10 bg-slate-950/90 p-2 font-mono text-[10px] text-white/90 backdrop-blur-md">
              <div className="mb-1 flex items-center justify-between text-[9px] text-white/60 uppercase">
                <span>Low Density</span>
                <span>Peak Core</span>
              </div>
              <div
                className="h-2 w-36 rounded-full"
                style={{
                  background:
                    'linear-gradient(to right, transparent 0%, #4c1d95 8%, #a855f7 28%, #ec4899 52%, #fb923c 74%, #facc15 90%, #fef08a 98.5%, #ffffff 100%)',
                }}
              />
            </div>

            {/* Map Identifier & Side Badge */}
            <div className="pointer-events-none absolute top-3 right-3 flex items-center gap-2 rounded-md border border-white/10 bg-slate-950/90 px-2.5 py-1 font-mono text-xs font-bold tracking-wider text-white/90 uppercase backdrop-blur-md">
              <span>de_{selectedMap}</span>
              {combatSide !== 'all' && (
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] ${
                    combatSide === 'T'
                      ? 'border border-amber-500/40 bg-amber-500/20 text-amber-300'
                      : 'border border-blue-500/40 bg-blue-500/20 text-blue-300'
                  }`}
                >
                  {combatSide === 'T' ? 'T Side' : 'CT Side'}
                </span>
              )}
            </div>

            {/* Tactical HUD Hover Tooltip */}
            {hoveredEvent && tooltipPos && (
              <div
                className="pointer-events-none absolute z-20 w-64 -translate-x-1/2 -translate-y-full rounded-lg border border-white/20 bg-slate-950/95 p-3 font-mono text-xs text-white shadow-2xl backdrop-blur-md"
                style={{
                  left: Math.min(Math.max(tooltipPos.x, 130), 590),
                  top: Math.max(tooltipPos.y - 12, 80),
                }}
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-1.5 text-[11px]">
                  <span className="font-bold text-emerald-400">
                    {perspective === 'victim' ? hoveredEvent.opp : selectedPlayer}
                  </span>
                  <span className="text-white/50">eliminated</span>
                  <span className="font-bold text-rose-400">
                    {perspective === 'victim' ? selectedPlayer : hoveredEvent.opp}
                  </span>
                </div>

                <div className="mt-2 space-y-1 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-white/60">Weapon:</span>
                    <span className="font-bold">{formatWeaponName(hoveredEvent.w)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-white/60">Distance:</span>
                    <span className="font-bold">
                      {hoveredEvent.d !== null ? `${hoveredEvent.d} m` : 'Close range'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-white/60">Round:</span>
                    <span className="font-bold">Round {hoveredEvent.rnd}</span>
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap gap-1 border-t border-white/10 pt-1.5">
                  {hoveredEvent.s && (
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        hoveredEvent.s === 'T'
                          ? 'border border-amber-500/30 bg-amber-500/20 text-amber-300'
                          : 'border border-blue-500/30 bg-blue-500/20 text-blue-300'
                      }`}
                    >
                      {hoveredEvent.s === 'T' ? 'T Side' : 'CT Side'}
                    </span>
                  )}
                  {hoveredEvent.hs && (
                    <span className="rounded bg-rose-500/20 px-1.5 py-0.5 text-[10px] font-bold text-rose-300">
                      Headshot
                    </span>
                  )}
                  {hoveredEvent.fk && (
                    <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">
                      1st Kill (Entry)
                    </span>
                  )}
                  {hoveredEvent.tk && (
                    <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-bold text-blue-300">
                      Trade Kill
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Tactical Telemetry & Hotspots Sidebar */}
        <div className="space-y-4 lg:col-span-4">
          {/* Tactical Spatial Insight Note */}
          <div className="border-border bg-surface/50 text-muted rounded-lg border p-3 font-mono text-xs leading-4">
            <div className="text-foreground mb-1 flex items-center gap-1.5 font-bold">
              <Shield size={14} className="text-accent" />
              <span>Continuous Density Kernel</span>
            </div>
            <p className="text-[11px]">
              The Cyber Neon density engine applies a continuous 2D Gaussian radial kernel over
              tick-level Source 2 coordinates, mapped through an offscreen 256-color transfer lookup
              table. Violet, pink, and amber peaks highlight dominant anchor angles and entry choke
              points, with white reserved for the most concentrated cores.
            </p>
          </div>

          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="border-border bg-surface rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <span className="text-muted font-mono text-[11px] uppercase">Duels Rendered</span>
                <Crosshair size={14} className="text-accent" />
              </div>
              <p className="mt-1 font-mono text-2xl font-bold">{metrics.totalDuels}</p>
              <div className="text-muted mt-0.5 flex items-center gap-1.5 font-mono text-[10px]">
                <span>on {MAP_DISPLAY_NAMES[selectedMap]}</span>
                {combatSide === 'all' && metrics.totalDuels > 0 && (
                  <>
                    <span>·</span>
                    <span className="font-semibold text-amber-500">{metrics.tDuelsCount} T</span>
                    <span>·</span>
                    <span className="font-semibold text-blue-500">{metrics.ctDuelsCount} CT</span>
                  </>
                )}
              </div>
            </div>

            <div className="border-border bg-surface rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <span className="text-muted font-mono text-[11px] uppercase">Headshot %</span>
                <Target size={14} className="text-rose-500" />
              </div>
              <p className="mt-1 font-mono text-2xl font-bold">{metrics.headshotPct}%</p>
              <p className="text-muted mt-0.5 font-mono text-[10px]">precision rate</p>
            </div>

            <div className="border-border bg-surface rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <span className="text-muted font-mono text-[11px] uppercase">Avg Range</span>
                <Maximize2 size={14} className="text-blue-500" />
              </div>
              <p className="mt-1 font-mono text-2xl font-bold">{metrics.avgDistanceMeters}m</p>
              <p className="text-muted mt-0.5 font-mono text-[10px]">engagement line</p>
            </div>

            <div className="border-border bg-surface rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <span className="text-muted font-mono text-[11px] uppercase">Opening Duels</span>
                <Zap size={14} className="text-amber-500" />
              </div>
              <p className="mt-1 font-mono text-2xl font-bold">{metrics.openingDuelPct}%</p>
              <p className="text-muted mt-0.5 font-mono text-[10px]">
                {metrics.openingDuelCount} of {metrics.totalDuels} duels
              </p>
            </div>
          </div>

          {/* Detected Tactical Hotspots Card */}
          <div className="border-border bg-surface rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <h4 className="flex items-center gap-1.5 font-mono text-xs font-bold tracking-wider uppercase">
                <Flame size={14} className="text-accent" />
                <span>Primary Spatial Hotspots</span>
              </h4>
              <span className="text-muted font-mono text-[10px]">KDE Peaks</span>
            </div>

            <div className="mt-3 space-y-2 font-mono text-xs">
              {spatialHotspots.length === 0 ? (
                <p className="text-muted text-[11px]">No distinct hotspots detected</p>
              ) : (
                spatialHotspots.map((spot, idx) => (
                  <div
                    key={idx}
                    className="border-border bg-background/50 flex items-center justify-between rounded border p-2 text-[11px]"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold ${
                          idx === 0
                            ? 'bg-amber-400/20 text-amber-400'
                            : idx === 1
                              ? 'bg-sky-400/20 text-sky-400'
                              : 'bg-purple-400/20 text-purple-400'
                        }`}
                      >
                        #{idx + 1}
                      </span>
                      <span className="text-foreground font-semibold">
                        Cluster {idx + 1} · ({Math.round(spot.x * 100)}%, {Math.round(spot.y * 100)}
                        %)
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-foreground font-bold">{spot.count} duels</span>
                      <span className="text-muted ml-1.5 text-[10px]">({spot.pct}%)</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

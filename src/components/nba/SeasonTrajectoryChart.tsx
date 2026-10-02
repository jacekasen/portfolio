'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { formatSigned, rollingValue, type PlayerGameLog } from '@/lib/nba/season-trajectories';

type Props = {
  season: string;
  primary: PlayerGameLog[];
  comparison: PlayerGameLog[];
};

type WindowSize = 5 | 10 | 15;
type SelectedGame = { player: 'primary' | 'comparison'; gameId: string };

const HEIGHT = 390;
const MARGIN = { top: 22, right: 20, bottom: 58, left: 56 };

export function SeasonTrajectoryChart({ season, primary, comparison }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(760);
  const [windowSize, setWindowSize] = useState<WindowSize>(10);
  const [selected, setSelected] = useState<SelectedGame | null>(null);

  useEffect(() => {
    if (!container.current) return;
    const observer = new ResizeObserver((entries) => {
      setWidth(Math.max(320, Math.floor(entries[0].contentRect.width)));
    });
    observer.observe(container.current);
    return () => observer.disconnect();
  }, []);

  const series = useMemo(
    () => [
      {
        key: 'primary' as const,
        name: primary[0].player_name,
        rows: primary,
        color: 'var(--accent)',
      },
      ...(comparison.length
        ? [
            {
              key: 'comparison' as const,
              name: comparison[0].player_name,
              rows: comparison,
              color: 'var(--foreground)',
            },
          ]
        : []),
    ],
    [primary, comparison],
  );

  const matchingGame = (selected?.player === 'comparison' ? comparison : primary).find(
    (game) => game.game_id === selected?.gameId,
  );
  const selectedKey = matchingGame ? selected?.player : 'primary';
  const selectedGame = matchingGame ?? primary.at(-1)!;
  const selectedName =
    selectedKey === 'comparison' ? comparison[0].player_name : primary[0].player_name;

  const allValues = series.flatMap((player) =>
    player.rows.flatMap((game) => [game.plus_minus, rollingValue(game, windowSize) ?? 0]),
  );
  const ceiling = Math.max(10, Math.ceil(Math.max(...allValues.map(Math.abs)) / 10) * 10);
  const plotWidth = width - MARGIN.left - MARGIN.right;
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
  const x = (gameNumber: number) => MARGIN.left + ((gameNumber - 1) / 81) * plotWidth;
  const y = (value: number) => MARGIN.top + ((ceiling - value) / (2 * ceiling)) * plotHeight;
  const ticks = width < 520 ? [1, 20, 40, 60, 82] : [1, 10, 20, 30, 40, 50, 60, 70, 82];
  const yTicks = [-ceiling, -ceiling / 2, 0, ceiling / 2, ceiling];

  return (
    <section className="space-y-7" aria-label={`${season} player trajectories`}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-accent mb-2 font-mono text-xs tracking-[0.16em] uppercase">
            {season} regular season
          </p>
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
            {series.map((player) => player.name).join(' vs. ')}
          </h2>
        </div>
        <fieldset className="flex flex-wrap items-center gap-1" aria-label="Rolling average window">
          <legend className="text-muted mb-2 font-mono text-xs uppercase">
            Rolling appearances
          </legend>
          {([5, 10, 15] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setWindowSize(value)}
              aria-pressed={windowSize === value}
              className={`rounded px-3 py-2 font-mono text-sm transition-colors ${
                windowSize === value
                  ? 'bg-accent text-background'
                  : 'bg-surface text-foreground hover:bg-ink'
              }`}
            >
              {value} games
            </button>
          ))}
        </fieldset>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
        {series.map((player) => (
          <span key={player.key} className="inline-flex items-center gap-2">
            <span className="inline-block h-[3px] w-6" style={{ background: player.color }} />
            {player.name} rolling average
          </span>
        ))}
        <span className="text-muted inline-flex items-center gap-2">
          <span className="bg-muted inline-block size-2 rounded-full" />
          single-game plus-minus
        </span>
        <span className="text-muted inline-flex items-center gap-2">
          <span className="border-muted inline-block w-6 border-t-2 border-dashed" />
          missed team games
        </span>
      </div>

      <div ref={container} className="w-full">
        <svg
          viewBox={`0 0 ${width} ${HEIGHT}`}
          className="block w-full"
          role="img"
          aria-label={`Game-level plus-minus and ${windowSize}-appearance rolling averages for ${series.map((player) => player.name).join(' and ')} in ${season}, plotted against team game numbers 1 through 82.`}
        >
          <rect
            x={MARGIN.left}
            y={MARGIN.top}
            width={plotWidth}
            height={plotHeight}
            fill="none"
            stroke="var(--border)"
          />
          {yTicks.map((value) => (
            <g key={value}>
              <line
                x1={MARGIN.left}
                x2={width - MARGIN.right}
                y1={y(value)}
                y2={y(value)}
                stroke={value === 0 ? 'var(--muted)' : 'var(--border)'}
                strokeWidth={value === 0 ? 1.5 : 1}
              />
              <text
                x={MARGIN.left - 9}
                y={y(value) + 4}
                textAnchor="end"
                fill="var(--muted)"
                fontSize="12"
              >
                {formatSigned(value)}
              </text>
            </g>
          ))}
          {ticks.map((value) => (
            <g key={value}>
              <line
                x1={x(value)}
                x2={x(value)}
                y1={HEIGHT - MARGIN.bottom}
                y2={HEIGHT - MARGIN.bottom + 5}
                stroke="var(--border)"
              />
              <text
                x={x(value)}
                y={HEIGHT - MARGIN.bottom + 21}
                textAnchor={value === 1 ? 'start' : value === 82 ? 'end' : 'middle'}
                fill="var(--muted)"
                fontSize="12"
              >
                {value}
              </text>
            </g>
          ))}
          <text
            x={MARGIN.left + plotWidth / 2}
            y={HEIGHT - 8}
            textAnchor="middle"
            fill="var(--foreground)"
            fontSize="13"
          >
            Team game number (1–82)
          </text>
          <text
            transform={`translate(16 ${MARGIN.top + plotHeight / 2}) rotate(-90)`}
            textAnchor="middle"
            fill="var(--foreground)"
            fontSize="13"
          >
            Plus-minus (points)
          </text>

          {series.map((player) => (
            <g key={player.key}>
              <path
                d={rollingPaths(player.rows, windowSize, x, y).gaps}
                fill="none"
                stroke={player.color}
                strokeWidth="2"
                strokeDasharray="4 5"
                opacity="0.65"
              />
              <path
                d={rollingPaths(player.rows, windowSize, x, y).solid}
                fill="none"
                stroke={player.color}
                strokeWidth="3"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {player.rows.map((game) => (
                <circle
                  key={`${game.game_id}-${game.team_abbreviation}`}
                  cx={x(game.team_game_number)}
                  cy={y(game.plus_minus)}
                  r={selectedGame.game_id === game.game_id && selectedKey === player.key ? 5 : 3}
                  fill={player.color}
                  opacity={
                    selectedGame.game_id === game.game_id && selectedKey === player.key ? 1 : 0.45
                  }
                  onClick={() => setSelected({ player: player.key, gameId: game.game_id })}
                >
                  <title>{`${player.name} · ${game.game_date} · team game ${game.team_game_number} · ${formatSigned(game.plus_minus)}`}</title>
                </circle>
              ))}
            </g>
          ))}
        </svg>
      </div>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="bg-surface rounded-lg p-5">
          <label
            htmlFor="trajectory-game"
            className="text-muted mb-2 block font-mono text-xs uppercase"
          >
            Inspect an appearance
          </label>
          <select
            id="trajectory-game"
            value={`${selectedKey}:${selectedGame.game_id}`}
            onChange={(event) => {
              const [player, gameId] = event.target.value.split(':');
              setSelected({ player: player as SelectedGame['player'], gameId });
            }}
            className="border-border bg-background mb-4 h-11 w-full rounded border px-3"
          >
            {series.flatMap((player) =>
              player.rows.map((game) => (
                <option
                  key={`${player.key}-${game.game_id}`}
                  value={`${player.key}:${game.game_id}`}
                >
                  {player.name} · game {game.team_game_number} · {game.game_date}
                </option>
              )),
            )}
          </select>
          <p className="text-lg font-bold">
            {selectedName} · {formatDate(selectedGame.game_date)}
          </p>
          <p className="text-muted mt-1 text-sm">
            {selectedGame.team_abbreviation} {selectedGame.is_home ? 'vs.' : '@'}{' '}
            {selectedGame.opponent_abbreviation}
            {' · '}
            {selectedGame.win_loss === 'W'
              ? 'Win'
              : selectedGame.win_loss === 'L'
                ? 'Loss'
                : 'Result unavailable'}
            {' · '}team game {selectedGame.team_game_number}
          </p>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 font-mono text-sm">
            <span>
              ± <strong>{formatSigned(selectedGame.plus_minus)}</strong>
            </span>
            <span>
              MIN <strong>{selectedGame.minutes.toFixed(1)}</strong>
            </span>
            <span>
              PTS <strong>{selectedGame.points}</strong>
            </span>
            <span>
              REB <strong>{selectedGame.rebounds}</strong>
            </span>
            <span>
              AST <strong>{selectedGame.assists}</strong>
            </span>
          </div>
        </div>
        <div className="bg-surface rounded-lg p-5">
          <p className="text-muted mb-3 font-mono text-xs uppercase">Season context</p>
          <div className="space-y-3">
            {series.map((player) => {
              const first = player.rows.slice(0, 10);
              const last = player.rows.slice(-10);
              const firstMean = mean(first.map((game) => game.plus_minus));
              const lastMean = mean(last.map((game) => game.plus_minus));
              return (
                <div
                  key={player.key}
                  className="border-border border-b pb-3 last:border-0 last:pb-0"
                >
                  <p className="font-bold">
                    {player.name}{' '}
                    <span className="text-muted font-normal">
                      · {player.rows.length} appearances
                    </span>
                  </p>
                  <p className="text-muted mt-1 text-sm">
                    First {first.length}: {formatSigned(firstMean, 1)} per game · Last {last.length}
                    : {formatSigned(lastMean, 1)} per game
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function rollingPaths(
  rows: PlayerGameLog[],
  windowSize: WindowSize,
  x: (value: number) => number,
  y: (value: number) => number,
): { solid: string; gaps: string } {
  let previous: PlayerGameLog | null = null;
  const solid: string[] = [];
  const gaps: string[] = [];
  for (const game of rows) {
    const value = rollingValue(game, windowSize);
    if (value === null) continue;
    const coordinate = `${x(game.team_game_number).toFixed(1)},${y(value).toFixed(1)}`;
    const trade =
      game.is_trade_transition ||
      (previous !== null && game.team_game_number <= previous.team_game_number);
    const missed = previous !== null && game.team_game_number - previous.team_game_number > 1;
    if (missed && !trade && previous) {
      const previousValue = rollingValue(previous, windowSize);
      if (previousValue !== null) {
        gaps.push(
          `M${x(previous.team_game_number).toFixed(1)},${y(previousValue).toFixed(1)} L${coordinate}`,
        );
      }
    }
    solid.push(`${!previous || trade || missed ? 'M' : 'L'}${coordinate}`);
    previous = game;
  }
  return { solid: solid.join(' '), gaps: gaps.join(' ') };
}

function mean(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00Z`));
}

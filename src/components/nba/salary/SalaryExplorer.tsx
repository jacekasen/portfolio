'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PlayerSalaryRow, SalaryIndex, TeamSeasonSalaries } from '@/lib/nba/salaries';
import {
  buildPayrollComposition,
  formatPercent,
  formatSalary,
  formatSalaryExact,
  repairPlayerName,
  resolveTeam,
  summarizeTeamSeason,
  type SalaryMeasure,
} from '@/lib/nba/salary-format';
import { teamLabel, teamName } from '@/lib/nba/teams';
import { EmptyState, StatCard, ToggleGroup } from './chart-ui';
import { PayrollCapStrip, SalaryBars } from './SalaryBars';
import { SalaryDonut } from './SalaryDonut';
import { PlayerSalaryPanel } from './PlayerSalaryPanel';
import { SalaryLeaderboard } from './SalaryLeaderboard';

export type ViewMode = 'bars' | 'donut';

export type SalaryExplorerInitialState = {
  season: string;
  team: string;
  view: ViewMode;
  measure: SalaryMeasure;
  teamSeason: TeamSeasonSalaries | null;
  teamSeasonError: string | null;
  playerId: string | null;
  playerName: string | null;
  playerHistory: PlayerSalaryRow[] | null;
};

type SelectedPlayer = { id: string; name: string };

export function SalaryExplorer({
  index,
  initial,
}: {
  index: SalaryIndex;
  initial: SalaryExplorerInitialState;
}) {
  const [season, setSeason] = useState(initial.season);
  const [team, setTeam] = useState(initial.team);
  const [view, setView] = useState<ViewMode>(initial.view);
  const [measure, setMeasure] = useState<SalaryMeasure>(initial.measure);
  const [player, setPlayer] = useState<SelectedPlayer | null>(
    initial.playerId
      ? { id: initial.playerId, name: initial.playerName ?? initial.playerId }
      : null,
  );

  const teamCache = useRef(
    new Map<string, TeamSeasonSalaries>(
      initial.teamSeason ? [[cacheKey(initial.team, initial.season), initial.teamSeason]] : [],
    ),
  );
  const historyCache = useRef(
    new Map<string, PlayerSalaryRow[]>(
      initial.playerId && initial.playerHistory ? [[initial.playerId, initial.playerHistory]] : [],
    ),
  );

  const [teamSeason, setTeamSeason] = useState<TeamSeasonSalaries | null>(initial.teamSeason);
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamError, setTeamError] = useState<string | null>(initial.teamSeasonError);
  const [reloadToken, setReloadToken] = useState(0);

  const [history, setHistory] = useState<{ playerId: string; rows: PlayerSalaryRow[] } | null>(
    initial.playerId && initial.playerHistory
      ? { playerId: initial.playerId, rows: initial.playerHistory }
      : null,
  );
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const seasonEntry = useMemo(
    () => index.seasons.find((entry) => entry.season === season) ?? index.seasons[0],
    [index.seasons, season],
  );

  // Team-season records. Bars and donut share this fetch; switching views never refetches.
  useEffect(() => {
    const key = cacheKey(team, season);
    const cached = teamCache.current.get(key);
    if (cached) {
      setTeamSeason(cached);
      setTeamError(null);
      setTeamLoading(false);
      return;
    }

    const controller = new AbortController();
    setTeamLoading(true);
    setTeamError(null);

    fetch(
      `/api/nba/salaries/team-season?team=${encodeURIComponent(team)}&season=${encodeURIComponent(season)}`,
      { signal: controller.signal },
    )
      .then(async (response) => {
        if (!response.ok) throw new Error('Request failed');
        return (await response.json()) as TeamSeasonSalaries;
      })
      .then((data) => {
        teamCache.current.set(key, data);
        setTeamSeason(data);
        setTeamLoading(false);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        // Keep whatever is already on screen; it stays correctly labelled by its own data.
        setTeamError(`${teamName(team)} ${season} could not be loaded.`);
        setTeamLoading(false);
      });

    return () => controller.abort();
  }, [team, season, reloadToken]);

  // Career history is only requested once a player has been selected.
  useEffect(() => {
    if (!player) return;

    const playerId = player.id;
    const cached = historyCache.current.get(playerId);
    if (cached) {
      setHistory({ playerId, rows: cached });
      setHistoryError(null);
      setHistoryLoading(false);
      return;
    }

    const controller = new AbortController();
    setHistoryLoading(true);
    setHistoryError(null);

    fetch(`/api/nba/salaries/player?id=${encodeURIComponent(playerId)}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('Request failed');
        return (await response.json()) as PlayerSalaryRow[];
      })
      .then((data) => {
        historyCache.current.set(playerId, data);
        setHistory({ playerId, rows: data });
        setHistoryLoading(false);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setHistoryError('The salary database did not respond.');
        setHistoryLoading(false);
      });

    return () => controller.abort();
  }, [player]);

  // Shareable state: /projects/nba/salaries?team=LAC&season=2024-25&player=leonaka01
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams();
    params.set('team', team);
    params.set('season', season);
    if (view !== 'bars') params.set('view', view);
    if (measure !== 'cap') params.set('measure', measure);
    if (player) params.set('player', player.id);

    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
  }, [team, season, view, measure, player]);

  const handleSeasonChange = useCallback(
    (nextSeason: string) => {
      const entry = index.seasons.find((candidate) => candidate.season === nextSeason);
      setSeason(nextSeason);
      setTeam((currentTeam) => resolveTeam(entry ?? null, currentTeam) ?? currentTeam);
    },
    [index.seasons],
  );

  const selectPlayer = useCallback((playerId: string, playerName: string) => {
    setPlayer((current) => (current?.id === playerId ? null : { id: playerId, name: playerName }));
  }, []);

  const openTeamSeason = useCallback(
    (row: PlayerSalaryRow) => {
      const entry = index.seasons.find((candidate) => candidate.season === row.season);
      if (!entry) return;
      setSeason(row.season);
      setTeam(row.team);
    },
    [index.seasons],
  );

  // Everything below is labelled from the data currently on screen, not from the pending
  // selection, so a slow fetch never blanks the chart or mislabels it mid-flight.
  const rows = useMemo(() => teamSeason?.rows ?? [], [teamSeason]);
  const shownTeam = teamSeason?.team ?? team;
  const shownSeason = teamSeason?.season ?? season;
  const shownSeasonEntry =
    index.seasons.find((entry) => entry.season === shownSeason) ?? seasonEntry;
  const salaryCap = shownSeasonEntry?.salaryCap ?? teamSeason?.salaryCap ?? null;
  const isPending = teamLoading && (shownTeam !== team || shownSeason !== season);
  const summary = useMemo(() => summarizeTeamSeason(rows, salaryCap), [rows, salaryCap]);
  const composition = useMemo(() => buildPayrollComposition(rows), [rows]);
  // Cap share is meaningless without a cap value for the season.
  const effectiveMeasure: SalaryMeasure = salaryCap === null ? 'salary' : measure;

  return (
    <div className="space-y-12">
      <section aria-label="Choose a team and season" className="space-y-5">
        <div className="border-border bg-surface grid gap-4 rounded-lg border p-5 sm:grid-cols-2 md:p-6">
          <label className="grid gap-2">
            <span className="font-mono text-xs font-bold tracking-wide uppercase">Team</span>
            <select
              value={team}
              onChange={(event) => setTeam(event.target.value)}
              className="border-border bg-background h-11 rounded border px-3"
            >
              {(seasonEntry?.teams ?? [])
                .slice()
                .sort((a, b) => teamName(a.team).localeCompare(teamName(b.team)))
                .map((entry) => (
                  <option key={entry.team} value={entry.team}>
                    {teamLabel(entry.team)}
                  </option>
                ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="font-mono text-xs font-bold tracking-wide uppercase">Season</span>
            <select
              value={season}
              onChange={(event) => handleSeasonChange(event.target.value)}
              className="border-border bg-background h-11 rounded border px-3"
            >
              {index.seasons.map((entry) => (
                <option key={entry.season} value={entry.season}>
                  {entry.season}
                  {entry.sparse ? ' · sparse data' : ''}
                </option>
              ))}
            </select>
          </label>
        </div>

        {shownSeasonEntry?.sparse ? (
          <p className="border-accent-light bg-accent-light/10 rounded border-l-2 px-4 py-3 text-sm leading-6">
            <strong className="font-mono text-xs tracking-wide uppercase">Sparse season</strong>
            <br />
            {shownSeason} has only {shownSeasonEntry.recordCount.toLocaleString()} salary records
            league wide, far below a typical season. Team totals here are partial, not complete
            payrolls.
          </p>
        ) : null}
      </section>

      <section aria-labelledby="team-chart-title" className="space-y-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="text-accent mb-2 font-mono text-xs tracking-[0.14em] uppercase">
              01 · Roster
            </p>
            <h2 id="team-chart-title" className="text-2xl font-bold md:text-3xl">
              {teamName(shownTeam)} · {shownSeason}
            </h2>
            <p className="text-muted mt-2 max-w-2xl text-sm leading-6">
              Every recorded contract on the roster, measured against the league salary cap.
            </p>
            <p aria-live="polite" className="text-muted mt-2 font-mono text-xs">
              {isPending ? `Loading ${teamName(team)} ${season}…` : ''}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ToggleGroup
              label="Measure"
              value={effectiveMeasure}
              onChange={setMeasure}
              options={[
                { value: 'cap', label: 'Cap share' },
                { value: 'salary', label: 'Salary' },
              ]}
            />
            <ToggleGroup
              label="Visualization"
              value={view}
              onChange={setView}
              options={[
                { value: 'bars', label: 'Bars' },
                { value: 'donut', label: 'Donut' },
              ]}
            />
          </div>
        </div>

        {salaryCap === null ? (
          <p className="text-muted text-sm">
            No salary-cap value is recorded for {shownSeason}, so cap share cannot be calculated.
            The chart is showing nominal salary instead.
          </p>
        ) : null}

        {teamError ? (
          <div className="border-accent-light bg-accent-light/10 flex flex-wrap items-center justify-between gap-4 rounded border-l-2 px-4 py-3">
            <p className="text-sm leading-6">
              {teamError} {rows.length ? 'The previous team-season is still shown below.' : ''}
            </p>
            <button
              type="button"
              onClick={() => setReloadToken((token) => token + 1)}
              className="bg-accent text-background rounded px-4 py-2 font-mono text-sm"
            >
              try again
            </button>
          </div>
        ) : null}

        {!rows.length && teamLoading ? (
          <p className="text-muted font-mono text-sm">Loading {teamName(team)} salaries…</p>
        ) : !rows.length && teamError ? (
          <EmptyState title="Could not load this team-season">
            The page needs the salary tables published by the analysis pipeline.
          </EmptyState>
        ) : !rows.length ? (
          <EmptyState title="No salary records for this team-season">
            The dataset has no rows for {teamName(shownTeam)} in {shownSeason}. Coverage is uneven
            before the modern contract era, and some team-seasons are missing entirely.
          </EmptyState>
        ) : (
          <div className={isPending ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
            <PayrollCapStrip
              rows={rows}
              payrollVsCap={summary.payrollVsCap}
              selectedPlayerId={player?.id ?? null}
            />

            <div className="mt-6">
              {view === 'bars' ? (
                <SalaryBars
                  rows={rows}
                  measure={effectiveMeasure}
                  salaryCap={salaryCap}
                  selectedPlayerId={player?.id ?? null}
                  onSelect={(row) => selectPlayer(row.player_id, row.player_name)}
                />
              ) : (
                <SalaryDonut
                  composition={composition}
                  payrollVsCap={summary.payrollVsCap}
                  selectedPlayerId={player?.id ?? null}
                  onSelect={(row) => selectPlayer(row.player_id, row.player_name)}
                />
              )}
            </div>
          </div>
        )}

        <MethodologyNote updatedAt={index.updatedAt} />
      </section>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="Salary cap"
          value={formatSalary(salaryCap)}
          detail={salaryCap === null ? 'No cap value for this season' : shownSeason}
          muted={salaryCap === null}
        />
        <StatCard
          label="Known payroll"
          value={formatSalary(summary.knownPayroll)}
          detail={`${summary.knownCount} of ${summary.totalRecords} records have amounts`}
          muted={summary.knownPayroll === null}
        />
        <StatCard
          label="Payroll / cap"
          value={formatPercent(summary.payrollVsCap)}
          detail={summary.payrollVsCap === null ? 'Needs a cap and a payroll' : 'Known salaries'}
          muted={summary.payrollVsCap === null}
        />
        <StatCard
          label="Largest cap share"
          value={formatPercent(summary.largestCapShare)}
          detail={
            summary.topEarner ? repairPlayerName(summary.topEarner.player_name) : 'No records'
          }
          muted={summary.largestCapShare === null}
        />
        <StatCard
          label="Highest salary"
          value={formatSalary(summary.topEarner?.salary ?? null)}
          detail={summary.topEarner ? formatSalaryExact(summary.topEarner.salary) : 'No records'}
          muted={!summary.topEarner}
        />
      </div>

      {player ? (
        <PlayerSalaryPanel
          playerName={player.name}
          history={history?.playerId === player.id ? history.rows : []}
          measure={effectiveMeasure}
          loading={historyLoading}
          error={historyError}
          onClose={() => setPlayer(null)}
          onOpenTeamSeason={openTeamSeason}
        />
      ) : (
        <p className="text-muted border-border rounded border border-dashed px-4 py-3 text-sm">
          Select any player to see how expensive their contract was, season by season, against the
          cap of the day.
        </p>
      )}

      <SalaryLeaderboard
        seasons={index.seasons.map((entry) => entry.season)}
        onSelectPlayer={selectPlayer}
        selectedPlayerId={player?.id ?? null}
      />
    </div>
  );
}

function MethodologyNote({ updatedAt }: { updatedAt: string | null }) {
  return (
    <details className="border-border bg-surface group overflow-hidden rounded-lg border">
      <summary className="hover:bg-accent-light/10 flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-3 font-mono text-xs tracking-wide uppercase transition-colors">
        <span>Methodology and data quality</span>
        <span className="text-accent group-open:rotate-45" aria-hidden="true">
          +
        </span>
      </summary>
      <div className="border-border text-muted space-y-3 border-t px-5 py-4 text-sm leading-6">
        <p>
          Historical salary data is based primarily on Basketball Reference and may contain gaps or
          estimated historical records. Salaries and cap values are collected offline by the
          analysis pipeline; this page never scrapes on request.
        </p>
        <p>
          <span className="font-mono text-xs">cap share = salary / salary cap × 100</span> compares
          a contract to the league cap.{' '}
          <span className="font-mono text-xs">
            team payroll share = salary / known team payroll
          </span>{' '}
          compares it to the rest of the roster. Only the second is a share of a whole, which is why
          the donut uses it and the bars do not.
        </p>
        <p>
          The pipeline never invents a missing salary. Rows without a usable amount are labelled
          &ldquo;not recorded&rdquo; and excluded from payroll totals rather than counted as zero.
          Because Basketball Reference does not expose reliable per-row provenance, extracted
          amounts are conservatively labelled as uncertain historical quality rather than reported
          contracts.
        </p>
        <p>
          Coverage before the modern contract era is uneven, and seasons flagged as sparse in the
          season selector are known to be incomplete. Luxury-tax and apron thresholds are not part
          of this dataset, so they are not drawn on any chart.
        </p>
        {updatedAt ? (
          <p className="font-mono text-xs">
            Salary tables last updated {new Date(updatedAt).toISOString().slice(0, 10)}.
          </p>
        ) : null}
      </div>
    </details>
  );
}

function cacheKey(team: string, season: string) {
  return `${team}|${season}`;
}

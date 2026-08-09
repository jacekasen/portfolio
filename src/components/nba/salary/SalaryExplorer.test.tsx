import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SalaryExplorer, type SalaryExplorerInitialState } from './SalaryExplorer';
import type { PlayerSalaryRow, SalaryIndex, TeamSeasonSalaries } from '@/lib/nba/salaries';

const SALARY_CAP = 140_588_000;

function row(overrides: Partial<PlayerSalaryRow> = {}): PlayerSalaryRow {
  const salary = overrides.salary === undefined ? 10_000_000 : overrides.salary;
  return {
    player_id: 'playerx01',
    player_name: 'Player X',
    player_url: 'https://www.basketball-reference.com/players/p/playerx01.html',
    season: '2024-25',
    season_start: 2024,
    team: 'LAC',
    salary,
    salary_cap: SALARY_CAP,
    cap_share: salary === null ? null : (salary / SALARY_CAP) * 100,
    team_payroll_share: null,
    salary_quality: salary === null ? 'missing' : 'historical_unknown_quality',
    ...overrides,
  };
}

/** Ten recorded contracts, enough for the donut's coverage threshold, plus one blank row. */
function clippersRoster(): PlayerSalaryRow[] {
  const players = [
    ['leonaka01', 'Kawhi Leonard', 49_205_800],
    ['hardeja01', 'James Harden', 33_653_846],
    ['powelno01', 'Norman Powell', 19_241_379],
    ['zubaciv01', 'Ivica Zubac', 11_743_000],
    ['jonesde02', 'Derrick Jones Jr.', 9_600_000],
    ['dunnkr01', 'Kris Dunn', 5_200_000],
    ['eubandr01', 'Drew Eubanks', 4_750_000],
    ['batumni01', 'Nicolas Batum', 4_500_000],
    ['coffeam01', 'Amir Coffey', 3_900_000],
    ['brownko02', 'Kobe Brown', 2_500_000],
  ] as const;

  return [
    ...players.map(([player_id, player_name, salary]) =>
      row({ player_id, player_name, salary, team: 'LAC' }),
    ),
    row({ player_id: 'millejo05', player_name: 'Jordan Miller', salary: null, team: 'LAC' }),
  ];
}

function celticsRoster(): PlayerSalaryRow[] {
  return [
    row({
      player_id: 'tatumja01',
      player_name: 'Jayson Tatum',
      salary: 34_848_340,
      team: 'BOS',
      season: '2024-25',
    }),
    row({
      player_id: 'brownja02',
      player_name: 'Jaylen Brown',
      salary: 49_205_800,
      team: 'BOS',
      season: '2024-25',
    }),
  ];
}

const index: SalaryIndex = {
  updatedAt: '2026-08-09T20:47:50.262579+00:00',
  seasons: [
    {
      season: '2024-25',
      seasonStart: 2024,
      salaryCap: SALARY_CAP,
      recordCount: 600,
      sparse: false,
      teams: [
        { team: 'LAC', recordCount: 21, payrollShareAvailable: true },
        { team: 'BOS', recordCount: 18, payrollShareAvailable: true },
      ],
    },
    {
      season: '1986-87',
      seasonStart: 1986,
      salaryCap: 4_945_000,
      recordCount: 49,
      sparse: true,
      teams: [{ team: 'NYK', recordCount: 4, payrollShareAvailable: false }],
    },
  ],
};

const clippers2425: TeamSeasonSalaries = {
  team: 'LAC',
  season: '2024-25',
  salaryCap: SALARY_CAP,
  rows: clippersRoster(),
};

function initialState(
  overrides: Partial<SalaryExplorerInitialState> = {},
): SalaryExplorerInitialState {
  return {
    season: '2024-25',
    team: 'LAC',
    view: 'bars',
    measure: 'cap',
    teamSeason: clippers2425,
    teamSeasonError: null,
    playerId: null,
    playerName: null,
    playerHistory: null,
    ...overrides,
  };
}

type Deferred = { resolve: (rows: PlayerSalaryRow[]) => void };

let teamSeasonResponses: Map<string, TeamSeasonSalaries>;
let playerResponses: Map<string, PlayerSalaryRow[]>;
let pendingTeamSeason: Deferred | null;
let fetchMock: ReturnType<typeof vi.fn>;

function jsonResponse(body: unknown) {
  return { ok: true, json: async () => body } as Response;
}

beforeEach(() => {
  teamSeasonResponses = new Map([
    [
      'BOS|2024-25',
      { team: 'BOS', season: '2024-25', salaryCap: SALARY_CAP, rows: celticsRoster() },
    ],
    [
      'NYK|1986-87',
      {
        team: 'NYK',
        season: '1986-87',
        salaryCap: 4_945_000,
        rows: [
          row({
            player_id: 'ewingpa01',
            player_name: 'Patrick Ewing',
            salary: 1_500_000,
            salary_cap: 4_945_000,
            cap_share: 30.3,
            team: 'NYK',
            season: '1986-87',
          }),
        ],
      },
    ],
  ]);
  playerResponses = new Map([
    [
      'leonaka01',
      [
        row({ player_id: 'leonaka01', player_name: 'Kawhi Leonard', salary: 49_205_800 }),
        row({
          player_id: 'leonaka01',
          player_name: 'Kawhi Leonard',
          season: '2023-24',
          season_start: 2023,
          salary: 45_640_084,
        }),
      ],
    ],
  ]);
  pendingTeamSeason = null;

  fetchMock = vi.fn(async (input: string) => {
    if (input.includes('/leaderboard')) return jsonResponse([]);

    if (input.includes('/team-season')) {
      const params = new URLSearchParams(input.split('?')[1]);
      const key = `${params.get('team')}|${params.get('season')}`;
      const body = teamSeasonResponses.get(key);
      if (!body) throw new Error(`unexpected team-season request: ${key}`);
      return jsonResponse(body);
    }

    const params = new URLSearchParams(input.split('?')[1]);
    const history = playerResponses.get(params.get('id') ?? '');
    if (pendingTeamSeason) return new Promise(() => {});
    return jsonResponse(history ?? []);
  });

  vi.stubGlobal('fetch', fetchMock);
  window.history.replaceState(null, '', '/projects/nba/salaries');
});

afterEach(() => {
  vi.unstubAllGlobals();
});

/** The roster chart, scoped away from the summary cards and the leaderboard. */
function chart() {
  return within(document.querySelector('section[aria-labelledby="team-chart-title"]')!);
}

/** The team and season selectors, which share their labels with the leaderboard filter. */
function controls() {
  return within(screen.getByRole('region', { name: 'Choose a team and season' }));
}

describe('SalaryExplorer', () => {
  it('renders the selected team-season without refetching what the server already sent', async () => {
    render(<SalaryExplorer index={index} initial={initialState()} />);

    expect(screen.getByRole('heading', { name: /Los Angeles Clippers · 2024-25/ })).toBeVisible();
    expect(chart().getByText('Kawhi Leonard')).toBeVisible();
    expect(chart().getAllByText('35.0%').length).toBeGreaterThan(0);

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(fetchMock.mock.calls.every(([url]) => String(url).includes('/leaderboard'))).toBe(true);
  });

  it('summarizes payroll against the cap and can exceed it', () => {
    render(<SalaryExplorer index={index} initial={initialState()} />);

    expect(controls().getByText('$140.6M')).toBeVisible();
    expect(controls().getByText('$144.3M')).toBeVisible();
    expect(controls().getByText('102.6%')).toBeVisible();
    // The same figure anchors the payroll-against-cap bar, which is free to pass 100%.
    expect(chart().getByText('102.6%')).toBeVisible();
  });

  it('counts records without a salary instead of treating them as zero', () => {
    render(<SalaryExplorer index={index} initial={initialState()} />);

    expect(screen.getByText('10 of 11 records have amounts')).toBeVisible();
    expect(screen.getByText(/Salary not recorded · 1/)).toBeVisible();
    expect(screen.getByRole('button', { name: 'Jordan Miller' })).toBeVisible();
  });

  it('keeps the current chart on screen while another team loads', async () => {
    render(<SalaryExplorer index={index} initial={initialState()} />);

    fireEvent.change(controls().getByLabelText('Team'), { target: { value: 'BOS' } });

    // The previous roster is still readable, and still labelled as the Clippers.
    expect(chart().getByText('Kawhi Leonard')).toBeVisible();
    expect(screen.getByRole('heading', { name: /Los Angeles Clippers/ })).toBeVisible();

    await waitFor(() => expect(chart().getByText('Jayson Tatum')).toBeVisible());
    expect(screen.getByRole('heading', { name: /Boston Celtics · 2024-25/ })).toBeVisible();
    expect(chart().queryByText('Kawhi Leonard')).not.toBeInTheDocument();
  });

  it('moves to a team that exists when the season changes', async () => {
    render(<SalaryExplorer index={index} initial={initialState()} />);

    fireEvent.change(controls().getByLabelText('Season'), { target: { value: '1986-87' } });

    await waitFor(() => expect(chart().getByText('Patrick Ewing')).toBeVisible());
    expect(controls().getByLabelText('Team')).toHaveValue('NYK');
    expect(screen.getByText(/has only 49 salary records league wide/)).toBeVisible();
  });

  it('switches between bars and donut without another request', async () => {
    render(<SalaryExplorer index={index} initial={initialState()} />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const callsBefore = fetchMock.mock.calls.length;

    fireEvent.click(screen.getByRole('button', { name: 'Donut' }));
    expect(screen.getByText('Share of known team payroll')).toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: 'Bars' }));
    expect(fetchMock.mock.calls.length).toBe(callsBefore);
  });

  it('disables payroll composition when the roster is too thinly covered', async () => {
    render(<SalaryExplorer index={index} initial={initialState({ view: 'donut' })} />);

    fireEvent.change(controls().getByLabelText('Season'), { target: { value: '1986-87' } });

    await waitFor(() =>
      expect(
        screen.getByText(/Payroll composition is not available for this team-season/),
      ).toBeVisible(),
    );
    expect(screen.getByText(/Only 1 salary is recorded/)).toBeVisible();
  });

  it('switches the primary measure from cap share to dollars', () => {
    render(<SalaryExplorer index={index} initial={initialState()} />);

    expect(chart().getAllByText('35.0%').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: 'Salary' }));

    expect(chart().queryByText('35.0%')).not.toBeInTheDocument();
    expect(chart().getAllByText('$49.2M').length).toBeGreaterThan(0);
  });

  it('loads a career history when a player is selected and shares it in the URL', async () => {
    render(<SalaryExplorer index={index} initial={initialState()} />);

    fireEvent.click(screen.getByRole('button', { name: /^Kawhi Leonard, Los Angeles Clippers/ }));

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Kawhi Leonard' })).toBeVisible(),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/nba/salaries/player?id=leonaka01',
      expect.anything(),
    );
    expect(window.location.search).toBe('?team=LAC&season=2024-25&player=leonaka01');

    const panel = screen.getByRole('region', { name: 'Kawhi Leonard' });
    expect(within(panel).getByText(/Career high 35.0% of the cap in 2024-25/)).toBeVisible();
  });

  it('restores team, season, view, and player from the initial URL state', () => {
    render(
      <SalaryExplorer
        index={index}
        initial={initialState({
          view: 'donut',
          measure: 'salary',
          playerId: 'leonaka01',
          playerName: 'Kawhi Leonard',
          playerHistory: playerResponses.get('leonaka01') ?? [],
        })}
      />,
    );

    expect(screen.getByRole('button', { name: 'Donut' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Salary' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('heading', { name: 'Kawhi Leonard' })).toBeVisible();
  });

  it('reports a failed team-season without blanking the page', async () => {
    teamSeasonResponses.delete('BOS|2024-25');
    render(<SalaryExplorer index={index} initial={initialState()} />);

    fireEvent.change(controls().getByLabelText('Team'), { target: { value: 'BOS' } });

    await waitFor(() =>
      expect(screen.getByText(/Boston Celtics 2024-25 could not be loaded/)).toBeVisible(),
    );
    expect(chart().getByText('Kawhi Leonard')).toBeVisible();
    expect(screen.getByRole('button', { name: 'try again' })).toBeVisible();
  });
});

import Link from 'next/link';
import {
  SalaryExplorer,
  type SalaryExplorerInitialState,
  type ViewMode,
} from '@/components/salary/SalaryExplorer';
import { isSupabaseConfigured } from '@/lib/supabase';
import {
  getPlayerSalaryHistory,
  getSalaryIndex,
  getTeamSeasonSalaries,
  type PlayerSalaryRow,
  type SalaryIndex,
  type TeamSeasonSalaries,
} from '@/lib/salaries';
import { resolveSeason, resolveTeam, type SalaryMeasure } from '@/lib/salary-format';

export const metadata = {
  title: 'NBA Salary Cap Explorer | Jace Kasen',
  description:
    'Explore NBA salaries as a share of the salary cap, so contracts from 1985 and 2026 can be compared directly.',
};

export const dynamic = 'force-dynamic';

const PLAYER_ID_PATTERN = /^[a-z0-9]{3,24}$/;

type SalariesPageProps = {
  searchParams: Promise<{
    team?: string;
    season?: string;
    player?: string;
    view?: string;
    measure?: string;
  }>;
};

export default async function SalariesPage({ searchParams }: SalariesPageProps) {
  const params = await searchParams;

  if (!isSupabaseConfigured()) {
    return (
      <PageFrame>
        <SetupMessage />
      </PageFrame>
    );
  }

  let index: SalaryIndex;
  try {
    index = await getSalaryIndex();
  } catch {
    return (
      <PageFrame>
        <UnavailableMessage />
      </PageFrame>
    );
  }

  const season = resolveSeason(index, params.season);
  const team = resolveTeam(season, params.team);

  if (!season || !team) {
    return (
      <PageFrame>
        <UnavailableMessage />
      </PageFrame>
    );
  }

  const requestedPlayer = params.player?.trim().toLowerCase() ?? '';
  const playerId = PLAYER_ID_PATTERN.test(requestedPlayer) ? requestedPlayer : null;

  const [teamSeasonResult, playerHistory] = await Promise.all([
    loadTeamSeason(team, season.season),
    playerId ? loadPlayerHistory(playerId) : Promise.resolve(null),
  ]);

  const initial: SalaryExplorerInitialState = {
    season: season.season,
    team,
    view: params.view === 'donut' ? 'donut' : ('bars' satisfies ViewMode),
    measure: params.measure === 'salary' ? 'salary' : ('cap' satisfies SalaryMeasure),
    teamSeason: teamSeasonResult.data,
    teamSeasonError: teamSeasonResult.error,
    playerId: playerHistory?.length ? playerId : null,
    playerName: playerHistory?.[0]?.player_name ?? null,
    playerHistory,
  };

  return (
    <PageFrame>
      <SalaryExplorer index={index} initial={initial} />
    </PageFrame>
  );
}

async function loadTeamSeason(
  team: string,
  season: string,
): Promise<{ data: TeamSeasonSalaries | null; error: string | null }> {
  try {
    return { data: await getTeamSeasonSalaries(team, season), error: null };
  } catch {
    return { data: null, error: 'The salary database did not respond.' };
  }
}

async function loadPlayerHistory(playerId: string): Promise<PlayerSalaryRow[] | null> {
  try {
    return await getPlayerSalaryHistory(playerId);
  } catch {
    return null;
  }
}

function PageFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-12 pt-4 md:pt-8">
      <header className="max-w-4xl">
        <p className="text-accent mb-2 font-mono text-xs tracking-[0.16em] uppercase">
          Basketball Reference · 1984-85 onward
        </p>
        <h1 className="mb-3 font-mono text-4xl tracking-tight md:text-5xl">
          NBA Salary Cap Explorer
        </h1>
        <p className="text-muted max-w-3xl text-lg leading-8">
          A $3M contract in 1985 and a $50M contract today can be the same contract. Cap share —
          salary divided by that season&apos;s salary cap — is what makes them comparable.
        </p>
      </header>

      {children}

      <nav
        aria-label="Related NBA analysis"
        className="border-border flex flex-wrap gap-x-8 gap-y-3 border-t pt-6 font-mono text-sm"
      >
        <Link href="/projects/nba/performance-trends" className="text-accent hover:underline">
          follow one player&apos;s career →
        </Link>
        <Link href="/projects/nba/peak-performance" className="text-accent hover:underline">
          explore aggregate peak performance →
        </Link>
        <Link href="/projects/nba" className="text-accent hover:underline">
          all NBA analyses →
        </Link>
      </nav>
    </div>
  );
}

function SetupMessage() {
  return (
    <div className="border-border bg-accent-light/10 rounded border p-5">
      <h2 className="mb-2 font-mono text-lg">Salary data is not configured</h2>
      <p className="font-mono text-sm">
        Copy <code>.env.example</code> to <code>.env.local</code>, then add the project URL and
        publishable key from the Supabase Connect panel.
      </p>
    </div>
  );
}

function UnavailableMessage() {
  return (
    <div className="border-border rounded border p-5">
      <h2 className="mb-2 font-mono text-lg">Could not load the salary data</h2>
      <p className="text-muted">
        Check that <code>player_salaries</code>, <code>salary_caps</code>, and{' '}
        <code>team_season_salaries</code> exist and their public read policies are enabled.
      </p>
    </div>
  );
}

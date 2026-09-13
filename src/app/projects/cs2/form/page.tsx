import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Cs2FormMomentumChart } from '@/components/cs2/Cs2FormMomentumChart';
import { Cs2FormStats, Cs2FormVerdict } from '@/components/cs2/Cs2FormStatusMeter';
import { Cs2PlayerAutocomplete } from '@/components/cs2/Cs2PlayerAutocomplete';
import { Cs2RecentFormStrip } from '@/components/cs2/Cs2RecentFormStrip';
import { Cs2SubNav } from '@/components/cs2/Cs2SubNav';
import { Cs2TournamentFormTable } from '@/components/cs2/Cs2TournamentFormTable';
import { computeFormMetrics, fetchPlayerMapHistory } from '@/lib/cs2/trends';
import { isSupabaseConfigured } from '@/lib/supabase';

export const metadata: Metadata = {
  title: 'CS2 Form Tracker | Jace Kasen',
  description:
    "Compare a Counter-Strike 2 player's rolling 10-map rating with their own career average, map by map and event by event.",
};

type PageProps = {
  searchParams: Promise<{
    player?: string;
  }>;
};

const DEFAULT_PLAYER = 'donk';
const POPULAR_PLAYERS = [
  'donk',
  'ZywOo',
  'm0NESY',
  'NiKo',
  'ropz',
  'sh1ro',
  'molodoy',
  'frozen',
  'XANTARES',
  'Twistzz',
];
const FORM_WINDOW = 10;
const EVENT_LIMIT = 10;

const HEADER = {
  eyebrow: 'Counter-Strike 2 analysis · Form tracker',
  title: 'CS2 Form Tracker',
  description:
    'Is a player above or below their usual level? A rolling 10-map rating compared with their own career average.',
};

export default async function Cs2FormPage({ searchParams }: PageProps) {
  const { player: requestedPlayer } = await searchParams;
  const player = requestedPlayer?.trim() || DEFAULT_PLAYER;

  if (!isSupabaseConfigured()) {
    return (
      <div className="space-y-8">
        <PageHeader {...HEADER} />
        <div className="border-border bg-surface rounded-lg border p-6 text-center">
          <p className="text-muted font-mono text-sm">Database connection not configured.</p>
        </div>
      </div>
    );
  }

  const maps = await fetchPlayerMapHistory(player);
  const form = computeFormMetrics(maps, FORM_WINDOW);
  const playerName = form?.playerNick ?? player;

  return (
    <div className="space-y-10">
      <div className="space-y-6">
        <PageHeader {...HEADER} />

        <Cs2SubNav player={playerName} />

        <section
          aria-label="Choose a player"
          className="border-border bg-surface flex flex-col gap-3 rounded-lg border p-3 lg:flex-row lg:items-center lg:justify-between"
        >
          <form
            method="GET"
            action="/projects/cs2/form"
            className="flex shrink-0 items-center gap-2"
          >
            <label
              htmlFor="cs2-form-search"
              className="font-mono text-xs font-bold tracking-wide uppercase"
            >
              Player
            </label>
            <div className="min-w-0 flex-1 sm:w-64 sm:flex-none">
              <Cs2PlayerAutocomplete
                key={playerName}
                inputId="cs2-form-search"
                defaultValue={playerName}
              />
            </div>
            <button
              type="submit"
              className="bg-accent text-background h-11 shrink-0 rounded px-4 font-mono text-sm transition-opacity hover:opacity-90"
            >
              Inspect
            </button>
          </form>

          <nav aria-label="Popular players" className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="text-muted font-mono text-xs tracking-wide uppercase">Popular</span>
            <ul className="flex flex-wrap gap-1.5 font-mono text-xs">
              {POPULAR_PLAYERS.map((name) => {
                const isCurrent =
                  name.toLowerCase() === playerName.toLowerCase() ||
                  name.toLowerCase().replace(/0/g, 'o') ===
                    playerName.toLowerCase().replace(/0/g, 'o');

                return (
                  <li key={name}>
                    <Link
                      href={`/projects/cs2/form?player=${encodeURIComponent(name)}`}
                      aria-current={isCurrent ? 'page' : undefined}
                      className={`inline-block rounded-full border px-3 py-1 transition-colors ${
                        isCurrent
                          ? 'border-accent bg-accent text-background font-bold'
                          : 'border-border bg-background hover:border-accent hover:text-accent'
                      }`}
                    >
                      {name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </section>
      </div>

      {!form ? (
        <div className="border-border bg-surface rounded-lg border p-8 text-center">
          <p className="font-mono text-base font-bold">No maps found for &ldquo;{player}&rdquo;</p>
          <p className="text-muted mt-2 text-sm">
            Check the spelling of the player&apos;s HLTV nickname, or pick a popular player above.
          </p>
        </div>
      ) : (
        <>
          <section aria-labelledby="form-title">
            <SectionHeading id="form-title" eyebrow="01 · Form over time" title={playerName}>
              <Cs2FormVerdict form={form} />
            </SectionHeading>
            {/* From md up, size the chart so the whole card fits a laptop viewport: 556px is
                everything above the chart card plus a small margin. */}
            <Cs2FormMomentumChart
              points={form.momentumPoints}
              careerAvg={form.careerAvgRating}
              windowSize={FORM_WINDOW}
              heightClassName="h-[320px] md:h-[clamp(230px,calc(100svh_-_556px),460px)]"
            />
            <div className="mt-6">
              <Cs2FormStats form={form} totalMaps={maps.length} />
            </div>
          </section>

          <section aria-labelledby="recent-maps-title">
            <SectionHeading
              id="recent-maps-title"
              eyebrow={`02 · Last ${form.recentMaps.length} maps`}
              title="Map by map"
              description="Oldest on the left, most recent on the right. Select a map to see its full line."
            />
            <Cs2RecentFormStrip recentMaps={form.recentMaps} />
          </section>

          <section aria-labelledby="events-title">
            <SectionHeading
              id="events-title"
              eyebrow="03 · By event"
              title="Form by event"
              description={`Average rating at each of the last ${Math.min(EVENT_LIMIT, form.tournamentBreakdown.length)} events, compared with the career average.`}
            />
            <Cs2TournamentFormTable tournaments={form.tournamentBreakdown} limit={EVENT_LIMIT} />
          </section>
        </>
      )}
    </div>
  );
}

function SectionHeading({
  id,
  eyebrow,
  title,
  description,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-4">
      <p className="text-accent mb-1.5 font-mono text-xs tracking-[0.14em] uppercase">{eyebrow}</p>
      <h2 id={id} className="text-xl font-bold md:text-2xl">
        {title}
      </h2>
      {description && <p className="text-muted mt-1 max-w-3xl text-sm leading-6">{description}</p>}
      {children}
    </div>
  );
}

import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Cs2FormMomentumChart } from '@/components/cs2/Cs2FormMomentumChart';
import { Cs2FormStats, Cs2FormVerdict } from '@/components/cs2/Cs2FormStatusMeter';
import { Cs2RadarPlayerSearch } from '@/components/cs2/radar/Cs2RadarPlayerSearch';
import { Cs2RecentFormStrip } from '@/components/cs2/Cs2RecentFormStrip';
import { Cs2SubNav } from '@/components/cs2/Cs2SubNav';
import { Cs2TournamentFormTable } from '@/components/cs2/Cs2TournamentFormTable';
import { getRadarManifest } from '@/lib/cs2/manifest';
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

  const [manifest, maps] = await Promise.all([getRadarManifest(), fetchPlayerMapHistory(player)]);
  const form = computeFormMetrics(maps, FORM_WINDOW);
  const playerName = form?.playerNick ?? player;

  return (
    <div className="space-y-8">
      <div className="space-y-6">
        <PageHeader {...HEADER} />

        <Cs2SubNav player={playerName} />

        <Cs2RadarPlayerSearch
          manifest={manifest}
          selectedPlayer={playerName}
          basePath="/projects/cs2/form"
        />
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

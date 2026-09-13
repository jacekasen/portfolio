import { signedRating } from '@/lib/cs2/form-display';
import type { TournamentFormSummary } from '@/lib/cs2/trends';

// An event average from a handful of maps swings too much to read as form.
const SMALL_SAMPLE_MAPS = 5;

type Cs2TournamentFormTableProps = {
  tournaments: TournamentFormSummary[];
  limit: number;
};

export function Cs2TournamentFormTable({ tournaments, limit }: Cs2TournamentFormTableProps) {
  const events = tournaments.slice(0, limit);
  const hasSmallSamples = events.some((event) => event.mapsCount < SMALL_SAMPLE_MAPS);

  return (
    <div className="space-y-2">
      <div className="border-border bg-surface overflow-hidden rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left font-mono text-xs tabular-nums">
            <thead className="border-border bg-background text-muted border-b tracking-wide uppercase">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Event
                </th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">
                  Maps
                </th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">
                  Rating
                </th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">
                  vs career
                </th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">
                  ADR
                </th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">
                  K-D
                </th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {events.map((event) => {
                const isAbove = event.deltaVsCareer >= 0;

                return (
                  <tr
                    key={event.tournament}
                    className={`transition-colors hover:bg-black/5 ${
                      event.mapsCount < SMALL_SAMPLE_MAPS ? 'opacity-55' : ''
                    }`}
                  >
                    <th
                      scope="row"
                      title={event.tournament}
                      className="text-foreground max-w-[20rem] truncate px-4 py-3 text-left font-semibold"
                    >
                      {event.tournament}
                    </th>
                    <td className="text-muted px-4 py-3 text-right">{event.mapsCount}</td>
                    <td
                      className={`px-4 py-3 text-right font-bold ${
                        event.avgRating >= 1.15
                          ? 'text-emerald-800'
                          : event.avgRating >= 1
                            ? 'text-accent'
                            : 'text-rose-800'
                      }`}
                    >
                      {event.avgRating.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`inline-block rounded border px-2 py-0.5 font-bold ${
                          isAbove
                            ? 'border-emerald-300 bg-emerald-100 text-emerald-900'
                            : 'border-rose-300 bg-rose-100 text-rose-900'
                        }`}
                      >
                        {signedRating(event.deltaVsCareer)}
                      </span>
                    </td>
                    <td className="text-muted px-4 py-3 text-right">{event.adr.toFixed(1)}</td>
                    <td className="text-muted px-4 py-3 text-right">
                      {event.kills}-{event.deaths}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {hasSmallSamples && (
        <p className="text-muted text-xs">
          Faded rows are events with fewer than {SMALL_SAMPLE_MAPS} maps, too few to read much into.
        </p>
      )}
    </div>
  );
}

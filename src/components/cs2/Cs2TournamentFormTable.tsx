import { Trophy } from 'lucide-react';
import type { TournamentFormSummary } from '@/lib/cs2/trends';

type Cs2TournamentFormTableProps = {
  tournaments: TournamentFormSummary[];
};

export function Cs2TournamentFormTable({ tournaments }: Cs2TournamentFormTableProps) {
  const displayList = tournaments.slice(0, 10);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
          <Trophy size={15} className="text-accent" />
          <span>Tournament Event Form (Last {displayList.length} Events)</span>
        </h3>
        <span className="text-muted font-mono text-[11px]">Event Rating vs Career Standard</span>
      </div>

      <div className="border-border bg-surface overflow-hidden rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="border-border bg-background border-b text-muted text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 font-semibold">Tournament Event</th>
                <th className="px-4 py-3 font-semibold">Maps</th>
                <th className="px-4 py-3 font-semibold">Event Rating</th>
                <th className="px-4 py-3 font-semibold">Form Delta</th>
                <th className="px-4 py-3 font-semibold">ADR</th>
                <th className="px-4 py-3 font-semibold">K - D</th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {displayList.map((t) => {
                const isPos = t.deltaVsCareer >= 0;
                const sign = isPos ? `+${t.deltaVsCareer.toFixed(2)}` : t.deltaVsCareer.toFixed(2);

                return (
                  <tr key={t.tournament} className="hover:bg-black/5 transition-colors">
                    <td className="px-4 py-3 font-semibold text-foreground max-w-[200px] truncate">
                      {t.tournament}
                    </td>
                    <td className="px-4 py-3 text-muted">{t.mapsCount}</td>
                    <td className="px-4 py-3">
                      <span className={`font-bold ${t.avgRating >= 1.15 ? 'text-emerald-800' : t.avgRating >= 1.0 ? 'text-accent' : 'text-rose-800'}`}>
                        {t.avgRating.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold border ${
                          isPos ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-rose-100 text-rose-900 border-rose-300'
                        }`}
                      >
                        {sign}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted">{t.adr.toFixed(1)}</td>
                    <td className="px-4 py-3 text-muted">{t.kills} - {t.deaths}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Activity, LineChart } from 'lucide-react';

export function Cs2SubNav({ player }: { player?: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activePlayer = player || searchParams.get('player') || 'donk';

  const isForm = pathname.endsWith('/form');
  const isTrends = !isForm && pathname.includes('/cs2');

  const trendsHref = `/projects/cs2?player=${encodeURIComponent(activePlayer)}`;
  const formHref = `/projects/cs2/form?player=${encodeURIComponent(activePlayer)}`;

  return (
    <div className="border-border flex items-center gap-2 border-b pb-4 font-mono text-xs">
      <span className="text-muted mr-1 uppercase tracking-wider text-[11px]">Analysis:</span>
      <Link
        href={trendsHref}
        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-colors ${
          isTrends
            ? 'bg-accent text-background font-bold'
            : 'text-muted hover:text-foreground hover:bg-black/5'
        }`}
      >
        <LineChart size={14} />
        <span>Map-to-Map Trends</span>
      </Link>
      <Link
        href={formHref}
        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-colors ${
          isForm
            ? 'bg-accent text-background font-bold'
            : 'text-muted hover:text-foreground hover:bg-black/5'
        }`}
      >
        <Activity size={14} />
        <span>Form Tracker</span>
      </Link>
    </div>
  );
}

import {
  Activity,
  Flame,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';
import { FORM_THRESHOLDS, formVerdict, signedRating } from '@/lib/cs2/form-display';
import type { FormCategory, PlayerFormAnalysis } from '@/lib/cs2/trends';

const CATEGORY_STYLES: Record<
  FormCategory,
  { icon: LucideIcon; badge: string; iconClassName: string }
> = {
  surging: {
    icon: Flame,
    badge: 'border-emerald-400 bg-emerald-100 text-emerald-900',
    iconClassName: 'text-emerald-700',
  },
  in_form: {
    icon: TrendingUp,
    badge: 'border-emerald-300 bg-emerald-50 text-emerald-900',
    iconClassName: 'text-emerald-700',
  },
  stable: {
    icon: Activity,
    badge: 'border-border bg-surface text-foreground',
    iconClassName: 'text-muted',
  },
  cooling: {
    icon: TrendingDown,
    badge: 'border-amber-300 bg-amber-50 text-amber-900',
    iconClassName: 'text-amber-700',
  },
  slump: {
    icon: ShieldAlert,
    badge: 'border-rose-300 bg-rose-50 text-rose-900',
    iconClassName: 'text-rose-700',
  },
};

/** One-line verdict shown above the form chart. */
export function Cs2FormVerdict({ form }: { form: PlayerFormAnalysis }) {
  const style = CATEGORY_STYLES[form.formCategory];
  const Icon = style.icon;
  const verdict = formVerdict(form);

  return (
    <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-xs font-bold tracking-wide uppercase ${style.badge}`}
      >
        <Icon aria-hidden="true" size={14} className={style.iconClassName} />
        {verdict.title} {signedRating(form.formDelta)}
      </span>
      <span className="text-muted">{verdict.summary}</span>
    </p>
  );
}

export function Cs2FormStats({ form, totalMaps }: { form: PlayerFormAnalysis; totalMaps: number }) {
  const recentCount = form.recentMaps.length;
  const bestMap = form.recentMaps.reduce<PlayerFormAnalysis['recentMaps'][number] | null>(
    (best, map) => (!best || map.rating > best.rating ? map : best),
    null,
  );

  return (
    <div className="space-y-3">
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Career average"
          value={form.careerAvgRating.toFixed(2)}
          detail={`Across ${totalMaps} maps`}
        />
        <Stat
          label="Impact maps"
          value={`${form.impactRate}%`}
          detail={`Of the last ${recentCount} rated 1.15 or higher`}
        />
        <Stat
          label="Current streak"
          value={`${form.currentStreak.count} ${form.currentStreak.count === 1 ? 'map' : 'maps'}`}
          detail={
            form.currentStreak.isPositive
              ? 'In a row rated 1.00 or higher'
              : 'In a row rated below 1.00'
          }
        />
        {bestMap && (
          <Stat
            label={`Best of last ${recentCount}`}
            value={bestMap.rating.toFixed(2)}
            detail={`${bestMap.mapName} vs ${bestMap.opponent}`}
          />
        )}
      </dl>

      <p className="text-muted text-xs leading-5">
        The verdict comes from the gap between the last 10 maps and the career average: within{' '}
        {FORM_THRESHOLDS.inForm.toFixed(2)} is at career level, {FORM_THRESHOLDS.inForm.toFixed(2)}{' '}
        or more is in form or cooling off, and {FORM_THRESHOLDS.surging.toFixed(2)} or more is
        surging or slumping.
      </p>
    </div>
  );
}

function Stat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="border-border bg-surface min-w-0 rounded-lg border p-4">
      <dt className="text-muted font-mono text-xs tracking-wide uppercase">{label}</dt>
      <dd className="text-foreground mt-1 font-mono text-2xl font-bold">{value}</dd>
      <dd className="text-muted mt-0.5 truncate text-xs" title={detail}>
        {detail}
      </dd>
    </div>
  );
}

export function Cs2FormStatusMeter({
  form,
  totalMaps,
}: {
  form: PlayerFormAnalysis;
  totalMaps: number;
}) {
  return (
    <div className="space-y-4">
      <Cs2FormVerdict form={form} />
      <Cs2FormStats form={form} totalMaps={totalMaps} />
    </div>
  );
}

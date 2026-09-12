'use client';

import { Activity, Flame, ShieldAlert, Sparkles, TrendingDown, TrendingUp } from 'lucide-react';
import type { PlayerFormAnalysis } from '@/lib/cs2/trends';

export function Cs2FormStatusMeter({ form }: { form: PlayerFormAnalysis }) {
  const isPositiveDelta = form.formDelta > 0;
  const deltaSign = isPositiveDelta ? `+${form.formDelta.toFixed(2)}` : form.formDelta.toFixed(2);

  const getBadgeStyle = () => {
    switch (form.formCategory) {
      case 'surging':
        return {
          container: 'bg-amber-100/70 border-amber-300 text-amber-950',
          icon: Flame,
          iconColor: 'text-amber-700',
          tag: 'SURGING / PEAK FORM',
          desc: 'Playing significantly above personal career baseline. Top-tier fragging and high impact.',
        };
      case 'in_form':
        return {
          container: 'bg-emerald-100/70 border-emerald-300 text-emerald-950',
          icon: TrendingUp,
          iconColor: 'text-emerald-700',
          tag: 'IN FORM',
          desc: 'Consistent positive rating momentum across recent series.',
        };
      case 'cooling':
        return {
          container: 'bg-orange-100/70 border-orange-300 text-orange-950',
          icon: TrendingDown,
          iconColor: 'text-orange-700',
          tag: 'COOLING OFF',
          desc: 'Recent output is running slightly behind normal career averages.',
        };
      case 'slump':
        return {
          container: 'bg-rose-100/70 border-rose-300 text-rose-950',
          icon: ShieldAlert,
          iconColor: 'text-rose-700',
          tag: 'SLUMPING',
          desc: 'Significant dip below career standards over the past 10 maps.',
        };
      default:
        return {
          container: 'bg-surface border-border text-foreground',
          icon: Activity,
          iconColor: 'text-muted',
          tag: 'AT BASELINE',
          desc: 'Performing right at established career average.',
        };
    }
  };

  const badge = getBadgeStyle();
  const BadgeIcon = badge.icon;

  return (
    <div className="space-y-4">
      {/* Top Banner Verdict */}
      <div className={`border rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${badge.container}`}>
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-md bg-white/60 shadow-xs shrink-0">
            <BadgeIcon size={24} className={badge.iconColor} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold tracking-wider">{badge.tag}</span>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-white/80 border border-black/10 font-bold text-foreground">
                {deltaSign} vs Career
              </span>
            </div>
            <p className="text-xs text-foreground/80 mt-1">{badge.desc}</p>
          </div>
        </div>

        <div className="font-mono text-xs flex sm:flex-col items-baseline sm:items-end justify-between border-t sm:border-t-0 border-black/10 pt-3 sm:pt-0">
          <span className="text-foreground/75 font-semibold">Current 10-Map Rating:</span>
          <span className="text-2xl font-bold text-foreground">{form.currentFormRating.toFixed(2)}</span>
        </div>
      </div>

      {/* 4 Supporting Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="border-border bg-surface rounded-lg border p-3.5">
          <span className="text-muted block font-mono text-[11px] uppercase">Career Baseline</span>
          <span className="font-mono text-2xl font-bold text-foreground mt-1 block">
            {form.careerAvgRating.toFixed(2)}
          </span>
          <span className="text-muted text-[10px] block mt-0.5">All-time MVP CS2 events</span>
        </div>

        <div className="border-border bg-surface rounded-lg border p-3.5">
          <span className="text-muted block font-mono text-[11px] uppercase">Form Momentum</span>
          <span
            className={`font-mono text-2xl font-bold mt-1 block ${
              isPositiveDelta ? 'text-emerald-800' : 'text-rose-800'
            }`}
          >
            {deltaSign}
          </span>
          <span className="text-muted text-[10px] block mt-0.5">Net delta per map</span>
        </div>

        <div className="border-border bg-surface rounded-lg border p-3.5">
          <span className="text-muted block font-mono text-[11px] uppercase">Impact Map Rate</span>
          <span className="font-mono text-2xl font-bold text-sky-900 mt-1 block">
            {form.impactRate}%
          </span>
          <span className="text-muted text-[10px] block mt-0.5">Last 20 with Rating &ge; 1.15</span>
        </div>

        <div className="border-border bg-surface rounded-lg border p-3.5">
          <span className="text-muted block font-mono text-[11px] uppercase">Active Streak</span>
          <span className="font-mono text-2xl font-bold text-amber-900 mt-1 truncate block">
            {form.currentStreak.count} Maps
          </span>
          <span className="text-muted text-[10px] block mt-0.5 truncate" title={form.currentStreak.description}>
            {form.currentStreak.description}
          </span>
        </div>
      </div>
    </div>
  );
}

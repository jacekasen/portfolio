export type PlayerPrediction = {
  player_id: string;
  player_name: string;
  season: string;
  age: number | null;
  current_bpm: number | null;
  trajectory: 'improving' | 'stable' | 'regressing';
  improving_probability: number;
  stable_probability: number;
  regressing_probability: number;
  peak_probability: number | null;
  predicted_bpm_delta: number | null;
  prediction_factors: string[] | null;
  model_version: string;
  updated_at: string;
};

export type ObservedPredictionOutcome = {
  season: string;
  bpmDelta: number;
  trajectory: PlayerPrediction['trajectory'];
};

const TRAJECTORIES = [
  { key: 'improving_probability', label: 'Improving', color: 'bg-[#3f795c]' },
  { key: 'stable_probability', label: 'Stable', color: 'bg-accent-light' },
  { key: 'regressing_probability', label: 'Regressing', color: 'bg-[#a55d4b]' },
] as const;

const TRAJECTORY_LABELS = {
  improving: 'Improving',
  stable: 'Stable',
  regressing: 'Regressing',
} as const;

export function PlayerPredictionCard({
  prediction,
  observedOutcome,
}: {
  prediction: PlayerPrediction;
  observedOutcome?: ObservedPredictionOutcome;
}) {
  const leadingProbability = prediction[`${prediction.trajectory}_probability`];
  const factors = Array.isArray(prediction.prediction_factors) ? prediction.prediction_factors : [];
  const sourceSeason = previousSeasonLabel(prediction.season);

  return (
    <section aria-labelledby="outlook-title">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-accent mb-2 font-mono text-xs tracking-[0.14em] uppercase">
            02 · Model forecast · {observedOutcome ? 'observed outcome available' : 'next season'}
          </p>
          <h2 id="outlook-title" className="font-mono text-2xl">
            Forecast for {prediction.season}
          </h2>
        </div>
        <span className="border-border bg-surface rounded-full border px-3 py-1 font-mono text-xs">
          Model v{prediction.model_version}
        </span>
      </div>

      <div className="border-border bg-surface overflow-hidden rounded-lg border">
        <div className="grid gap-8 p-5 md:p-7 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="text-muted font-mono text-xs tracking-wide uppercase">
              Most likely trajectory
            </p>
            <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <p className="font-mono text-3xl tracking-tight md:text-4xl">
                {TRAJECTORY_LABELS[prediction.trajectory]}
              </p>
              <p className="text-muted font-mono text-sm">
                {formatPercent(leadingProbability)} probability
              </p>
            </div>

            <div className="mt-7 space-y-4" aria-label="Trajectory probabilities">
              {TRAJECTORIES.map(({ key, label, color }) => {
                const probability = prediction[key];
                return (
                  <div key={key}>
                    <div className="mb-1.5 flex justify-between gap-3 font-mono text-xs">
                      <span>{label}</span>
                      <span>{formatPercent(probability)}</span>
                    </div>
                    <div className="bg-border h-2 overflow-hidden rounded-full">
                      <div
                        className={`h-full rounded-full ${color}`}
                        style={{ width: `${clampProbability(probability) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid content-start gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <PredictionStat
              label="Near career peak"
              value={
                prediction.peak_probability === null
                  ? 'Not available'
                  : formatPercent(prediction.peak_probability)
              }
              detail="Probability current performance is within 0.5 BPM of the eventual smoothed peak."
            />
            <PredictionStat
              label="Projected BPM change"
              value={
                prediction.predicted_bpm_delta === null
                  ? 'Not available'
                  : formatSigned(prediction.predicted_bpm_delta)
              }
              detail={
                observedOutcome
                  ? `Expected change entering the ${observedOutcome.season} season.`
                  : `Expected change from ${sourceSeason} to ${prediction.season}.`
              }
            />
            {observedOutcome && (
              <PredictionStat
                label={`Observed change · ${observedOutcome.season}`}
                value={formatSigned(observedOutcome.bpmDelta)}
                detail={`${TRAJECTORY_LABELS[observedOutcome.trajectory]} was the observed trajectory.`}
              />
            )}
          </div>
        </div>

        {factors.length > 0 && (
          <div className="border-border border-t px-5 py-5 md:px-7">
            <h3 className="mb-3 font-mono text-sm">What informed this estimate</h3>
            <ul className="grid gap-x-8 gap-y-2 md:grid-cols-2">
              {factors.map((factor) => (
                <li key={factor} className="text-muted flex gap-2 text-sm leading-6">
                  <span className="text-accent" aria-hidden="true">
                    •
                  </span>
                  <span>{factor}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="border-border bg-background/45 border-t px-5 py-4 md:px-7">
          <p className="text-muted text-xs leading-5">
            The model uses only information available through {sourceSeason}. It was evaluated with
            chronological season splits to reduce look-ahead leakage. Estimates are probabilities,
            not guarantees.
            {observedOutcome
              ? ` Since ${observedOutcome.season} is now available, its result is shown for an honest out-of-sample comparison.`
              : ' For completed careers, this is a hypothetical next-season projection.'}
          </p>
        </div>
      </div>
    </section>
  );
}

export function PlayerPredictionUnavailable() {
  return (
    <section aria-labelledby="outlook-title">
      <h2 id="outlook-title" className="mb-4 font-mono text-2xl">
        Model outlook
      </h2>
      <div className="border-border bg-surface rounded-lg border p-5">
        <p className="text-muted text-sm">
          An ML estimate is not available for this player. Predictions require active players with at least 3 seasons of data and a minimum of 500 career minutes played.
        </p>
      </div>
    </section>
  );
}

function PredictionStat({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="border-border bg-background rounded border p-4">
      <p className="text-muted font-mono text-xs tracking-wide uppercase">{label}</p>
      <p className="mt-2 font-mono text-3xl">{value}</p>
      <p className="text-muted mt-2 text-xs leading-5">{detail}</p>
    </article>
  );
}

function clampProbability(value: number) {
  return Math.min(1, Math.max(0, value));
}

function formatPercent(value: number) {
  return `${Math.round(clampProbability(value) * 100)}%`;
}

function formatSigned(value: number) {
  return new Intl.NumberFormat('en-US', {
    signDisplay: 'always',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

function previousSeasonLabel(season: string) {
  const start = Number.parseInt(season.slice(0, 4), 10);
  if (!Number.isFinite(start)) return 'the prior season';

  const previousStart = start - 1;
  const previousEnd = String(start).slice(-2);
  return `${previousStart}-${previousEnd}`;
}

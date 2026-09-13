import {
  bpmProjection,
  directionsDisagree,
  forecastHeadline,
  formatBpm,
  formatProbability,
  formatSignedNumber,
  parsePredictionFactors,
  previousSeasonLabel,
  type FactorSignal,
  type PlayerPrediction,
} from '@/lib/nba/forecast';

const TRAJECTORIES = [
  {
    trajectory: 'improving',
    key: 'improving_probability',
    label: 'Improving',
    color: 'bg-[#3f795c]',
  },
  { trajectory: 'stable', key: 'stable_probability', label: 'Stable', color: 'bg-accent-light' },
  {
    trajectory: 'regressing',
    key: 'regressing_probability',
    label: 'Regressing',
    color: 'bg-[#a55d4b]',
  },
] as const;

const DIRECTION_ARROWS = {
  up: { symbol: '↑', className: 'text-[#3f795c]' },
  down: { symbol: '↓', className: 'text-[#a55d4b]' },
  flat: { symbol: '→', className: 'text-muted' },
} as const;

const UPDATED_DATE = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

export function PlayerPredictionCard({
  prediction,
  forecastSeasonInData,
}: {
  prediction: PlayerPrediction;
  /** The forecast season is already in the data, so the player had no qualified season in it. */
  forecastSeasonInData: boolean;
}) {
  const sourceSeason = previousSeasonLabel(prediction.season);
  const projection = bpmProjection(prediction);
  const { signals, noQualifiedSeasonChance } = parsePredictionFactors(
    prediction.prediction_factors,
  );

  return (
    <section aria-labelledby="outlook-title">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-accent mb-2 font-mono text-xs tracking-[0.14em] uppercase">
            02 · Model forecast · {forecastSeasonInData ? 'past season' : 'next season'}
          </p>
          <h2 id="outlook-title" className="scroll-mt-24 text-2xl font-bold">
            Forecast for {prediction.season}
          </h2>
        </div>
        <span className="border-border bg-surface rounded-full border px-3 py-1 font-mono text-xs">
          Model v{prediction.model_version} · Updated{' '}
          {UPDATED_DATE.format(new Date(prediction.updated_at))}
        </span>
      </div>

      <div className="border-border bg-surface overflow-hidden rounded-lg border">
        {forecastSeasonInData && (
          <p className="border-border bg-background/45 border-b px-5 py-4 text-sm leading-6 md:px-7">
            <span className="font-bold">No {prediction.season} result to check.</span>{' '}
            {prediction.player_name} has no qualified {prediction.season} season in the data, so
            this forecast can&apos;t be compared with an observed BPM change.
          </p>
        )}

        <div className="space-y-6 p-5 md:p-7">
          <div>
            <p className="text-muted font-mono text-xs tracking-wide uppercase">Outlook</p>
            <p className="mt-2 text-2xl leading-tight font-bold md:text-3xl">
              {forecastHeadline(prediction)}
            </p>
            {directionsDisagree(prediction) && (
              <p className="text-muted mt-3 text-sm leading-6">
                The outcome chances and the BPM projection are separate estimates, and for{' '}
                {prediction.player_name} they point in different directions.
              </p>
            )}
            <ProbabilityBar prediction={prediction} />
          </div>

          <div className="grid gap-3 sm:grid-cols-[repeat(auto-fit,minmax(13rem,1fr))]">
            <PredictionStat
              label="Projected BPM"
              value={
                projection
                  ? `${formatBpm(projection.current)} → ${formatBpm(projection.projected)}`
                  : 'Not available'
              }
              detail={
                projection
                  ? `${formatSignedNumber(projection.change)} from ${sourceSeason} to ${prediction.season}.`
                  : `No BPM projection for ${prediction.season}.`
              }
            />
            <PredictionStat
              label="Near career peak"
              value={
                prediction.peak_probability === null
                  ? 'Not available'
                  : formatProbability(prediction.peak_probability)
              }
              detail="Chance current performance is within 0.5 BPM of the eventual smoothed peak."
            />
            {noQualifiedSeasonChance !== null && (
              <PredictionStat
                label="No qualified season"
                value={formatProbability(noQualifiedSeasonChance)}
                detail={`Estimated chance of not logging a qualified ${prediction.season} season.`}
              />
            )}
          </div>
        </div>

        {signals.length > 0 && (
          <div className="border-border border-t px-5 py-5 md:px-7">
            <h3 className="mb-3 text-sm font-bold">What informed this estimate</h3>
            <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {signals.map((signal) => (
                <FactorItem key={signal.text} signal={signal} />
              ))}
            </dl>
          </div>
        )}

        <div className="border-border bg-background/45 border-t px-5 py-4 md:px-7">
          <p className="text-muted text-xs leading-5">
            The model uses only information available through {sourceSeason}. It was evaluated with
            chronological season splits to reduce look-ahead leakage. Estimates are probabilities,
            not guarantees.
          </p>
        </div>
      </div>
    </section>
  );
}

export function PlayerPredictionUnavailable() {
  return (
    <section aria-labelledby="outlook-title">
      <h2 id="outlook-title" className="mb-4 text-2xl font-bold">
        Model outlook
      </h2>
      <div className="border-border bg-surface rounded-lg border p-5">
        <p className="text-muted text-sm">
          An ML estimate is not available for this player. Predictions require active players with
          at least 3 seasons of data and a minimum of 500 career minutes played.
        </p>
      </div>
    </section>
  );
}

function ProbabilityBar({ prediction }: { prediction: PlayerPrediction }) {
  const description = TRAJECTORIES.map(
    ({ key, label }) => `${label} ${formatProbability(prediction[key])}`,
  ).join(', ');

  return (
    <div className="mt-6">
      <div
        role="img"
        aria-label={`Chance of each outcome: ${description}`}
        className="bg-border flex h-3 gap-0.5 overflow-hidden rounded-full"
      >
        {TRAJECTORIES.map(({ key, color }) => (
          <div
            key={key}
            className={color}
            style={{ width: `${Math.min(1, Math.max(0, prediction[key])) * 100}%` }}
          />
        ))}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 font-mono text-xs">
        {TRAJECTORIES.map(({ trajectory, key, label, color }) => (
          <li
            key={key}
            className={`flex items-center gap-2 ${
              trajectory === prediction.trajectory ? 'text-foreground font-bold' : 'text-muted'
            }`}
          >
            <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${color}`} />
            {label} {formatProbability(prediction[key])}
          </li>
        ))}
      </ul>
    </div>
  );
}

function FactorItem({ signal }: { signal: FactorSignal }) {
  if (!signal.label) {
    return (
      <div className="sm:col-span-2 lg:col-span-3">
        <dt className="sr-only">Factor</dt>
        <dd className="text-muted text-sm leading-6">{signal.text}</dd>
      </div>
    );
  }

  const arrow = signal.direction ? DIRECTION_ARROWS[signal.direction] : null;

  return (
    <div className="border-border bg-background rounded border px-3 py-2.5">
      <dt className="text-muted font-mono text-xs tracking-wide uppercase">{signal.label}</dt>
      <dd className="mt-1 flex items-baseline gap-1.5 font-mono text-lg">
        {arrow && (
          <span aria-hidden="true" className={arrow.className}>
            {arrow.symbol}
          </span>
        )}
        {signal.value}
      </dd>
    </div>
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

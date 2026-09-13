export type Trajectory = 'improving' | 'stable' | 'regressing';

export type PlayerPrediction = {
  player_id: string;
  player_name: string;
  season: string;
  age: number | null;
  current_bpm: number | null;
  trajectory: Trajectory;
  improving_probability: number;
  stable_probability: number;
  regressing_probability: number;
  peak_probability: number | null;
  predicted_bpm_delta: number | null;
  prediction_factors: string[] | null;
  model_version: string;
  updated_at: string;
};

export type FactorDirection = 'up' | 'down' | 'flat';

export type FactorSignal = {
  text: string;
  label: string | null;
  value: string | null;
  direction: FactorDirection | null;
};

const TRAJECTORIES: Trajectory[] = ['improving', 'stable', 'regressing'];

const OUTCOMES: Record<Trajectory, string> = {
  improving: 'improvement',
  stable: 'holding steady',
  regressing: 'a decline',
};

// Most forecasts lead with under 50%, so the headline says how decisive the lead is.
const CLOSE_CALL_MARGIN = 0.08;
const LIKELY_PROBABILITY = 0.6;

export function formatProbability(value: number) {
  const percent = Math.round(Math.min(1, Math.max(0, value)) * 100);
  if (percent === 0) return '<1%';
  if (percent === 100 && value < 1) return '>99%';
  return `${percent}%`;
}

export function formatSignedNumber(value: number, digits = 1) {
  return new Intl.NumberFormat('en-US', {
    signDisplay: 'exceptZero',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export function formatBpm(value: number) {
  return value.toFixed(1);
}

export function previousSeasonLabel(season: string) {
  const start = Number.parseInt(season.slice(0, 4), 10);
  if (!Number.isFinite(start)) return 'the prior season';

  return `${start - 1}-${String(start).slice(-2)}`;
}

export function forecastHeadline(prediction: PlayerPrediction) {
  const leading = prediction[`${prediction.trajectory}_probability`];
  const runnerUp = Math.max(
    ...TRAJECTORIES.filter((trajectory) => trajectory !== prediction.trajectory).map(
      (trajectory) => prediction[`${trajectory}_probability`],
    ),
  );
  const outcome = OUTCOMES[prediction.trajectory];

  if (leading - runnerUp < CLOSE_CALL_MARGIN) {
    return `Too close to call, with ${outcome} slightly ahead.`;
  }
  if (leading >= LIKELY_PROBABILITY) {
    return `${outcome[0].toUpperCase()}${outcome.slice(1)} is likely.`;
  }
  return `Leans toward ${outcome}.`;
}

/** BPM values rounded the way they are shown, so "3.5 → 1.9 (-1.6)" always adds up. */
export function bpmProjection(prediction: PlayerPrediction) {
  if (prediction.current_bpm === null || prediction.predicted_bpm_delta === null) return null;

  const current = roundTenth(prediction.current_bpm);
  const change = roundTenth(prediction.predicted_bpm_delta);
  return { current, change, projected: roundTenth(current + change) };
}

/**
 * The outcome chances and the BPM projection are separate model outputs. For about one in five
 * players the most likely outcome and the sign of the projected change disagree.
 */
export function directionsDisagree(prediction: PlayerPrediction) {
  const projection = bpmProjection(prediction);
  if (!projection) return false;

  return (
    (prediction.trajectory === 'improving' && projection.change < 0) ||
    (prediction.trajectory === 'regressing' && projection.change > 0)
  );
}

export function forecastSummary(prediction: PlayerPrediction) {
  const probability = prediction[`${prediction.trajectory}_probability`];
  const chance = `${formatProbability(probability)} chance of ${OUTCOMES[prediction.trajectory]}`;
  const projection = bpmProjection(prediction);

  return projection
    ? `${formatBpm(projection.current)} → ${formatBpm(projection.projected)} BPM · ${chance}`
    : chance;
}

type FactorPattern = {
  pattern: RegExp;
  label: string;
  toNumber?: (value: number) => number;
  format: (value: number) => string;
  direction: (value: number) => FactorDirection | null;
};

const byDirection = (value: number): FactorDirection =>
  value > 0 ? 'up' : value < 0 ? 'down' : 'flat';
const noDirection = () => null;

// The pipeline writes factors as sentences from a fixed set of templates.
const FACTOR_PATTERNS: FactorPattern[] = [
  {
    pattern: /^BPM rose by ([+-]?\d+(?:\.\d+)?) last qualified season\.$/,
    label: 'BPM change last season',
    toNumber: (value) => Math.abs(value),
    format: (value) => formatSignedNumber(value),
    direction: byDirection,
  },
  {
    pattern: /^BPM fell by ([+-]?\d+(?:\.\d+)?) last qualified season\.$/,
    label: 'BPM change last season',
    toNumber: (value) => -Math.abs(value),
    format: (value) => formatSignedNumber(value),
    direction: byDirection,
  },
  {
    pattern: /^BPM was stable last season \(([+-]?\d+(?:\.\d+)?)\)\.$/,
    label: 'BPM change last season',
    format: (value) => formatSignedNumber(value),
    direction: () => 'flat',
  },
  {
    pattern: /^Three-season BPM slope is ([+-]?\d+(?:\.\d+)?) per season\.$/,
    label: 'Three-season BPM trend',
    format: (value) => `${formatSignedNumber(value, 2)} / season`,
    direction: byDirection,
  },
  {
    pattern: /^Minutes changed by ([+-]?\d+(?:\.\d+)?)% vs prior season\.$/,
    label: 'Minutes vs prior season',
    format: (value) => `${formatSignedNumber(value, 0)}%`,
    direction: byDirection,
  },
  {
    pattern: /^Current BPM is ([+-]?\d+(?:\.\d+)?) below career high through this season\.$/,
    label: 'Below career-high BPM',
    format: (value) => value.toFixed(1),
    direction: noDirection,
  },
  {
    pattern: /^Player age is (\d+)\.$/,
    label: 'Age',
    format: (value) => String(value),
    direction: noDirection,
  },
];

const NO_QUALIFIED_SEASON_PATTERN =
  /^Estimated (\d+(?:\.\d+)?)% chance of not logging a qualified season next year\.$/;

export function parsePredictionFactors(factors: string[] | null) {
  const signals: FactorSignal[] = [];
  let noQualifiedSeasonChance: number | null = null;

  for (const text of factors ?? []) {
    const risk = text.match(NO_QUALIFIED_SEASON_PATTERN);
    if (risk) {
      noQualifiedSeasonChance = Number(risk[1]) / 100;
      continue;
    }

    signals.push(parseFactor(text));
  }

  return { signals, noQualifiedSeasonChance };
}

function parseFactor(text: string): FactorSignal {
  for (const factor of FACTOR_PATTERNS) {
    const match = text.match(factor.pattern);
    if (!match) continue;

    const parsed = Number(match[1]);
    const value = factor.toNumber ? factor.toNumber(parsed) : parsed;
    return {
      text,
      label: factor.label,
      value: factor.format(value),
      direction: factor.direction(value),
    };
  }

  return { text, label: null, value: null, direction: null };
}

function roundTenth(value: number) {
  // Round half away from zero to match Intl.NumberFormat; `+ 0` turns -0 into 0.
  return (Math.sign(value) * Math.round(Math.abs(value) * 10)) / 10 + 0;
}

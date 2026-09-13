import type { FormCategory, PlayerFormAnalysis } from './trends';

export type RatingTierId = 'excellent' | 'strong' | 'solid' | 'below' | 'poor';

export type RatingTier = {
  id: RatingTierId;
  label: string;
  range: string;
  min: number;
};

// Ordered best to worst: a rating belongs to the first tier whose minimum it reaches.
export const RATING_TIERS: RatingTier[] = [
  { id: 'excellent', label: 'Excellent', range: '1.40+', min: 1.4 },
  { id: 'strong', label: 'Strong', range: '1.15–1.39', min: 1.15 },
  { id: 'solid', label: 'Solid', range: '1.00–1.14', min: 1 },
  { id: 'below', label: 'Below par', range: '0.85–0.99', min: 0.85 },
  { id: 'poor', label: 'Poor', range: 'under 0.85', min: Number.NEGATIVE_INFINITY },
];

export function ratingTier(rating: number): RatingTier {
  return RATING_TIERS.find((tier) => rating >= tier.min) ?? RATING_TIERS[RATING_TIERS.length - 1];
}

/** Mirrors the category cut-offs in computeFormMetrics. */
export const FORM_THRESHOLDS = { inForm: 0.03, surging: 0.1 } as const;

const VERDICT_TITLES: Record<FormCategory, string> = {
  surging: 'Surging',
  in_form: 'In form',
  stable: 'At career level',
  cooling: 'Cooling off',
  slump: 'Slumping',
};

export function signedRating(value: number) {
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}`;
}

export function formVerdict({
  formCategory,
  formDelta,
  currentFormRating,
  careerAvgRating,
}: Pick<
  PlayerFormAnalysis,
  'formCategory' | 'formDelta' | 'currentFormRating' | 'careerAvgRating'
>) {
  const gap = Math.abs(formDelta).toFixed(2);
  const comparison = formDelta > 0 ? `${gap} above` : formDelta < 0 ? `${gap} below` : 'level with';

  return {
    title: VERDICT_TITLES[formCategory],
    summary: `Last 10 maps average ${currentFormRating.toFixed(2)}, ${comparison} the ${careerAvgRating.toFixed(2)} career average.`,
  };
}

/** Each calendar year in a chronological series, with the index of its first and last point. */
export function yearSpans(points: { matchDate: string }[]) {
  const spans: { year: string; start: number; end: number }[] = [];

  points.forEach((point, index) => {
    const year = point.matchDate.slice(0, 4);
    if (!/^\d{4}$/.test(year)) return;

    const current = spans.at(-1);
    if (current?.year === year) current.end = index;
    else spans.push({ year, start: index, end: index });
  });

  return spans;
}

/** Indexes of the highest and lowest point, keeping the earliest on ties. */
export function formExtremes(points: { deltaVsCareer: number }[]) {
  if (points.length === 0) return null;

  let peak = 0;
  let low = 0;
  points.forEach((point, index) => {
    if (point.deltaVsCareer > points[peak].deltaVsCareer) peak = index;
    if (point.deltaVsCareer < points[low].deltaVsCareer) low = index;
  });

  return { peak, low };
}

/**
 * Headline numbers for the CS2 dataset, shown across the CS2 project pages and the
 * project cards. This is the only place they should be written down.
 *
 * After ingesting new tournaments:
 *   1. Regenerate `public/data/cs2/radar/manifest.json` with the pipeline.
 *   2. Update `tournaments` (row count of `cs2_events` in Supabase).
 *   3. Copy `matchCount` and `eventCount` from the new manifest into `matches` and
 *      `combatEvents`. `dataset.test.ts` fails until these match the manifest.
 *   4. Update the storage sizes if the pipeline reports new totals.
 */
export const CS2_DATASET = {
  /** Tier-1 events in `cs2_events`. */
  tournaments: 67,
  /** Parsed matches (`matchCount` in the radar manifest). */
  matches: 1_831,
  /** Positioned kill events (`eventCount` in the radar manifest). */
  combatEvents: 604_236,
  /** Raw demo files downloaded, in GB. */
  rawReplayGb: 380,
  /** Partitioned Parquet datastore, in MB. */
  parquetMb: 472,
} as const;

/** Rounds down to the nearest thousand for "600,000+"-style copy. */
function roundedDown(value: number) {
  return `${(Math.floor(value / 1000) * 1000).toLocaleString('en-US')}+`;
}

export const cs2Copy = {
  tournaments: CS2_DATASET.tournaments.toLocaleString('en-US'),
  matches: CS2_DATASET.matches.toLocaleString('en-US'),
  combatEvents: roundedDown(CS2_DATASET.combatEvents),
  rawReplaySize: `>${CS2_DATASET.rawReplayGb} GB`,
  parquetSize: `${CS2_DATASET.parquetMb} MB`,
  storageReduction: `>${Math.floor((1 - CS2_DATASET.parquetMb / (CS2_DATASET.rawReplayGb * 1024)) * 1000) / 10}%`,
} as const;

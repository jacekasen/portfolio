type SeasonWithPlayer = {
  player_url: string;
  year_id: string;
};

export type PlayerCareer<T extends SeasonWithPlayer> = {
  playerId: string;
  seasons: T[];
};

/** Makes LIKE wildcards literal. PostgREST also treats `*` as `%`. */
export function escapeLikePattern(value: string) {
  return value.replace(/[\\%_*]/g, '\\$&');
}

export function playerIdFromUrl(url: string) {
  return url.match(/\/players\/[a-z]\/([^/]+)\.html$/)?.[1] ?? url;
}

/**
 * Display names are not unique (two Eddie Johnsons overlapped from 1981–86), so careers are
 * keyed by Basketball Reference player ID and listed in the order they began.
 */
export function groupCareersByPlayer<T extends SeasonWithPlayer>(seasons: T[]): PlayerCareer<T>[] {
  const careers = new Map<string, T[]>();
  for (const season of seasons) {
    const playerId = playerIdFromUrl(season.player_url);
    const career = careers.get(playerId);
    if (career) career.push(season);
    else careers.set(playerId, [season]);
  }

  return Array.from(careers, ([playerId, careerSeasons]) => ({
    playerId,
    seasons: careerSeasons,
  })).sort((a, b) => firstSeason(a).localeCompare(firstSeason(b)));
}

/** Uses the requested player when present, otherwise the longest career. */
export function selectCareer<T extends SeasonWithPlayer>(
  careers: PlayerCareer<T>[],
  requestedId?: string,
): PlayerCareer<T> | undefined {
  return (
    careers.find((career) => career.playerId === requestedId) ??
    careers.reduce<PlayerCareer<T> | undefined>(
      (longest, career) =>
        !longest || career.seasons.length > longest.seasons.length ? career : longest,
      undefined,
    )
  );
}

function firstSeason({ seasons }: PlayerCareer<SeasonWithPlayer>) {
  return seasons.reduce(
    (earliest, season) => (season.year_id < earliest ? season.year_id : earliest),
    seasons[0].year_id,
  );
}

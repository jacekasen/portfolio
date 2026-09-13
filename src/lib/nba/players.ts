type SeasonWithPlayer = {
  player_url: string;
  year_id: string;
};

export type PlayerCareer<T extends SeasonWithPlayer> = {
  playerId: string;
  seasons: T[];
};

export type PlayerNameEntry = {
  name: string;
  key: string;
};

// Letters that NFD does not split into a base letter plus an accent.
const FOLDED_LETTERS: Record<string, string> = {
  ı: 'i',
  ð: 'd',
  đ: 'd',
  ł: 'l',
  ø: 'o',
  æ: 'ae',
  ß: 'ss',
  е: 'e', // Cyrillic е, stored in "Egor Dёmin"
};
const FOLDED_LETTER_PATTERN = new RegExp(`[${Object.keys(FOLDED_LETTERS).join('')}]`, 'g');

/** Case- and accent-insensitive search key, so "jokic" matches "Nikola Jokić". */
export function playerSearchKey(name: string) {
  return name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(FOLDED_LETTER_PATTERN, (letter) => FOLDED_LETTERS[letter])
    .replace(/\s+/g, ' ')
    .trim();
}

export function findPlayerNames(players: PlayerNameEntry[], requestedName: string) {
  const key = playerSearchKey(requestedName);
  return players.filter((player) => player.key === key).map((player) => player.name);
}

export function suggestPlayerNames(players: PlayerNameEntry[], query: string, limit: number) {
  const key = playerSearchKey(query);
  if (!key) return [];

  return players
    .filter((player) => player.key.includes(key))
    .sort((a, b) => {
      const aStartsWith = a.key.startsWith(key);
      const bStartsWith = b.key.startsWith(key);
      if (aStartsWith !== bStartsWith) return aStartsWith ? -1 : 1;
      return a.name.localeCompare(b.name);
    })
    .slice(0, limit)
    .map((player) => player.name);
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

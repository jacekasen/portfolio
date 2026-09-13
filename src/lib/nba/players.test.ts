import { describe, expect, it } from 'vitest';
import {
  findPlayerNames,
  groupCareersByPlayer,
  playerIdFromUrl,
  playerSearchKey,
  selectCareer,
  suggestPlayerNames,
} from './players';

const urlFor = (playerId: string) =>
  `https://www.basketball-reference.com/players/${playerId[0]}/${playerId}.html`;
const season = (playerId: string, year_id: string) => ({ player_url: urlFor(playerId), year_id });

describe('playerSearchKey', () => {
  it('ignores case, accents and extra spaces', () => {
    expect(playerSearchKey('Nikola Jokić')).toBe('nikola jokic');
    expect(playerSearchKey('  nikola   JOKIC ')).toBe('nikola jokic');
    expect(playerSearchKey('Dāvis Bertāns')).toBe('davis bertans');
  });

  it('folds letters that Unicode does not decompose', () => {
    expect(playerSearchKey('Ömer Aşık')).toBe('omer asik');
    expect(playerSearchKey('Pétur Guðmundsson')).toBe('petur gudmundsson');
    // The stored name uses a Cyrillic ё.
    expect(playerSearchKey('Egor Dёmin')).toBe('egor demin');
  });
});

describe('player name search', () => {
  const players = [
    'Nikola Jokić',
    'Nikola Vučević',
    'LeBron James',
    "Shaquille O'Neal",
    "Jermaine O'Neal",
  ].map((name) => ({ name, key: playerSearchKey(name) }));

  it('resolves a typed name to its stored spelling', () => {
    expect(findPlayerNames(players, 'nikola jokic')).toEqual(['Nikola Jokić']);
    expect(findPlayerNames(players, 'LeBron James')).toEqual(['LeBron James']);
    expect(findPlayerNames(players, 'Nikola')).toEqual([]);
    expect(findPlayerNames(players, '%')).toEqual([]);
  });

  it('suggests accent-insensitive matches with prefix matches first', () => {
    expect(suggestPlayerNames(players, 'jokic', 8)).toEqual(['Nikola Jokić']);
    expect(suggestPlayerNames(players, "o'ne", 8)).toEqual(["Jermaine O'Neal", "Shaquille O'Neal"]);
    expect(suggestPlayerNames(players, 'ni', 8)).toEqual(['Nikola Jokić', 'Nikola Vučević']);
    expect(suggestPlayerNames(players, 'ni', 1)).toEqual(['Nikola Jokić']);
  });
});

describe('playerIdFromUrl', () => {
  it('reads the Basketball Reference player ID', () => {
    expect(playerIdFromUrl(urlFor('johnsed03'))).toBe('johnsed03');
  });

  it('falls back to the full value for an unexpected URL', () => {
    expect(playerIdFromUrl('not-a-player-url')).toBe('not-a-player-url');
  });
});

describe('player careers', () => {
  const eddieJohnsons = [
    season('johnsed03', '1981-82'),
    season('johnsed02', '1977-78'),
    season('johnsed03', '1982-83'),
    season('johnsed02', '1978-79'),
    season('johnsed03', '1983-84'),
  ];

  it('separates players who share a name and lists careers by first season', () => {
    const careers = groupCareersByPlayer(eddieJohnsons);

    expect(careers.map((career) => career.playerId)).toEqual(['johnsed02', 'johnsed03']);
    expect(careers[1].seasons.map((row) => row.year_id)).toEqual(['1981-82', '1982-83', '1983-84']);
  });

  it('selects the requested player, otherwise the longest career', () => {
    const careers = groupCareersByPlayer(eddieJohnsons);

    expect(selectCareer(careers, 'johnsed02')?.playerId).toBe('johnsed02');
    expect(selectCareer(careers)?.playerId).toBe('johnsed03');
    expect(selectCareer(careers, 'jamesle01')?.playerId).toBe('johnsed03');
    expect(selectCareer([])).toBeUndefined();
  });
});

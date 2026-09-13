import { describe, expect, it } from 'vitest';
import { escapeLikePattern, groupCareersByPlayer, playerIdFromUrl, selectCareer } from './players';

const urlFor = (playerId: string) =>
  `https://www.basketball-reference.com/players/${playerId[0]}/${playerId}.html`;
const season = (playerId: string, year_id: string) => ({ player_url: urlFor(playerId), year_id });

describe('escapeLikePattern', () => {
  it('makes LIKE and PostgREST wildcards literal', () => {
    expect(escapeLikePattern('%')).toBe('\\%');
    expect(escapeLikePattern('_ebron James')).toBe('\\_ebron James');
    expect(escapeLikePattern('Kevin *')).toBe('Kevin \\*');
    expect(escapeLikePattern('a\\b')).toBe('a\\\\b');
  });

  it('leaves real player names unchanged', () => {
    expect(escapeLikePattern("Shaquille O'Neal")).toBe("Shaquille O'Neal");
    expect(escapeLikePattern('J.R. Smith')).toBe('J.R. Smith');
    expect(escapeLikePattern('Nikola Jokić')).toBe('Nikola Jokić');
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

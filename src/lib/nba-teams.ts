/**
 * Basketball Reference franchise abbreviations used by the salary pipeline.
 * The salary tables only store abbreviations, so the UI resolves them here.
 */
const TEAM_NAMES: Record<string, string> = {
  ATL: 'Atlanta Hawks',
  BOS: 'Boston Celtics',
  BRK: 'Brooklyn Nets',
  CHA: 'Charlotte Bobcats',
  CHH: 'Charlotte Hornets (1988–2002)',
  CHI: 'Chicago Bulls',
  CHO: 'Charlotte Hornets',
  CLE: 'Cleveland Cavaliers',
  DAL: 'Dallas Mavericks',
  DEN: 'Denver Nuggets',
  DET: 'Detroit Pistons',
  GSW: 'Golden State Warriors',
  HOU: 'Houston Rockets',
  IND: 'Indiana Pacers',
  KCK: 'Kansas City Kings',
  LAC: 'Los Angeles Clippers',
  LAL: 'Los Angeles Lakers',
  MEM: 'Memphis Grizzlies',
  MIA: 'Miami Heat',
  MIL: 'Milwaukee Bucks',
  MIN: 'Minnesota Timberwolves',
  NJN: 'New Jersey Nets',
  NOH: 'New Orleans Hornets',
  NOK: 'New Orleans/Oklahoma City Hornets',
  NOP: 'New Orleans Pelicans',
  NYK: 'New York Knicks',
  OKC: 'Oklahoma City Thunder',
  ORL: 'Orlando Magic',
  PHI: 'Philadelphia 76ers',
  PHO: 'Phoenix Suns',
  POR: 'Portland Trail Blazers',
  SAC: 'Sacramento Kings',
  SAS: 'San Antonio Spurs',
  SDC: 'San Diego Clippers',
  SEA: 'Seattle SuperSonics',
  TOR: 'Toronto Raptors',
  UTA: 'Utah Jazz',
  VAN: 'Vancouver Grizzlies',
  WAS: 'Washington Wizards',
  WSB: 'Washington Bullets',
  // Basketball Reference uses XYZ where a salary row has no resolvable team link.
  XYZ: 'Unidentified team',
};

/** Full franchise name for an abbreviation, falling back to the abbreviation itself. */
export function teamName(abbreviation: string) {
  return TEAM_NAMES[abbreviation] ?? abbreviation;
}

/** Full name plus abbreviation, for selectors and headings. */
export function teamLabel(abbreviation: string) {
  const name = TEAM_NAMES[abbreviation];
  return name ? `${name} (${abbreviation})` : abbreviation;
}

export function isKnownTeam(abbreviation: string) {
  return abbreviation in TEAM_NAMES;
}

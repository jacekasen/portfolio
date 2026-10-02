export type PlayerGameLog = {
  player_id: number;
  player_name: string;
  season: string;
  game_id: string;
  game_date: string;
  team_abbreviation: string;
  opponent_abbreviation: string | null;
  is_home: boolean;
  team_game_number: number;
  player_season_game_number: number;
  win_loss: string | null;
  minutes: number;
  plus_minus: number;
  points: number;
  rebounds: number;
  assists: number;
  rolling_pm_5: number | null;
  rolling_pm_10: number | null;
  rolling_pm_15: number | null;
  is_trade_transition: boolean;
};

export const TRAJECTORY_SEASONS = Array.from({ length: 30 }, (_, i) => {
  const start = 2025 - i;
  return `${start}-${String(start + 1).slice(-2)}`;
});

export function resolveTrajectorySeason(value: string | undefined): string {
  return value && TRAJECTORY_SEASONS.includes(value) ? value : TRAJECTORY_SEASONS[0];
}

export function rollingValue(game: PlayerGameLog, window: 5 | 10 | 15): number | null {
  if (window === 5) return game.rolling_pm_5;
  if (window === 15) return game.rolling_pm_15;
  return game.rolling_pm_10;
}

export function formatSigned(value: number, digits = 0): string {
  return `${value > 0 ? '+' : ''}${value.toFixed(digits)}`;
}

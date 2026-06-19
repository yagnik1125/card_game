export enum Suit {
  SPADES = "SPADES",
  HEARTS = "HEARTS",
  DIAMONDS = "DIAMONDS",
  CLUBS = "CLUBS",
}

export enum Rank {
  TWO = 2,
  THREE,
  FOUR,
  FIVE,
  SIX,
  SEVEN,
  EIGHT,
  NINE,
  TEN,
  JACK,
  QUEEN,
  KING,
  ACE,
}

export enum GamePhase {
  WAITING = "WAITING",
  ROUND_START = "ROUND_START",
  PLAYER_TURN = "PLAYER_TURN",
  TRICK_END = "TRICK_END",
  ROUND_END = "ROUND_END",
  MATCH_END = "MATCH_END",
}

export enum GameMode {
  SOLO = "SOLO",
  TEAMS_2V2 = "TEAMS_2V2"
}
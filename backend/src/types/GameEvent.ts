export type GameEvent =
    | CardPlayedEvent
    | BotPlayedEvent
    | TrickCompletedEvent
    | RoundCompletedEvent
    | MatchCompletedEvent
    | TurnChangedEvent
    | TrumpDeclaredEvent
    | RoundStartedEvent;

export interface CardPlayedEvent {
    type: "CARD_PLAYED";
    playerId: string;
    cardId: string;
    suit: string;
    rank: number;
}

export interface BotPlayedEvent {
    type: "BOT_PLAY";
    playerId: string;
    cardId: string;
    suit: string;
    rank: number;
}

export interface TrickCompletedEvent {
    type: "TRICK_COMPLETED";
    trickNumber: number;
    playerId: string | null;
    trickWinner: TrickWinner;
    trickWinnerTeam?: TrickWinnerTeam;
}

export interface RoundCompletedEvent {
    type: "ROUND_COMPLETED";
    roundNumber: number;
    playerId: string | null;
    trickWinner?: TrickWinner;
    trickWinnerTeam?: TrickWinnerTeam;
    roundWinner?: RoundWinner;
    roundWinnerTeam?: RoundWinnerTeam;
}

export interface MatchCompletedEvent {
    type: "MATCH_COMPLETED";
    winner?: string;
    winnerTeam?: string;
    playerId?: string;
    trickWinner?: TrickWinner;
    trickWinnerTeam?: TrickWinnerTeam;
    roundWinner?: RoundWinner;
    roundWinnerTeam?: RoundWinnerTeam;
}

export interface TurnChangedEvent {
    type: "TURN_CHANGED";
    currentPlayerId: string;
    turnNumber: number;
}

export interface TrumpDeclaredEvent {
    type: "TRUMP_DECLARED";
    playerId: string;
    suit: string | null;
}

export interface RoundStartedEvent {
    type: "ROUND_STARTED";
    roundNumber: number;
    championPlayerId: string | null;
    championTeamId: string | null;
}

export interface TrickWinner {
    id: string;
    name: string;
    tricksWonThisRound: number;
}

export interface RoundWinner {
    id: string;
    name: string;
    players: TrickWinner[];
}

export interface TrickWinnerTeam {
    id: string;
    name: string;
    tricksWonThisRound: number;
    totalTricksWon: number;
    roundsWon: number;
}

export interface RoundWinnerTeam {
    id: string;
    name: string;
    teams: TrickWinnerTeam[];
}

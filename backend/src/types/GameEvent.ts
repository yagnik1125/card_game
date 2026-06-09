export type GameEvent =
    | CardPlayedEvent
    | BotPlayedEvent
    | TrickCompletedEvent
    | RoundCompletedEvent
    | MatchCompletedEvent
    | TurnChangedEvent
    | TrumpDeclaredEvent;

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
    playerId: string | null;
    trickWinner: TrickWinner;
}

export interface RoundCompletedEvent {
    type: "ROUND_COMPLETED";
    roundNumber: number;
    playerId: string | null;
    trickWinner: TrickWinner;
    roundWinner: RoundWinner;
}

export interface MatchCompletedEvent {
    type: "MATCH_COMPLETED";
    winner?: string;
    playerId?: string;
    trickWinner: TrickWinner;
    roundWinner: RoundWinner;
}

export interface TurnChangedEvent {
    type: "TURN_CHANGED";
    currentPlayerId: string;
}

export interface TrumpDeclaredEvent {
    type: "TRUMP_DECLARED";
    playerId: string;
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
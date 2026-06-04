export type GameEvent =
    | CardPlayedEvent
    | BotPlayedEvent
    | TrickCompletedEvent
    | RoundCompletedEvent
    | MatchCompletedEvent
    | TurnChangedEvent;

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
}

export interface RoundCompletedEvent {
    type: "ROUND_COMPLETED";
    roundNumber: number;
}

export interface MatchCompletedEvent {
    type: "MATCH_COMPLETED";
    winner?: string;
}

export interface TurnChangedEvent {
    type: "TURN_CHANGED";
    currentPlayerId: string;
}
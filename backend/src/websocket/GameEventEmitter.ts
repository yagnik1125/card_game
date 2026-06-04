import { GameGateway } from "./GameGateway";

export enum SocketEvents {
    CARD_PLAYED = "CARD_PLAYED",
    TURN_CHANGED = "TURN_CHANGED",
    TRICK_COMPLETED = "TRICK_COMPLETED",
    ROUND_COMPLETED = "ROUND_COMPLETED",
    MATCH_COMPLETED = "MATCH_COMPLETED"
}

export class GameEventEmitter {
    static cardPlayed(
        gameId: string,
        payload: any
    ) {
        GameGateway.emitToGame(gameId, SocketEvents.CARD_PLAYED, payload);
    }

    static turnChanged(
        gameId: string,
        payload: any
    ) {
        GameGateway.emitToGame(gameId, SocketEvents.TURN_CHANGED, payload);
    }

    static trickCompleted(
        gameId: string,
        payload: any
    ) {
        GameGateway.emitToGame(gameId, SocketEvents.TRICK_COMPLETED, payload);
    }

    static roundCompleted(
        gameId: string,
        payload: any
    ) {
        GameGateway.emitToGame(gameId, SocketEvents.ROUND_COMPLETED, payload);
    }

    static matchCompleted(
        gameId: string,
        payload: any
    ) {
        GameGateway.emitToGame(gameId, SocketEvents.MATCH_COMPLETED, payload);
    }
}
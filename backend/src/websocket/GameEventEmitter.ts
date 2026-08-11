import { GameService } from "../services/GameService.js";
import { GameGateway } from "./GameGateway.js";
import { ServerEnvelope, ServerEventName } from "./protocol/serverEvents.js";
import type {
    BotPlayedPayload,
    CardPlayedPayload,
    GameCreatedPayload,
    GameErrorPayload,
    GameRemovedPayload,
    GameStatePayload,
    MatchCompletedPayload,
    RoundCompletedPayload,
    RoundStartedPayload,
    TrickCompletedPayload,
    TrumpDeclaredPayload,
    TurnChangedPayload,
} from "./protocol/serverEvents.js";

export enum SocketEvents {
    GAME_CREATED = "GAME_CREATED",
    ROUND_STARTED = "ROUND_STARTED",
    CARD_PLAYED = "CARD_PLAYED",
    BOT_PLAY = "BOT_PLAY",
    TURN_CHANGED = "TURN_CHANGED",
    TRUMP_DECLARED = "TRUMP_DECLARED",
    TRICK_COMPLETED = "TRICK_COMPLETED",
    ROUND_COMPLETED = "ROUND_COMPLETED",
    MATCH_COMPLETED = "MATCH_COMPLETED",
    GAME_STATE = "GAME_STATE",
    GAME_REMOVED = "GAME_REMOVED",
    GAME_ERROR = "GAME_ERROR",
}

export class GameEventEmitter {
    private static emit(
        gameId: string,
        type: ServerEventName,
        payload: unknown,
        snapshot?: unknown
    ): void {
        const envelope: ServerEnvelope = {
            type,
            payload,
            snapshot,
            timestamp: Date.now(),
        };
        GameGateway.emitToGame(gameId, type, envelope);
    }

    static gameCreated(gameId: string): void {
        const payload: GameCreatedPayload = { gameId };
        this.emit(gameId, SocketEvents.GAME_CREATED, payload);
    }

    static gameRemoved(gameId: string): void {
        const payload: GameRemovedPayload = { gameId };
        this.emit(gameId, SocketEvents.GAME_REMOVED, payload);
    }

    static gameState(gameId: string): void {
        if (!GameGateway.hasSocketServer() || !GameGateway.hasRoomMembers(gameId)) {
            return;
        }
        const payload: GameStatePayload = { gameId };
        this.emit(
            gameId,
            SocketEvents.GAME_STATE,
            payload,
            GameService.getView(gameId)
        );
    }

    static roundStarted(gameId: string, payload: RoundStartedPayload): void {
        this.emit(gameId, SocketEvents.ROUND_STARTED, payload);
    }

    static cardPlayed(
        gameId: string,
        payload: CardPlayedPayload
    ): void {
        this.emit(gameId, SocketEvents.CARD_PLAYED, payload);
    }

    static botPlayed(
        gameId: string,
        payload: BotPlayedPayload
    ): void {
        this.emit(gameId, SocketEvents.BOT_PLAY, payload);
    }

    static turnChanged(
        gameId: string,
        payload: TurnChangedPayload
    ): void {
        this.emit(gameId, SocketEvents.TURN_CHANGED, payload);
    }

    static trumpDeclared(
        gameId: string,
        payload: TrumpDeclaredPayload
    ): void {
        this.emit(gameId, SocketEvents.TRUMP_DECLARED, payload);
    }

    static trickCompleted(
        gameId: string,
        payload: TrickCompletedPayload
    ): void {
        if (!GameGateway.hasSocketServer() || !GameGateway.hasRoomMembers(gameId)) {
            return;
        }
        this.emit(gameId, SocketEvents.TRICK_COMPLETED, payload, GameService.getView(gameId));
    }

    static roundCompleted(
        gameId: string,
        payload: RoundCompletedPayload
    ): void {
        if (!GameGateway.hasSocketServer() || !GameGateway.hasRoomMembers(gameId)) {
            return;
        }
        this.emit(gameId, SocketEvents.ROUND_COMPLETED, payload, GameService.getView(gameId));
    }

    static matchCompleted(
        gameId: string,
        payload: MatchCompletedPayload
    ): void {
        if (!GameGateway.hasSocketServer() || !GameGateway.hasRoomMembers(gameId)) {
            return;
        }
        this.emit(gameId, SocketEvents.MATCH_COMPLETED, payload, GameService.getView(gameId));
    }

    static gameError(
        gameId: string,
        payload: GameErrorPayload
    ): void {
        this.emit(gameId, SocketEvents.GAME_ERROR, payload);
    }

    static broadcastState(gameId: string): void {
        if (!GameGateway.hasSocketServer() || !GameGateway.hasRoomMembers(gameId)) {
            return;
        }
        this.emit(gameId, SocketEvents.GAME_STATE, { gameId }, GameService.getView(gameId));
    }

    static stateSync(gameId: string): void {
        this.broadcastState(gameId);
    }
}

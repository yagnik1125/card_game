import {
    BotService,
    Card,
    GameSession,
    GameSessionManager,
    LegalMoveGenerator,
    PlayCardService,
    Player
} from "../../game-engine/src/index.js";

import { InFlightGuard } from "./InFlightGuard.js";
import { wsLog, wsError } from "../websocket/wsLogger.js";

export interface TurnStateSnapshot {
    currentPlayerId: string;
    turnNumber: number;
}

export class BotScheduler {
    static delayMs(): number {
        const raw = process.env.BOT_DELAY_MS;
        const parsed: number = raw === undefined || raw === "" ? NaN : Number(raw);
        return Number.isFinite(parsed) && parsed >= 0 ? parsed : 1000;
    }

    static trickDelayMs(): number {
        const raw = process.env.BOT_DELAY_MS;
        const parsed: number = raw === undefined || raw === "" ? NaN : Number(raw);
        if (Number.isFinite(parsed) && parsed >= 0) {
            return parsed;
        }
        return 2200;
    }

    static trumpDelayMs(): number {
        const raw = process.env.BOT_DELAY_MS;
        const parsed: number = raw === undefined || raw === "" ? NaN : Number(raw);
        if (Number.isFinite(parsed) && parsed >= 0) {
            return parsed;
        }
        return 2800;
    }

    static roundDelayMs(): number {
        const raw = process.env.BOT_DELAY_MS;
        const parsed: number = raw === undefined || raw === "" ? NaN : Number(raw);
        if (Number.isFinite(parsed) && parsed >= 0) {
            return parsed;
        }
        return 5200;
    }

    static executeNextBot(
        gameId: string,
        expectedTurn?: TurnStateSnapshot
    ): void {
        try {
            this.runBotTurn(gameId, expectedTurn);
        } catch {
            InFlightGuard.release(gameId);
        }
    }

    private static runBotTurn(
        gameId: string,
        expectedTurn?: TurnStateSnapshot
    ): void {
        let session: GameSession;
        try {
            session = GameSessionManager.get(gameId);
        } catch {
            InFlightGuard.release(gameId);
            return;
        }
        if (!session.gameState || session.gameState.completed) {
            InFlightGuard.release(gameId);
            return;
        }
        const turnState = session.gameState.turnState;
        if (
            expectedTurn &&
            (turnState.currentPlayerId !== expectedTurn.currentPlayerId ||
                turnState.turnNumber !== expectedTurn.turnNumber)
        ) {
            InFlightGuard.release(gameId);
            return;
        }
        const player: Player | undefined = session.match.players.find((p: any) => p.id === turnState.currentPlayerId);
        if (!player || !player.isBot) {
            InFlightGuard.release(gameId);
            return;
        }
        const legalCards: Card[] = LegalMoveGenerator.getLegalCards(player, session.gameState!.currentTrick);
        if (legalCards.length === 0) {
            InFlightGuard.release(gameId);
            return;
        }
        const trumpBefore = session.gameState.currentRound.state.trumpSuit;
        const roundBefore = session.gameState.currentRound.state.roundNumber;

        let card: Card;
        try {
            const decision = BotService.chooseCard(
                player,
                legalCards,
                session.gameState!.currentTrick,
                session.gameState!.currentRound.state,
                session.match.mode,
                session.match.players
            );
            if (!decision.card) {
                InFlightGuard.release(gameId);
                return;
            }
            card = decision.card;
            PlayCardService.playCard(gameId, player.id, card);
            wsLog(
                `bot played game=${gameId} player=${player.id} card=${card.id} (${card.rank} ${card.suit}) trick=${session.gameState?.currentTrick.trickNumber} turn=${session.gameState?.turnState.turnNumber}`
            );
        } catch (error) {
            InFlightGuard.release(gameId);
            wsError(
                `bot play failed game=${gameId} player=${player?.id ?? "?"}`,
                error
            );
            return;
        }
        const updated: GameSession = GameSessionManager.get(gameId);
        const nextTurn: TurnStateSnapshot = {
            currentPlayerId: updated.gameState!.turnState.currentPlayerId,
            turnNumber: updated.gameState!.turnState.turnNumber
        };
        const nextPlayer: Player | undefined = updated.match.players.find(
            (p: any) => p.id === nextTurn.currentPlayerId
        );
        if (updated.gameState!.completed || !nextPlayer || !nextPlayer.isBot) {
            InFlightGuard.release(gameId);
            if (updated.gameState!.completed) {
                wsLog(`bot chain done game=${gameId} match completed`);
            } else {
                wsLog(
                    `bot chain done game=${gameId} waiting for player=${nextTurn.currentPlayerId} (trick=${updated.gameState?.currentTrick.trickNumber} turn=${nextTurn.turnNumber})`
                );
            }
            return;
        }
        const trumpAfter = updated.gameState?.currentRound.state.trumpSuit ?? null;
        const roundAfter = updated.gameState?.currentRound.state.roundNumber ?? roundBefore;
        const trumpDeclared = !trumpBefore && trumpAfter !== null;
        const roundCompleted = roundAfter > roundBefore || updated.gameState?.completed;
        const trickCompleted = updated.gameState?.currentTrick.plays.length === 0;

        let delay = this.delayMs();
        if (roundCompleted) {
            delay = this.roundDelayMs();
        } else if (trumpDeclared) {
            delay = this.trumpDelayMs();
        } else if (trickCompleted) {
            delay = this.trickDelayMs();
        }
        wsLog(
            `bot chain game=${gameId} next=${nextTurn.currentPlayerId} in ${delay}ms`
        );
        setTimeout(() => this.executeNextBot(gameId, nextTurn), delay);
    }
}

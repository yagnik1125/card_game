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
        } catch {
            InFlightGuard.release(gameId);
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
            return;
        }
        setTimeout(() => this.executeNextBot(gameId, nextTurn), this.delayMs());
    }
}

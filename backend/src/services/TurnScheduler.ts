import {
    Card,
    EventBuilder,
    GameMode,
    GameSession,
    GameSessionManager,
    LegalMoveGenerator,
    PlayCardService,
    Player,
    Suit
} from "../../game-engine/src/index.js";

import { BotScheduler } from "./BotScheduler.js";
import { GameService } from "./GameService.js";
import { InFlightGuard } from "./InFlightGuard.js";
import { GameEvent } from "../types/GameEvent.js";
import { wsLog, wsGameLog } from "../websocket/wsLogger.js";

export interface PlayerPlayResult {
    events: GameEvent[];
    snapshot: unknown;
}

export class TurnScheduler {
    static playerPlay(
        gameId: string,
        playerId: string,
        cardId: string
    ): PlayerPlayResult {
        const session: GameSession = GameSessionManager.get(gameId);
        if (!session.gameState) {
            throw new Error("Game not initialized");
        }
        const player: Player | undefined = session.match.players.find((p: any) => p.id === playerId);
        if (!player) {
            throw new Error("Player not found");
        }
        const legalCards: Card[] = LegalMoveGenerator.getLegalCards(player, session.gameState.currentTrick);
        if (!legalCards.some(c => c.id === cardId)) {
            throw new Error("Illegal move");
        }
        const card: Card | undefined = player.hand.find(c => c.id === cardId);
        if (!card) {
            throw new Error("Card not found");
        }

        const trickBefore = session.gameState.currentTrick;
        const roundBefore = session.gameState.currentRound;
        const matchBefore: boolean = session.gameState.completed;
        const playerStatsBefore = session.match.players.map(p => ({
            playerId: p.id,
            tricksWonThisRound: p.stats.tricksWonThisRound,
            totalTricksWon: p.stats.totalTricksWon,
            cardsPlayed: p.stats.cardsPlayed
        }));
        let teamStatsBefore;
        if (session.match.mode === GameMode.TEAMS_2V2) {
            teamStatsBefore = session.match.teams.map(t => ({
                id: t.id,
                name: t.name,
                tricksWonThisRound: t.tricksWonThisRound,
                totalTricksWon: t.totalTricksWon,
                roundsWon: t.roundsWon
            }));
        }
        const trumpSuitBefore: Suit | null = session.gameState.currentRound.state.trumpSuit;

        PlayCardService.playCard(gameId, playerId, card);
        const afterHuman: GameSession = GameSessionManager.get(gameId);

        wsGameLog(gameId, `human played player=${playerId} card=${card.id} (${card.rank} ${card.suit}) trick=${afterHuman.gameState?.currentTrick.trickNumber} turn=${afterHuman.gameState?.turnState.turnNumber} currentPlayerId=${afterHuman.gameState?.turnState.currentPlayerId}`);

        const events: GameEvent[] = EventBuilder.buildMoveEvents(
            afterHuman,
            playerId,
            card,
            false,
            {
                trickBefore,
                roundBefore,
                matchBefore,
                trumpBefore: trumpSuitBefore,
                playerStatsBefore,
                teamStatsBefore
            }
        );
        wsGameLog(gameId, `events built count=${events.length} types=${events.map(e => e.type).join(",")}`);
        const snapshot: unknown = GameService.getView(gameId);

        const nextTurn = {
            currentPlayerId: afterHuman.gameState!.turnState.currentPlayerId,
            turnNumber: afterHuman.gameState!.turnState.turnNumber
        };
        const nextPlayer = afterHuman.match.players.find(p => p.id === nextTurn.currentPlayerId);
        if (nextPlayer && nextPlayer.isBot && !afterHuman.gameState!.completed) {
            const trumpAfter = afterHuman.gameState?.currentRound.state.trumpSuit ?? null;
            const roundNumberAfter = afterHuman.gameState?.currentRound.state.roundNumber ?? roundBefore.state.roundNumber;
            const trumpDeclared = !trumpSuitBefore && trumpAfter !== null;
            const roundCompleted = roundNumberAfter > roundBefore.state.roundNumber || afterHuman.gameState?.completed;
            const trickCompleted = afterHuman.gameState?.currentTrick.plays.length === 0;

            let delay = BotScheduler.delayMs();
            if (roundCompleted) {
                delay = BotScheduler.roundDelayMs();
            } else if (trumpDeclared) {
                delay = BotScheduler.trumpDelayMs();
            } else if (trickCompleted) {
                delay = BotScheduler.trickDelayMs();
            }
            wsGameLog(gameId, `scheduling next bot=${nextPlayer.id} for game=${gameId} in ${delay}ms`);
            setTimeout(() => BotScheduler.executeNextBot(gameId, nextTurn), delay);
        } else {
            InFlightGuard.release(gameId);
        }

        return { events, snapshot };
    }
}

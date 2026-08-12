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
import { GameEvent } from "../types/GameEvent.js";

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
        const snapshot: unknown = GameService.getView(gameId);

        BotScheduler.executeNextBot(gameId);

        return { events, snapshot };
    }
}

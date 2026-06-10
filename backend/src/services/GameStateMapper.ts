import { GameSession, GameState } from "../../game-engine/src/index.js";
import { GameStateResponse } from "../types/GameStateResponse.js";

export class GameStateMapper {
    static map(session: GameSession): GameStateResponse {
        const state: GameState = session.gameState!;
        return {
            gameId: session.gameId,
            completed: state.completed,
            currentPlayerId: state.turnState.currentPlayerId,
            turnNumber: state.turnState.turnNumber,
            roundNumber: state.currentRound.state.roundNumber,
            trumpSuit: state.currentRound.state.trumpSuit,
            players: session.match.players.map((player: any) => ({
                id: player.id,
                name: player.name,
                cardsRemaining: player.hand.length,
                tricksWon: player.stats.tricksWonThisRound,
            })),
            currentTrick: {
                trickNumber: state.currentTrick.trickNumber,
                leadSuit: state.currentTrick.leadSuit,
                plays: state.currentTrick.plays.map((play: any) => ({
                    playerId: play.playerId,
                    cardId: play.card.id,
                }))
            }
        };
    }
}
import { GameSession } from "trump-and-twist-game-engine";
import { GameStateResponse } from "../types/GameStateResponse";

export class GameStateMapper {
    static map(session: GameSession): GameStateResponse {
        const state = session.gameState!;
        return {
            gameId: session.gameId,
            completed: state.completed,
            currentPlayerId: state.turnState.currentPlayerId,
            turnNumber: state.turnState.turnNumber,
            roundNumber: state.currentRound.state.roundNumber,
            trumpSuit: state.currentRound.state.trumpSuit,
            players: session.match.players.map(player => ({
                id: player.id,
                name: player.name,
                cardsRemaining: player.hand.length,
                tricksWon: player.stats.tricksWonThisRound,
            })),
            currentTrick: {
                trickNumber: state.currentTrick.trickNumber,
                leadSuit: state.currentTrick.leadSuit,
                plays: state.currentTrick.plays.map(play => ({
                    playerId: play.playerId,
                    cardId: play.card.id,
                }))
            }
        };
    }
}
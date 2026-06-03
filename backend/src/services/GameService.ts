import {
    GameBootstrapService,
    GameSessionManager,
    LegalMoveGenerator,
    PlayCardService,
    PlayerFactory,
} from "trump-and-twist-game-engine";
import { GameStateMapper } from "./GameStateMapper";

export class GameService {
    static createGame() {
        const players = PlayerFactory.createPlayers();
        return GameBootstrapService.createGame(players);
    }

    static getGame(gameId: string) {
        return GameSessionManager.get(gameId);
    }

    static playCard(
        gameId: string,
        playerId: string,
        cardId: string
    ) {
        const session = GameSessionManager.get(gameId);
        const player = session.match.players.find(p => p.id === playerId);
        if (!player) {
            throw new Error("Player not found");
        }
        const card = player.hand.find(c => c.id === cardId);
        if (!card) {
            throw new Error("Card not found");
        }
        return PlayCardService.playCard(gameId, playerId, card);
    }

    static getLegalMoves(
        gameId: string,
        playerId: string
    ) {
        const session = GameSessionManager.get(gameId);
        if (!session.gameState) {
            throw new Error(
                "Game not initialized"
            );
        }
        const player = session.match.players.find(p => p.id === playerId);
        if (!player) {
            throw new Error(
                "Player not found"
            );
        }
        return LegalMoveGenerator.getLegalCards(player, session.gameState.currentTrick);
    }

    static getTurn(gameId: string) {
        const session = GameSessionManager.get(gameId);
        return {
            currentPlayerId: session.gameState?.turnState.currentPlayerId,
            turnNumber: session.gameState?.turnState.turnNumber
        };
    }

    static getGameState(
        gameId: string
    ) {
        const session = GameSessionManager.get(gameId);
        return GameStateMapper.map(session);
    }

    static getPlayerHand(
        gameId: string,
        playerId: string
    ) {
        const session = GameSessionManager.get(gameId);
        const player = session.match.players.find(p => p.id === playerId);
        if (!player) {
            throw new Error(
                "Player not found"
            );
        }
        return {
            playerId: player.id,
            cards: player.hand
        };
    }
}
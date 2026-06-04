import {
    GameBootstrapService,
    BotTurnService,
    GameSessionManager,
    LegalMoveGenerator,
    PlayCardService,
    PlayerFactory,
} from "trump-and-twist-game-engine";
import { GameStateMapper } from "./GameStateMapper";
import { GameEvent } from "../types/GameEvent";
import { PlayTurnResponse } from "../types/PlayTurnResponse";

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
        PlayCardService.playCard(gameId, playerId, card);
        const updatedSession = GameSessionManager.get(gameId);
        return {
            gameId: updatedSession.gameId,
            completed: updatedSession.gameState?.completed,
            currentPlayerId: updatedSession.gameState?.turnState.currentPlayerId,
            turnNumber: updatedSession.gameState?.turnState.turnNumber,
            currentTrick: {
                trickNumber: updatedSession.gameState?.currentTrick.trickNumber,
                leadSuit: updatedSession.gameState?.currentTrick.leadSuit,
                plays: updatedSession.gameState?.currentTrick.plays.map(play => ({
                    playerId: play.playerId,
                    cardId: play.card.id,
                    rank: play.card.rank,
                }))
            }
        };
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

    static getView(
        gameId: string
    ) {
        const session = GameSessionManager.get(gameId);
        const state = session.gameState!;
        const human = session.match.players.find(p => p.id === "P1")!;
        const legal = LegalMoveGenerator.getLegalCards(human, state.currentTrick);
        return {
            gameId: session.gameId,
            completed: state.completed,
            roundNumber: state.currentRound.state.roundNumber,
            trumpSuit: state.currentRound.state.trumpSuit,
            champion: state.currentRound.state.championPlayerId,
            currentPlayerId: state.turnState.currentPlayerId,
            players: session.match.players.map(
                player => ({
                    id: player.id,
                    name: player.name,
                    cardsRemaining: player.hand.length,
                    tricksWonRound: player.stats.tricksWonThisRound,
                    totalTricks: player.stats.totalTricksWon,
                    hand: player.id === "P1" ? player.hand : undefined
                })
            ),
            legalMoves: legal.map(c => c.id),
            currentTrick: state.currentTrick
        };
    }

    static playTurn(
        gameId: string,
        playerId: string,
        cardId: string
    ): PlayTurnResponse {
        const session = GameSessionManager.get(gameId);
        const player = session.match.players.find(p => p.id === playerId);

        if (!player) {
            throw new Error("Player not found");
        }

        if (!session.gameState) {
            throw new Error("Game not initialized");
        }

        const legalCards = LegalMoveGenerator.getLegalCards(player, session.gameState.currentTrick);

        const isLegal = legalCards.some(card => card.id === cardId);

        if (!isLegal) {
            throw new Error("Illegal move");
        }

        const card = player.hand.find(c => c.id === cardId);

        if (!card) {
            throw new Error("Card not found");
        }

        const events: GameEvent[] = [];

        const trickNumberBefore = session.gameState.currentTrick.trickNumber;

        const roundNumberBefore = session.gameState.currentRound.state.roundNumber;
        PlayCardService.playCard(gameId, playerId, card);

        events.push({
            type: "CARD_PLAYED",
            playerId,
            cardId: card.id,
            suit: card.suit,
            rank: card.rank
        });

        const botEvents = BotTurnService.executeAllBots(session);

        events.push(...botEvents);

        const updated = GameSessionManager.get(gameId);

        const trickNumberAfter = updated.gameState?.currentTrick.trickNumber;

        const roundNumberAfter = updated.gameState?.currentRound.state.roundNumber;

        if (trickNumberAfter !== trickNumberBefore) {
            events.push({
                type: "TRICK_COMPLETED"
            });
        }

        if (roundNumberAfter !== roundNumberBefore) {
            events.push({
                type: "ROUND_COMPLETED",
                roundNumber: roundNumberAfter || 0
            });
        }

        if (updated.gameState?.completed) {
            events.push({
                type: "MATCH_COMPLETED", winner: updated.match.result?.winnerPlayerId
            });
        }

        events.push({
            type: "TURN_CHANGED",
            currentPlayerId: updated.gameState?.turnState.currentPlayerId || ""
        });

        return {
            events,
            snapshot: this.getView(gameId)
        };
    }
}
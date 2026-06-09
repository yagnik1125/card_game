import {
    GameBootstrapService,
    BotTurnService,
    GameSessionManager,
    LegalMoveGenerator,
    PlayCardService,
    PlayerFactory,
    GameSession,
    Card,
    Player,
    GameState,
    Suit,
    Trick,
    Round,
} from "trump-and-twist-game-engine";
import { GameStateMapper } from "./GameStateMapper";
import { GameEvent } from "../types/GameEvent";
import { PlayTurnResponse } from "../types/PlayTurnResponse";
import { GameStateResponse } from "../types/GameStateResponse";

export class GameService {
    static createGame(numberOfRounds: number, difficulty: "easy" | "medium" | "hard"): GameSession {
        const players = PlayerFactory.createPlayers(difficulty);
        return GameBootstrapService.createGame(players, numberOfRounds);
    }

    static getGame(gameId: string): GameSession {
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
    ): Card[] {
        const session: GameSession = GameSessionManager.get(gameId);
        if (!session.gameState) {
            throw new Error(
                "Game not initialized"
            );
        }
        const player: Player | undefined = session.match.players.find(p => p.id === playerId);
        if (!player) {
            throw new Error(
                "Player not found"
            );
        }
        return LegalMoveGenerator.getLegalCards(player, session.gameState.currentTrick);
    }

    static getTurn(gameId: string) {
        const session: GameSession = GameSessionManager.get(gameId);
        return {
            currentPlayerId: session.gameState?.turnState.currentPlayerId,
            turnNumber: session.gameState?.turnState.turnNumber
        };
    }

    static getGameState(
        gameId: string
    ): GameStateResponse {
        const session = GameSessionManager.get(gameId);
        return GameStateMapper.map(session);
    }

    static getPlayerHand(
        gameId: string,
        playerId: string
    ) {
        const session: GameSession = GameSessionManager.get(gameId);
        const player: Player | undefined = session.match.players.find(p => p.id === playerId);
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
        const session: GameSession = GameSessionManager.get(gameId);
        const state: GameState = session.gameState!;
        const human: Player = session.match.players.find(p => p.id === "P1")!;
        const legal: Card[] = LegalMoveGenerator.getLegalCards(human, state.currentTrick);
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
        const session: GameSession = GameSessionManager.get(gameId);

        if (!session.gameState) {
            throw new Error("Game not initialized");
        }
        const player: Player | undefined = session.match.players.find(p => p.id === playerId);

        if (!player) {
            throw new Error("Player not found");
        }

        const legalCards: Card[] = LegalMoveGenerator.getLegalCards(player, session.gameState.currentTrick);

        const isLegal: boolean = legalCards.some(card => card.id === cardId);

        if (!isLegal) {
            throw new Error("Illegal move");
        }

        const card: Card | undefined = player.hand.find(c => c.id === cardId);

        if (!card) {
            throw new Error("Card not found");
        }

        const events: GameEvent[] = [];

        const trickBefore: Trick = session.gameState.currentTrick;
        const roundBefore: Round = session.gameState.currentRound;
        const matchBefore: boolean = session.gameState.completed;
        const trumpSuitBefore: Suit | null = session.gameState!.currentRound.state.trumpSuit;

        PlayCardService.playCard(gameId, playerId, card);
        const afterHuman: GameSession = GameSessionManager.get(gameId);
        const trumpSuitAfter: Suit | null = afterHuman.gameState!.currentRound.state.trumpSuit;
        if (!trumpSuitBefore && trumpSuitAfter) {
            events.push({
                type: "TRUMP_DECLARED",
                playerId
            });
        }
        events.push({
            type: "CARD_PLAYED",
            playerId,
            cardId: card.id,
            suit: card.suit,
            rank: card.rank
        });

        const trickCompleted: boolean = afterHuman.gameState!.currentTrick.trickNumber !== trickBefore.trickNumber;
        const roundCompleted: boolean = afterHuman.gameState!.currentRound.state.roundNumber !== roundBefore.state.roundNumber;
        const matchCompleted: boolean = !matchBefore && afterHuman.gameState!.completed;

        if (matchCompleted) {
            events.push({
                type: "MATCH_COMPLETED",
                winner: afterHuman.match.result?.winnerPlayerId,
                playerId: afterHuman.match.result?.winnerPlayerId,
                trickWinnerId: trickBefore.winnerPlayerId,
                roundWinnerId: roundBefore.winnerPlayerId,
            });
        }
        else if (roundCompleted) {
            events.push({
                type: "ROUND_COMPLETED",
                roundNumber: afterHuman.gameState!.currentRound.state.roundNumber,
                playerId: afterHuman.gameState!.leaderPlayerId,
                trickWinnerId: trickBefore.winnerPlayerId,
                roundWinnerId: roundBefore.winnerPlayerId,
            });
        }
        else if (trickCompleted) {
            events.push({
                type: "TRICK_COMPLETED",
                playerId: afterHuman.gameState!.leaderPlayerId,
                trickWinnerId: trickBefore.winnerPlayerId,
            });
        }

        const botEvents: GameEvent[] = BotTurnService.executeAllBots(afterHuman);

        events.push(...botEvents);

        return {
            events,
            snapshot: this.getView(gameId)
        };
    }
}
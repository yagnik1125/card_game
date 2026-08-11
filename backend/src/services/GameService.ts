import {
    GameBootstrapService,
    BotTurnService,
    EventBuilder,
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
    GameMode,
    Team,
    TeamFactory,
} from "../../game-engine/src/index.js";
import { GameStateMapper } from "./GameStateMapper.js";
import { GameEvent } from "../types/GameEvent.js";
import { PlayTurnResponse } from "../types/PlayTurnResponse.js";
import { GameStateResponse } from "../types/GameStateResponse.js";

export class GameService {
    static createGame(numberOfRounds: number, difficulty: "easy" | "medium" | "hard", mode: GameMode): GameSession {
        const players = PlayerFactory.createPlayers(difficulty);
        let teams: Team[] = [];
        if (mode === GameMode.TEAMS_2V2) {
            teams = TeamFactory.createDefaultTeams(players);
        }
        return GameBootstrapService.createGame(players, teams, numberOfRounds, mode);
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
        const player = session.match.players.find((p: any) => p.id === playerId);
        if (!player) {
            throw new Error("Player not found");
        }
        const card = player.hand.find((c: any) => c.id === cardId);
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
                plays: updatedSession.gameState?.currentTrick.plays.map((play: any) => ({
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
        const player: Player | undefined = session.match.players.find((p: any) => p.id === playerId);
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
        const player: Player | undefined = session.match.players.find((p: any) => p.id === playerId);
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
        const human: Player = session.match.players.find((p: any) => p.id === "P1")!;
        const legal: Card[] = LegalMoveGenerator.getLegalCards(human, state.currentTrick);
        return {
            gameId: session.gameId,
            completed: state.completed,
            roundNumber: state.currentRound.state.roundNumber,
            trumpSuit: state.currentRound.state.trumpSuit,
            champion: state.currentRound.state.championPlayerId,
            championTeam: state.currentRound.state.championTeamId,
            currentPlayerId: state.turnState.currentPlayerId,
            players: session.match.players.map(
                (player) => ({
                    id: player.id,
                    name: player.name,
                    cardsRemaining: player.hand.length,
                    tricksWonRound: player.stats.tricksWonThisRound,
                    totalTricks: player.stats.totalTricksWon,
                    roundsWon: player.stats.roundsWon,
                    hand: player.id === "P1" ? player.hand : undefined,
                    teamId: player.teamId
                })
            ),
            teams: session.match.teams.map(
                (team) => ({
                    id: team.id,
                    name: team.name,
                    tricksWonRound: team.tricksWonThisRound,
                    totalTricks: team.totalTricksWon,
                    roundsWon: team.roundsWon,
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
        const player: Player | undefined = session.match.players.find((p: any) => p.id === playerId);

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
        const playerStatsBefore = session.match.players.map(
            (p) => ({
                playerId: p.id,
                tricksWonThisRound: p.stats.tricksWonThisRound,
                totalTricksWon: p.stats.totalTricksWon,
                cardsPlayed: p.stats.cardsPlayed
            }));
        let teamStatsBefore;
        if (session.match.mode === GameMode.TEAMS_2V2) {
            teamStatsBefore = session.match.teams.map(
                (t) => ({
                    id: t.id,
                    name: t.name,
                    tricksWonThisRound: t.tricksWonThisRound,
                    totalTricksWon: t.totalTricksWon,
                    roundsWon: t.roundsWon
                }));
        }
        const trumpSuitBefore: Suit | null = session.gameState!.currentRound.state.trumpSuit;

        PlayCardService.playCard(gameId, playerId, card);
        const afterHuman: GameSession = GameSessionManager.get(gameId);

        events.push(...EventBuilder.buildMoveEvents(
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
        ));

        const botEvents: GameEvent[] = BotTurnService.executeAllBots(afterHuman);

        events.push(...botEvents);

        return {
            events,
            snapshot: this.getView(gameId)
        };
    }
}

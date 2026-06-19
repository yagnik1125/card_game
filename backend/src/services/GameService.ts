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
    GameMode,
    Team,
    TeamFactory,
} from "../../game-engine/src/index.js";
import { GameStateMapper } from "./GameStateMapper.js";
import { GameEvent, RoundWinner, RoundWinnerTeam, TrickWinner, TrickWinnerTeam } from "../types/GameEvent.js";
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

    private static getTeamSnapshot(
        session: GameSession,
        teamId: string
    ): TrickWinnerTeam {
        const team = session.match.teams.find(t => t.id === teamId)!;
        return {
            id: team.id,
            name: team.name,
            tricksWonThisRound: team.tricksWonThisRound,
            totalTricksWon: team.totalTricksWon,
            roundsWon: team.roundsWon
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
            const trickWinnerPlayer: Player | undefined = afterHuman.match.players.find((p: { id: string | null; }) => p.id === trickBefore.winnerPlayerId);
            let roundWinnerPlayer: Player;
            let trickWinnerData: TrickWinner | undefined;
            let roundWinnerData: RoundWinner | undefined;
            const trickWinnerStatsBefore = playerStatsBefore.find(s => s.playerId === trickWinnerPlayer!.id)!;
            let trickWinnerTeamStatsBefore;
            let roundWinnerTeam: Team;
            let trickWinnerTeamData: TrickWinnerTeam | undefined = undefined;
            let roundWinnerTeamData: RoundWinnerTeam | undefined = undefined;
            let winnerPlayerId: string | undefined;
            let winnerTeamId: string | undefined;
            let playerId: string;
            trickWinnerData = {
                id: trickWinnerPlayer!.id,
                name: trickWinnerPlayer!.name,
                // Use stats from before round reset: tricksWonThisRound was incremented by GameFlowService
                tricksWonThisRound: trickWinnerStatsBefore.tricksWonThisRound + 1,
            };
            if (session.match.mode === GameMode.SOLO) {
                winnerPlayerId = session.match.result?.winnerPlayerId;
                playerId = winnerPlayerId!;
                roundWinnerPlayer = session.match.players.find(p => p.id === roundBefore.winnerPlayerId)!;
                roundWinnerData = {
                    id: roundWinnerPlayer!.id,
                    name: roundWinnerPlayer!.name,
                    // Map all players' stats from BEFORE reset
                    players: playerStatsBefore.map((stats) => ({
                        id: stats.playerId,
                        name: session.match.players.find(p => p.id === stats.playerId)!.name,
                        // Add 1 to trick winner's stats since they just won this trick
                        tricksWonThisRound: stats.playerId === trickWinnerPlayer!.id
                            ? stats.tricksWonThisRound + 1
                            : stats.tricksWonThisRound,
                    })),
                };
            }
            else {
                winnerTeamId = session.match.result?.winnerTeamId;
                playerId = session.match.teams.find((t) => t.id === winnerTeamId)!.players[0].id;
                roundWinnerTeam = session.match.teams.find((t) => t.id === roundBefore.winnerTeamId)!;
                trickWinnerTeamStatsBefore = teamStatsBefore!.find((s) => s.id === trickWinnerPlayer!.teamId)!;
                trickWinnerTeamData = {
                    id: trickWinnerTeamStatsBefore!.id,
                    name: trickWinnerTeamStatsBefore!.name,
                    tricksWonThisRound: trickWinnerTeamStatsBefore!.tricksWonThisRound + 1,
                    totalTricksWon: trickWinnerTeamStatsBefore!.totalTricksWon + 1,
                    roundsWon: trickWinnerTeamStatsBefore!.roundsWon,
                };
                roundWinnerTeamData = {
                    id: roundWinnerTeam!.id,
                    name: roundWinnerTeam!.name,
                    teams: teamStatsBefore!.map((stats) => ({
                        id: stats.id,
                        name: session.match.teams.find((t) => t.id === stats.id)!.name,
                        // Add 1 to trick winner's stats since they just won this trick
                        tricksWonThisRound: stats.id === trickWinnerPlayer!.teamId
                            ? stats.tricksWonThisRound + 1
                            : stats.tricksWonThisRound,
                        totalTricksWon: stats.id === trickWinnerPlayer!.teamId
                            ? stats.totalTricksWon + 1
                            : stats.totalTricksWon,
                        roundsWon: stats.id === roundWinnerTeam!.id
                            ? stats.roundsWon + 1
                            : stats.roundsWon,
                    })),
                };
            }
            events.push({
                type: "MATCH_COMPLETED",
                winner: winnerPlayerId,
                winnerTeam: winnerTeamId,
                playerId: playerId,
                trickWinner: trickWinnerData,
                roundWinner: roundWinnerData,
                trickWinnerTeam: trickWinnerTeamData,
                roundWinnerTeam: roundWinnerTeamData
            });
        }
        else if (roundCompleted) {
            const trickWinnerPlayer: Player | undefined = afterHuman.match.players.find((p: { id: string | null; }) => p.id === trickBefore.winnerPlayerId);
            let roundWinnerPlayer: Player;
            let trickWinnerData: TrickWinner | undefined;
            let roundWinnerData: RoundWinner | undefined;
            const trickWinnerStatsBefore = playerStatsBefore.find(s => s.playerId === trickWinnerPlayer!.id)!;
            let trickWinnerTeamStatsBefore;
            let roundWinnerTeam: Team;
            let trickWinnerTeamData: TrickWinnerTeam | undefined = undefined;
            let roundWinnerTeamData: RoundWinnerTeam | undefined = undefined;
            trickWinnerData = {
                id: trickWinnerPlayer!.id,
                name: trickWinnerPlayer!.name,
                // Use stats from before round reset: tricksWonThisRound was incremented by GameFlowService
                tricksWonThisRound: trickWinnerStatsBefore.tricksWonThisRound + 1,
            };
            if (session.match.mode === GameMode.SOLO) {
                roundWinnerPlayer = session.match.players.find(p => p.id === roundBefore.winnerPlayerId)!;
                roundWinnerData = {
                    id: roundWinnerPlayer!.id,
                    name: roundWinnerPlayer!.name,
                    // Map all players' stats from BEFORE reset
                    players: playerStatsBefore.map((stats) => ({
                        id: stats.playerId,
                        name: session.match.players.find(p => p.id === stats.playerId)!.name,
                        // Add 1 to trick winner's stats since they just won this trick
                        tricksWonThisRound: stats.playerId === trickWinnerPlayer!.id
                            ? stats.tricksWonThisRound + 1
                            : stats.tricksWonThisRound,
                    })),
                };
            }
            else {
                roundWinnerTeam = session.match.teams.find((t) => t.id === roundBefore.winnerTeamId)!;
                trickWinnerTeamStatsBefore = teamStatsBefore!.find((s) => s.id === trickWinnerPlayer!.teamId)!;
                trickWinnerTeamData = {
                    id: trickWinnerTeamStatsBefore!.id,
                    name: trickWinnerTeamStatsBefore!.name,
                    tricksWonThisRound: trickWinnerTeamStatsBefore!.tricksWonThisRound + 1,
                    totalTricksWon: trickWinnerTeamStatsBefore!.totalTricksWon + 1,
                    roundsWon: trickWinnerTeamStatsBefore!.roundsWon,
                };
                roundWinnerTeamData = {
                    id: roundWinnerTeam!.id,
                    name: roundWinnerTeam!.name,
                    teams: teamStatsBefore!.map((stats) => ({
                        id: stats.id,
                        name: session.match.teams.find((t) => t.id === stats.id)!.name,
                        // Add 1 to trick winner's stats since they just won this trick
                        tricksWonThisRound: stats.id === trickWinnerPlayer!.teamId
                            ? stats.tricksWonThisRound + 1
                            : stats.tricksWonThisRound,
                        totalTricksWon: stats.id === trickWinnerPlayer!.teamId
                            ? stats.totalTricksWon + 1
                            : stats.totalTricksWon,
                        roundsWon: stats.id === roundWinnerTeam!.id
                            ? stats.roundsWon + 1
                            : stats.roundsWon,
                    })),
                };
            }
            events.push({
                type: "ROUND_COMPLETED",
                roundNumber: afterHuman.gameState!.currentRound.state.roundNumber,
                playerId: session.gameState.leaderPlayerId,
                trickWinner: trickWinnerData,
                roundWinner: roundWinnerData,
                trickWinnerTeam: trickWinnerTeamData,
                roundWinnerTeam: roundWinnerTeamData
            });
        }
        else if (trickCompleted) {
            const trickWinner: Player | undefined = afterHuman.match.players.find((p: { id: string | null; }) => p.id === trickBefore.winnerPlayerId);
            const trickWinnerStatsBefore = playerStatsBefore.find((s: { playerId: string; }) => s.playerId === trickWinner!.id)!;
            let trickWinnerTeamStatsBefore;
            let trickWinnerTeam: TrickWinnerTeam | undefined = undefined;
            if (session.match.mode === GameMode.TEAMS_2V2) {
                trickWinnerTeamStatsBefore = teamStatsBefore!.find((s) => s.id === trickWinner!.teamId)!;
                trickWinnerTeam = {
                    id: trickWinnerTeamStatsBefore!.id,
                    name: trickWinnerTeamStatsBefore!.name,
                    tricksWonThisRound: trickWinnerTeamStatsBefore!.tricksWonThisRound + 1,
                    totalTricksWon: trickWinnerTeamStatsBefore!.totalTricksWon + 1,
                    roundsWon: trickWinnerTeamStatsBefore!.roundsWon,
                };
            }
            events.push({
                type: "TRICK_COMPLETED",
                playerId: afterHuman.gameState!.leaderPlayerId,
                trickWinner: {
                    id: trickWinner!.id,
                    name: trickWinner!.name,
                    // GameFlowService already incremented tricksWonThisRound, so stats already reflect the win
                    tricksWonThisRound: trickWinnerStatsBefore.tricksWonThisRound + 1,
                },
                trickWinnerTeam
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
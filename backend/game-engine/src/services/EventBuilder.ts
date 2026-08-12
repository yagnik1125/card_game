import { Card } from "../core/Card.js";
import { GameMode, Suit } from "../core/enums.js";
import { Player } from "../core/Player.js";
import { Round, Team, Trick } from "../domain/index.js";
import {
    GameEvent,
    MatchCompletedEvent,
    RoundCompletedEvent,
    RoundWinner,
    RoundWinnerTeam,
    TrickCompletedEvent,
    TrickWinner,
    TrickWinnerTeam,
} from "../events/GameEvents.js";
import { GameSession } from "../session/GameSession.js";

export interface PlayerStatsBefore {
    playerId: string;
    tricksWonThisRound: number;
    totalTricksWon: number;
    cardsPlayed: number;
}

export interface TeamStatsBefore {
    id: string;
    name: string;
    tricksWonThisRound: number;
    totalTricksWon: number;
    roundsWon: number;
}

export interface MoveBefore {
    trickBefore: Trick;
    roundBefore: Round;
    matchBefore: boolean;
    trumpBefore: Suit | null;
    playerStatsBefore: PlayerStatsBefore[];
    teamStatsBefore?: TeamStatsBefore[];
}

export class EventBuilder {
    static buildMoveEvents(
        session: GameSession,
        playerId: string,
        card: Card,
        isBot: boolean,
        before: MoveBefore
    ): GameEvent[] {
        const events: GameEvent[] = [];
        if (!session.gameState) {
            return events;
        }
        const trumpAfter: Suit | null = session.gameState.currentRound.state.trumpSuit;
        if (!before.trumpBefore && trumpAfter) {
            events.push({
                type: "TRUMP_DECLARED",
                playerId,
                suit: trumpAfter,
            });
        }
        events.push({
            type: isBot ? "BOT_PLAY" : "CARD_PLAYED",
            playerId,
            cardId: card.id,
            suit: card.suit,
            rank: card.rank,
        });

        const trickCompleted: boolean =
            session.gameState.currentTrick.trickNumber !== before.trickBefore.trickNumber;
        const roundCompleted: boolean =
            session.gameState.currentRound.state.roundNumber !== before.roundBefore.state.roundNumber;
        const matchCompleted: boolean = !before.matchBefore && session.gameState.completed;

        if (matchCompleted) {
            events.push(EventBuilder.buildMatchCompleted(session, before));
        } else if (roundCompleted) {
            events.push(EventBuilder.buildRoundCompleted(session, before));
        } else if (trickCompleted) {
            events.push(EventBuilder.buildTrickCompleted(session, before));
        }
        return events;
    }

    private static buildTrickWinnerData(
        session: GameSession,
        before: MoveBefore,
        trickWinnerPlayer: Player
    ): TrickWinner {
        const stats = before.playerStatsBefore.find(
            (s) => s.playerId === trickWinnerPlayer.id
        )!;
        return {
            id: trickWinnerPlayer.id,
            name: trickWinnerPlayer.name,
            tricksWonThisRound: stats.tricksWonThisRound + 1,
        };
    }

    private static buildTrickWinnerTeamData(
        session: GameSession,
        before: MoveBefore,
        trickWinnerPlayer: Player
    ): TrickWinnerTeam | undefined {
        if (session.match.mode !== GameMode.TEAMS_2V2) {
            return undefined;
        }
        const stats = before.teamStatsBefore!.find(
            (s) => s.id === trickWinnerPlayer.teamId
        )!;
        return {
            id: stats.id,
            name: stats.name,
            tricksWonThisRound: stats.tricksWonThisRound + 1,
            totalTricksWon: stats.totalTricksWon + 1,
            roundsWon: stats.roundsWon,
        };
    }

    private static buildMatchCompleted(
        session: GameSession,
        before: MoveBefore
    ): MatchCompletedEvent {
        const trickWinnerPlayer: Player | undefined = session.match.players.find(
            (p) => p.id === before.trickBefore.winnerPlayerId
        )!;
        let roundWinnerPlayer: Player;
        let trickWinnerData: TrickWinner | undefined;
        let roundWinnerData: RoundWinner | undefined;
        let roundWinnerTeam: Team;
        let trickWinnerTeamData: TrickWinnerTeam | undefined = undefined;
        let roundWinnerTeamData: RoundWinnerTeam | undefined = undefined;
        let winnerPlayerId: string | undefined;
        let winnerTeamId: string | undefined;
        let playerId: string;
        trickWinnerData = EventBuilder.buildTrickWinnerData(session, before, trickWinnerPlayer);
        if (session.match.mode === GameMode.SOLO) {
            winnerPlayerId = session.match.result?.winnerPlayerId;
            playerId = winnerPlayerId!;
            roundWinnerPlayer = session.match.players.find(
                (p) => p.id === before.roundBefore.winnerPlayerId
            )!;
            roundWinnerData = {
                id: roundWinnerPlayer!.id,
                name: roundWinnerPlayer!.name,
                players: before.playerStatsBefore.map((stats) => ({
                    id: stats.playerId,
                    name: session.match.players.find(
                        (p) => p.id === stats.playerId
                    )!.name,
                    tricksWonThisRound:
                        stats.playerId === trickWinnerPlayer!.id
                            ? stats.tricksWonThisRound + 1
                            : stats.tricksWonThisRound,
                })),
            };
        } else {
            winnerTeamId = session.match.result?.winnerTeamId;
            playerId = session.match.teams.find(
                (t) => t.id === winnerTeamId
            )!.players[0].id;
            roundWinnerTeam = session.match.teams.find(
                (t) => t.id === before.roundBefore.winnerTeamId
            )!;
            trickWinnerTeamData = EventBuilder.buildTrickWinnerTeamData(session, before, trickWinnerPlayer);
            roundWinnerTeamData = {
                id: roundWinnerTeam!.id,
                name: roundWinnerTeam!.name,
                teams: before.teamStatsBefore!.map((stats) => ({
                    id: stats.id,
                    name: session.match.teams.find((t) => t.id === stats.id)!.name,
                    tricksWonThisRound:
                        stats.id === trickWinnerPlayer!.teamId
                            ? stats.tricksWonThisRound + 1
                            : stats.tricksWonThisRound,
                    totalTricksWon:
                        stats.id === trickWinnerPlayer!.teamId
                            ? stats.totalTricksWon + 1
                            : stats.totalTricksWon,
                    roundsWon:
                        stats.id === roundWinnerTeam!.id
                            ? stats.roundsWon + 1
                            : stats.roundsWon,
                })),
            };
        }
        return {
            type: "MATCH_COMPLETED",
            winner: winnerPlayerId,
            winnerTeam: winnerTeamId,
            playerId: playerId,
            trickWinner: trickWinnerData,
            roundWinner: roundWinnerData,
            trickWinnerTeam: trickWinnerTeamData,
            roundWinnerTeam: roundWinnerTeamData,
        };
    }

    private static buildRoundCompleted(
        session: GameSession,
        before: MoveBefore
    ): RoundCompletedEvent {
        const trickWinnerPlayer: Player | undefined = session.match.players.find(
            (p) => p.id === before.trickBefore.winnerPlayerId
        )!;
        let roundWinnerPlayer: Player;
        let trickWinnerData: TrickWinner | undefined;
        let roundWinnerData: RoundWinner | undefined;
        let roundWinnerTeam: Team;
        let trickWinnerTeamData: TrickWinnerTeam | undefined = undefined;
        let roundWinnerTeamData: RoundWinnerTeam | undefined = undefined;
        trickWinnerData = EventBuilder.buildTrickWinnerData(session, before, trickWinnerPlayer);
        if (session.match.mode === GameMode.SOLO) {
            roundWinnerPlayer = session.match.players.find(
                (p) => p.id === before.roundBefore.winnerPlayerId
            )!;
            roundWinnerData = {
                id: roundWinnerPlayer!.id,
                name: roundWinnerPlayer!.name,
                players: before.playerStatsBefore.map((stats) => ({
                    id: stats.playerId,
                    name: session.match.players.find(
                        (p) => p.id === stats.playerId
                    )!.name,
                    tricksWonThisRound:
                        stats.playerId === trickWinnerPlayer!.id
                            ? stats.tricksWonThisRound + 1
                            : stats.tricksWonThisRound,
                })),
            };
        } else {
            roundWinnerTeam = session.match.teams.find(
                (t) => t.id === before.roundBefore.winnerTeamId
            )!;
            trickWinnerTeamData = EventBuilder.buildTrickWinnerTeamData(session, before, trickWinnerPlayer);
            roundWinnerTeamData = {
                id: roundWinnerTeam!.id,
                name: roundWinnerTeam!.name,
                teams: before.teamStatsBefore!.map((stats) => ({
                    id: stats.id,
                    name: session.match.teams.find((t) => t.id === stats.id)!.name,
                    tricksWonThisRound:
                        stats.id === trickWinnerPlayer!.teamId
                            ? stats.tricksWonThisRound + 1
                            : stats.tricksWonThisRound,
                    totalTricksWon:
                        stats.id === trickWinnerPlayer!.teamId
                            ? stats.totalTricksWon + 1
                            : stats.totalTricksWon,
                    roundsWon:
                        stats.id === roundWinnerTeam!.id
                            ? stats.roundsWon + 1
                            : stats.roundsWon,
                })),
            };
        }
        return {
            type: "ROUND_COMPLETED",
            roundNumber: session.gameState!.currentRound.state.roundNumber,
            playerId: session.gameState!.leaderPlayerId,
            trickWinner: trickWinnerData,
            roundWinner: roundWinnerData,
            trickWinnerTeam: trickWinnerTeamData,
            roundWinnerTeam: roundWinnerTeamData,
        };
    }

    private static buildTrickCompleted(
        session: GameSession,
        before: MoveBefore
    ): TrickCompletedEvent {
        const trickWinner: Player | undefined = session.match.players.find(
            (p) => p.id === before.trickBefore.winnerPlayerId
        )!;
        const trickWinnerStatsBefore = before.playerStatsBefore.find(
            (s) => s.playerId === trickWinner!.id
        )!;
        return {
            type: "TRICK_COMPLETED",
            trickNumber: before.trickBefore.trickNumber,
            playerId: session.gameState!.leaderPlayerId,
            trickWinner: {
                id: trickWinner!.id,
                name: trickWinner!.name,
                tricksWonThisRound: trickWinnerStatsBefore.tricksWonThisRound + 1,
            },
            trickWinnerTeam: EventBuilder.buildTrickWinnerTeamData(session, before, trickWinner),
        };
    }
}

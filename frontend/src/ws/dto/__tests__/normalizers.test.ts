import {
    cardPlayToTrickCard,
    matchCompletedToModal,
    roundCompletedToModal,
    trickCompletedToModal,
    viewPlayToTrickCard,
    viewToTrickCards,
} from "../normalizers";
import type { GameView, ViewPlay } from "../gameView";
import type { BotPlayedPayload } from "../../protocol/serverEvents";

describe("ws dto normalizers", () => {
    it("cardPlayToTrickCard maps a played-card payload to a trick card", () => {
        const payload: BotPlayedPayload = {
            playerId: "P2",
            cardId: "c1",
            suit: "SPADES",
            rank: 7,
        };
        expect(cardPlayToTrickCard(payload)).toEqual({
            playerId: "P2",
            suit: "SPADES",
            rank: 7,
        });
    });

    it("viewPlayToTrickCard maps a view play to a trick card", () => {
        const play: ViewPlay = {
            playerId: "P3",
            card: { id: "c2", suit: "HEARTS", rank: 12 },
        };
        expect(viewPlayToTrickCard(play)).toEqual({
            playerId: "P3",
            suit: "HEARTS",
            rank: 12,
        });
    });

    it("viewToTrickCards rebuilds the trick cards from a snapshot", () => {
        const view = {
            currentTrick: {
                plays: [
                    { playerId: "P1", card: { id: "c1", suit: "CLUBS", rank: 2 } },
                    { playerId: "P2", card: { id: "c2", suit: "CLUBS", rank: 5 } },
                ],
            },
        } as unknown as GameView;
        expect(viewToTrickCards(view)).toEqual([
            { playerId: "P1", suit: "CLUBS", rank: 2 },
            { playerId: "P2", suit: "CLUBS", rank: 5 },
        ]);
    });

    it("trickCompletedToModal extracts the banner fields", () => {
        const payload = {
            trickNumber: 4,
            winnerPlayerId: "P1",
            trickWinner: { id: "P1", name: "You", tricksWonThisRound: 2 },
            trickWinnerTeam: { id: "T1", name: "Team A", tricksWonThisRound: 2, totalTricksWon: 5, roundsWon: 1 },
        };
        expect(trickCompletedToModal(payload)).toEqual({
            winnerPlayerId: "P1",
            winnerName: "You",
            tricksWonThisRound: 2,
            teamName: "Team A",
        });
    });

    it("trickCompletedToModal leaves teamName null when absent", () => {
        const payload = {
            trickNumber: 1,
            winnerPlayerId: "P4",
            trickWinner: { id: "P4", name: "Bot 3", tricksWonThisRound: 1 },
        };
        expect(trickCompletedToModal(payload)).toEqual({
            winnerPlayerId: "P4",
            winnerName: "Bot 3",
            tricksWonThisRound: 1,
            teamName: null,
        });
    });

    it("roundCompletedToModal maps round winner info", () => {
        const payload = {
            roundNumber: 2,
            winnerPlayerId: "P1",
            roundWinner: { id: "P1", name: "You", players: [] },
        };
        expect(roundCompletedToModal(payload)).toEqual({
            roundNumber: 2,
            winnerPlayerId: "P1",
            winnerName: "You",
            teamName: null,
        });
    });

    it("matchCompletedToModal maps solo and team winners", () => {
        expect(
            matchCompletedToModal({
                winnerPlayerId: "P1",
                roundWinner: { id: "P1", name: "You", players: [] },
            })
        ).toEqual({
            winnerPlayerId: "P1",
            winnerTeamId: null,
            winnerName: "You",
            teamName: null,
        });

        expect(
            matchCompletedToModal({
                winnerTeamId: "T1",
                roundWinnerTeam: { id: "T1", name: "Team A", teams: [] },
            })
        ).toEqual({
            winnerPlayerId: null,
            winnerTeamId: "T1",
            winnerName: null,
            teamName: "Team A",
        });
    });
});

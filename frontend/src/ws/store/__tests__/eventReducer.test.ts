import { describe, expect, it } from "vitest";
import {
    reduceServerEvent,
    wsGameInitialState,
    type WsGameState,
} from "../eventReducer";
import type { ServerEnvelope } from "../../protocol/serverEvents";
import type { GameView, ViewCard } from "../../dto/gameView";

function card(id: string, suit: ViewCard["suit"], rank: ViewCard["rank"]): ViewCard {
    return { id, suit, rank };
}

function makeSnapshot(overrides: Partial<GameView> = {}): GameView {
    return {
        gameId: "g1",
        completed: false,
        roundNumber: 1,
        trumpSuit: "HEARTS",
        champion: null,
        championTeam: null,
        currentPlayerId: "P1",
        players: [
            {
                id: "P1",
                name: "You",
                cardsRemaining: 2,
                tricksWonRound: 0,
                totalTricks: 0,
                roundsWon: 0,
                hand: [card("c1", "SPADES", 7), card("c2", "HEARTS", 10)],
            },
            {
                id: "P2",
                name: "Bot 1",
                cardsRemaining: 2,
                tricksWonRound: 0,
                totalTricks: 0,
                roundsWon: 0,
            },
            {
                id: "P3",
                name: "Bot 2",
                cardsRemaining: 2,
                tricksWonRound: 0,
                totalTricks: 0,
                roundsWon: 0,
            },
            {
                id: "P4",
                name: "Bot 3",
                cardsRemaining: 2,
                tricksWonRound: 0,
                totalTricks: 0,
                roundsWon: 0,
            },
        ],
        teams: [],
        legalMoves: ["c1", "c2"],
        currentTrick: {
            id: "t1",
            trickNumber: 1,
            leadSuit: null,
            plays: [],
            winnerPlayerId: null,
        },
        ...overrides,
    };
}

function envelope(
    type: string,
    payload: unknown,
    snapshot?: unknown
): ServerEnvelope {
    return {
        type,
        payload,
        snapshot,
        timestamp: 1700000000000,
    } as unknown as ServerEnvelope;
}

function apply(
    state: WsGameState,
    event: ServerEnvelope
): WsGameState {
    return { ...state, ...reduceServerEvent(state, event) };
}

describe("eventReducer", () => {
    it("CARD_PLAYED appends a trick card and removes the P1 card from the hand", () => {
        let state: WsGameState = {
            ...wsGameInitialState,
            snapshot: makeSnapshot(),
        };
        state = apply(
            state,
            envelope("CARD_PLAYED", {
                playerId: "P1",
                cardId: "c1",
                suit: "SPADES",
                rank: 7,
            })
        );
        expect(state.trickCards).toEqual([
            { playerId: "P1", suit: "SPADES", rank: 7 },
        ]);
        expect(state.snapshot!.players[0].hand!.map((c) => c.id)).toEqual([
            "c2",
        ]);
    });

    it("BOT_PLAY appends a trick card without touching the P1 hand", () => {
        let state: WsGameState = {
            ...wsGameInitialState,
            snapshot: makeSnapshot(),
        };
        state = apply(
            state,
            envelope("BOT_PLAY", {
                playerId: "P2",
                cardId: "b1",
                suit: "CLUBS",
                rank: 3,
            })
        );
        expect(state.trickCards).toEqual([
            { playerId: "P2", suit: "CLUBS", rank: 3 },
        ]);
        expect(state.snapshot!.players[0].hand!.map((c) => c.id)).toEqual([
            "c1",
            "c2",
        ]);
    });

    it("TURN_CHANGED updates the snapshot current player and turn number", () => {
        let state: WsGameState = {
            ...wsGameInitialState,
            snapshot: makeSnapshot(),
        };
        state = apply(
            state,
            envelope("TURN_CHANGED", {
                currentPlayerId: "P2",
                turnNumber: 3,
            })
        );
        expect(state.snapshot!.currentPlayerId).toBe("P2");
        expect(state.turnNumber).toBe(3);
    });

    it("TRUMP_DECLARED stores the suit (and null when no trump)", () => {
        let state: WsGameState = { ...wsGameInitialState };
        state = apply(
            state,
            envelope("TRUMP_DECLARED", { playerId: "P1", suit: "SPADES" })
        );
        expect(state.trumpDeclaration).toBe("SPADES");
        state = apply(
            state,
            envelope("TRUMP_DECLARED", { playerId: "P1", suit: null })
        );
        expect(state.trumpDeclaration).toBeNull();
    });

    it("TRICK_COMPLETED clears the trick, records the winner and applies the snapshot", () => {
        let state: WsGameState = {
            ...wsGameInitialState,
            trickCards: [{ playerId: "P1", suit: "SPADES", rank: 7 }],
        };
        const snapshot = makeSnapshot({ currentPlayerId: "P2" });
        state = apply(
            state,
            envelope(
                "TRICK_COMPLETED",
                {
                    trickNumber: 1,
                    winnerPlayerId: "P1",
                    trickWinner: {
                        id: "P1",
                        name: "You",
                        tricksWonThisRound: 1,
                    },
                },
                snapshot
            )
        );
        expect(state.trickCards).toEqual([]);
        expect(state.trickWinner).toEqual({
            id: "P1",
            name: "You",
            tricksWonThisRound: 1,
        });
        expect(state.trickWinnerTeam).toBeNull();
        expect(state.snapshot).toBe(snapshot);
    });

    it("TRICK_COMPLETED stores the team winner when present", () => {
        let state: WsGameState = { ...wsGameInitialState };
        state = apply(
            state,
            envelope("TRICK_COMPLETED", {
                trickNumber: 2,
                winnerPlayerId: "T1",
                trickWinner: { id: "P1", name: "You", tricksWonThisRound: 1 },
                trickWinnerTeam: {
                    id: "T1",
                    name: "Team A",
                    tricksWonThisRound: 1,
                    totalTricksWon: 3,
                    roundsWon: 1,
                },
            })
        );
        expect(state.trickWinnerTeam).toEqual({
            id: "T1",
            name: "Team A",
            tricksWonThisRound: 1,
            totalTricksWon: 3,
            roundsWon: 1,
        });
    });

    it("ROUND_COMPLETED triggers dealing and records the round winner", () => {
        let state: WsGameState = { ...wsGameInitialState, dealing: false };
        state = apply(
            state,
            envelope("ROUND_COMPLETED", {
                roundNumber: 1,
                winnerPlayerId: "P3",
                roundWinner: { id: "P3", name: "Bot 2", players: [] },
            })
        );
        expect(state.dealing).toBe(true);
        expect(state.roundWinner).toEqual({
            id: "P3",
            name: "Bot 2",
            players: [],
        });
        expect(state.roundWinnerTeam).toBeNull();
    });

    it("ROUND_COMPLETED stores the team round winner when present", () => {
        let state: WsGameState = { ...wsGameInitialState };
        state = apply(
            state,
            envelope("ROUND_COMPLETED", {
                roundNumber: 1,
                winnerPlayerId: "T1",
                roundWinnerTeam: {
                    id: "T1",
                    name: "Team A",
                    teams: [
                        {
                            id: "T1",
                            name: "Team A",
                            tricksWonThisRound: 4,
                            totalTricksWon: 9,
                            roundsWon: 1,
                        },
                        {
                            id: "T2",
                            name: "Team B",
                            tricksWonThisRound: 2,
                            totalTricksWon: 7,
                            roundsWon: 0,
                        },
                    ],
                },
            })
        );
        expect(state.dealing).toBe(true);
        expect(state.roundWinnerTeam).toEqual({
            id: "T1",
            name: "Team A",
            teams: [
                {
                    id: "T1",
                    name: "Team A",
                    tricksWonThisRound: 4,
                    totalTricksWon: 9,
                    roundsWon: 1,
                },
                {
                    id: "T2",
                    name: "Team B",
                    tricksWonThisRound: 2,
                    totalTricksWon: 7,
                    roundsWon: 0,
                },
            ],
        });
    });

    it("MATCH_COMPLETED stores the winner ids from the payload (never computed)", () => {
        let state: WsGameState = { ...wsGameInitialState };
        state = apply(
            state,
            envelope("MATCH_COMPLETED", {
                winnerPlayerId: "P1",
                roundWinner: { id: "P1", name: "You", players: [] },
            })
        );
        expect(state.winnerPlayerId).toBe("P1");
        expect(state.winnerTeamId).toBeNull();

        state = apply(
            state,
            envelope("MATCH_COMPLETED", {
                winnerTeamId: "T1",
                roundWinnerTeam: { id: "T1", name: "Team A", teams: [] },
            })
        );
        expect(state.winnerPlayerId).toBeNull();
        expect(state.winnerTeamId).toBe("T1");
    });

    it("GAME_STATE fully resyncs the snapshot and rebuilds trick cards", () => {
        let state: WsGameState = {
            ...wsGameInitialState,
            snapshot: makeSnapshot(),
            trickCards: [{ playerId: "P1", suit: "SPADES", rank: 7 }],
            animating: true,
            dealing: true,
        };
        const snapshot = makeSnapshot({
            currentPlayerId: "P4",
            currentTrick: {
                id: "t2",
                trickNumber: 2,
                leadSuit: "CLUBS",
                plays: [
                    {
                        playerId: "P2",
                        card: card("b9", "CLUBS", 5),
                    },
                    {
                        playerId: "P3",
                        card: card("b10", "CLUBS", 9),
                    },
                ],
                winnerPlayerId: null,
            },
        });
        state = apply(state, envelope("GAME_STATE", { gameId: "g1" }, snapshot));
        expect(state.snapshot).toBe(snapshot);
        expect(state.trickCards).toEqual([
            { playerId: "P2", suit: "CLUBS", rank: 5 },
            { playerId: "P3", suit: "CLUBS", rank: 9 },
        ]);
        expect(state.animating).toBe(false);
        expect(state.dealing).toBe(false);
    });

    it("GAME_STATE without a valid snapshot is a no-op", () => {
        const state: WsGameState = { ...wsGameInitialState };
        const next = apply(state, envelope("GAME_STATE", { gameId: "g1" }));
        expect(next).toEqual(state);
    });

    it("GAME_ERROR populates the typed error", () => {
        let state: WsGameState = { ...wsGameInitialState };
        state = apply(
            state,
            envelope("GAME_ERROR", {
                code: "ILLEGAL_MOVE",
                message: "Not legal",
            })
        );
        expect(state.error).toEqual({
            code: "ILLEGAL_MOVE",
            message: "Not a legal move",
        });
    });

    it("ROUND_STARTED triggers dealing and updates round/champion fields", () => {
        let state: WsGameState = {
            ...wsGameInitialState,
            snapshot: makeSnapshot(),
            dealing: false,
        };
        state = apply(
            state,
            envelope("ROUND_STARTED", {
                gameId: "g1",
                roundNumber: 2,
                championPlayerId: "P2",
                championTeamId: null,
            })
        );
        expect(state.dealing).toBe(true);
        expect(state.snapshot!.roundNumber).toBe(2);
        expect(state.snapshot!.champion).toBe("P2");
        expect(state.snapshot!.championTeam).toBeNull();
    });

    it("dedups identical envelopes by identity signature", () => {
        let state: WsGameState = { ...wsGameInitialState };
        const event = envelope("CARD_PLAYED", {
            playerId: "P1",
            cardId: "c1",
            suit: "SPADES",
            rank: 7,
        });
        state = apply(state, event);
        expect(state.trickCards).toHaveLength(1);

        const before = state;
        const after = apply(state, event);
        expect(after).toEqual(before);
        expect(reduceServerEvent(state, event)).toEqual({});
    });

    it("a new envelope with a different signature still applies after a dedup", () => {
        let state: WsGameState = { ...wsGameInitialState };
        state = apply(
            state,
            envelope("CARD_PLAYED", {
                playerId: "P1",
                cardId: "c1",
                suit: "SPADES",
                rank: 7,
            })
        );
        state = apply(state, envelope("TURN_CHANGED", {
            currentPlayerId: "P2",
            turnNumber: 1,
        }));
        expect(state.turnNumber).toBe(1);
        expect(state.trickCards).toHaveLength(1);
    });

    it("GAME_ERROR is never deduped", () => {
        let state: WsGameState = { ...wsGameInitialState };
        state = apply(
            state,
            envelope("GAME_ERROR", { code: "A", message: "first" })
        );
        state = apply(
            state,
            envelope("GAME_ERROR", { code: "B", message: "second" })
        );
        expect(state.error).toEqual({ code: "B", message: "second" });
    });

    it("non-game events are ignored", () => {
        const state: WsGameState = { ...wsGameInitialState };
        const next = apply(
            state,
            envelope("GAME_CREATED", { gameId: "g1" })
        );
        expect(next).toEqual(state);
    });

    it("CARD_PLAYED when the P1 hand is unknown still appends the trick card", () => {
        let state: WsGameState = { ...wsGameInitialState, snapshot: null };
        state = apply(
            state,
            envelope("CARD_PLAYED", {
                playerId: "P1",
                cardId: "c1",
                suit: "HEARTS",
                rank: 12,
            })
        );
        expect(state.trickCards).toEqual([
            { playerId: "P1", suit: "HEARTS", rank: 12 },
        ]);
    });

    it("GAME_STATE resync rebuilds trick cards, resets animation, and bumps stateVersion", () => {
        let state: WsGameState = {
            ...wsGameInitialState,
            snapshot: makeSnapshot(),
            trickCards: [{ playerId: "P1", suit: "SPADES", rank: 7 }],
            animating: true,
            dealing: true,
        };
        state = apply(
            state,
            envelope("GAME_STATE", {}, makeSnapshot({ roundNumber: 2 }))
        );
        expect(state.snapshot!.roundNumber).toBe(2);
        expect(state.trickCards).toEqual([]);
        expect(state.animating).toBe(false);
        expect(state.dealing).toBe(false);
        expect(state.stateVersion).toBe(1);
    });

    it("a CARD_PLAYED/BOT_PLAY for a card already in the trick is not double-appended", () => {
        let state: WsGameState = {
            ...wsGameInitialState,
            snapshot: makeSnapshot(),
        };
        state = apply(
            state,
            envelope("CARD_PLAYED", {
                playerId: "P2",
                cardId: "b1",
                suit: "HEARTS",
                rank: 10,
            })
        );
        state = apply(
            state,
            envelope("BOT_PLAY", {
                playerId: "P2",
                cardId: "b1",
                suit: "HEARTS",
                rank: 10,
            })
        );
        expect(state.trickCards).toHaveLength(1);
    });

    it("a stale CARD_PLAYED already reflected in the snapshot is dropped", () => {
        let state: WsGameState = {
            ...wsGameInitialState,
            snapshot: makeSnapshot({
                currentTrick: {
                    id: "t1",
                    trickNumber: 1,
                    leadSuit: "SPADES",
                    plays: [
                        {
                            playerId: "P2",
                            card: { id: "b1", suit: "HEARTS", rank: 10 },
                        },
                    ],
                    winnerPlayerId: null,
                },
            }),
        };
        state = apply(
            state,
            envelope("BOT_PLAY", {
                playerId: "P2",
                cardId: "b1",
                suit: "HEARTS",
                rank: 10,
            })
        );
        expect(state.trickCards).toEqual([]);
    });

    it("TRICK_COMPLETED for a trick the snapshot already advanced past is dropped", () => {
        let state: WsGameState = {
            ...wsGameInitialState,
            snapshot: makeSnapshot({
                currentTrick: {
                    id: "t2",
                    trickNumber: 2,
                    leadSuit: null,
                    plays: [],
                    winnerPlayerId: null,
                },
            }),
            trickWinner: { id: "P2", name: "Bot 1", tricksWonThisRound: 1 },
        };
        state = apply(
            state,
            envelope("TRICK_COMPLETED", {
                roundNumber: 1,
                trickNumber: 1,
                winnerPlayerId: "P2",
                trickWinner: {
                    id: "P2",
                    name: "Bot 1",
                    tricksWonThisRound: 2,
                },
            })
        );
        expect(state.trickWinner!.tricksWonThisRound).toBe(1);
        expect(state.trickCards).toEqual([]);
    });

    it("GAME_JOINED marks watching for a second client and GAME_LEFT clears it", () => {
        let state: WsGameState = { ...wsGameInitialState };
        state = apply(
            state,
            envelope("GAME_JOINED", {
                gameId: "g1",
                playerId: "P9",
                socketId: "s2",
            })
        );
        expect(state.watching).toBe(true);
        state = apply(
            state,
            envelope("GAME_LEFT", {
                gameId: "g1",
                playerId: "P9",
                socketId: "s2",
            })
        );
        expect(state.watching).toBe(false);
    });

    it("GAME_JOINED for the human player does not mark watching", () => {
        const state: WsGameState = apply(
            { ...wsGameInitialState },
            envelope("GAME_JOINED", {
                gameId: "g1",
                playerId: "P1",
                socketId: "s1",
            })
        );
        expect(state.watching).toBe(false);
    });

    it("GAME_ERROR messages are mapped to friendly copy", () => {
        const state: WsGameState = apply(
            { ...wsGameInitialState },
            envelope("GAME_ERROR", { code: "ILLEGAL_MOVE", message: "raw" })
        );
        expect(state.error).toEqual({
            code: "ILLEGAL_MOVE",
            message: "Not a legal move",
        });
    });
});

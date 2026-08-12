import { Card } from "../../game-engine/src/core/Card.js";
import { Rank, Suit } from "../../game-engine/src/core/enums.js";
import { Player } from "../../game-engine/src/core/Player.js";
import { RoundState } from "../../game-engine/src/domain/round/RoundState.js";
import { Trick } from "../../game-engine/src/domain/trick/Trick.js";
import { TrickFactory } from "../../game-engine/src/factories/TrickFactory.js";

export function makeCard(
    suit: Suit,
    rank: number,
    id?: string
): Card {
    return {
        id: id ?? `${suit}_${rank}`,
        suit,
        rank: rank as Rank,
    };
}

export function makePlayer(
    id: string,
    hand: Card[] = [],
    isBot = false
): Player {
    return {
        id,
        name: `Player ${id}`,
        hand,
        isBot,
        isConnected: true,
        stats: {
            tricksWonThisRound: 0,
            totalTricksWon: 0,
            roundsWon: 0,
            trumpDeclarations: 0,
            cardsPlayed: 0,
            gamesWon: 0,
        },
    };
}

export function makeRoundState(
    overrides: Partial<RoundState> = {}
): RoundState {
    return {
        roundNumber: 1,
        trumpSuit: null,
        championPlayerId: null,
        championTeamId: null,
        trumpDeclared: false,
        ...overrides,
    };
}

export function makeTrick(
    trickNumber = 1
): Trick {
    return TrickFactory.create(trickNumber);
}

export function expectedSoloWinner(players: any[]): string {
    return players.reduce((best: any, current: any) => {
        const better =
            current.stats.roundsWon > best.stats.roundsWon ||
            (current.stats.roundsWon === best.stats.roundsWon &&
                current.stats.totalTricksWon > best.stats.totalTricksWon);
        return better ? current : best;
    }).id;
}

export function expectedTeamWinner(teams: any[]): string {
    return teams.reduce((best: any, current: any) => {
        const better =
            current.roundsWon > best.roundsWon ||
            (current.roundsWon === best.roundsWon &&
                current.totalTricksWon > best.totalTricksWon);
        return better ? current : best;
    }).id;
}

import { TrickEngine } from "../engines/TrickEngine";
import { WinnerResolver } from "../rules/WinnerResolver";
import { BotFactory } from "../factories/BotFactory";
import { PlayerFactory } from "../factories/PlayerFactory";
import { TrickFactory } from "../factories/TrickFactory";
import { RoundState } from "../domain/round/RoundState";
import { LegalMoveGenerator } from "../rules/LegalMoveGenerator";
import { Player } from "../core/Player";
import { Trick } from "../domain/trick/Trick";
import { Card } from "../core/Card";
import { EasyBot } from "../bots/strategies/EasyBot";
import { HardBot } from "../bots/strategies/HardBot";
import { MediumBot } from "../bots/strategies/MediumBot";
import { BotDecision } from "../bots/BotDecision";
import { PlayedCard } from "../domain/trick/PlayedCard";


const players: Player[] = PlayerFactory.createPlayers("hard");

const roundState: RoundState = {
    roundNumber: 1,
    trumpSuit: null,
    championPlayerId: null,
    trumpDeclared: false,
};

const trick: Trick = TrickFactory.create(1);

console.log("===== PLAYERS =====");

players.forEach(player => {
    console.log(
        player.name,
        player.hand.length
    );
});

console.log("\n===== PLAYING =====");

for (const player of players) {

    const legalCards: Card[] =
        LegalMoveGenerator.getLegalCards(
            player,
            trick
        );

    const bot: EasyBot | MediumBot | HardBot =
        BotFactory.create("medium");

    const decision: BotDecision =
        bot.chooseCard(
            player,
            legalCards,
            trick,
            roundState
        );
    const card: Card = decision.card;
    console.log(
        `${player.name} played`,
        card
    );

    TrickEngine.playCard(
        trick,
        player,
        card,
        roundState
    );
}

console.log("\n===== TRICK =====");

console.log(trick);

console.log("\n===== TRUMP =====");

console.log(roundState.trumpSuit);

const winner: PlayedCard =
    WinnerResolver.resolve(
        trick,
        roundState
    );

console.log("\n===== WINNER =====");

console.log(winner);
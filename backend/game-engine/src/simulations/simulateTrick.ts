import { TrickEngine } from "../engines/TrickEngine.js";
import { WinnerResolver } from "../rules/WinnerResolver.js";
import { BotFactory } from "../factories/BotFactory.js";
import { PlayerFactory } from "../factories/PlayerFactory.js";
import { TrickFactory } from "../factories/TrickFactory.js";
import { RoundState } from "../domain/round/RoundState.js";
import { LegalMoveGenerator } from "../rules/LegalMoveGenerator.js";
import { Player } from "../core/Player.js";
import { Trick } from "../domain/trick/Trick.js";
import { Card } from "../core/Card.js";
import { EasyBot } from "../bots/strategies/EasyBot.js";
import { HardBot } from "../bots/strategies/HardBot.js";
import { MediumBot } from "../bots/strategies/MediumBot.js";
import { BotDecision } from "../bots/BotDecision.js";
import { PlayedCard } from "../domain/trick/PlayedCard.js";


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
import { TrickEngine } from "../engines/TrickEngine";
import { WinnerResolver } from "../rules/WinnerResolver";
import { BotFactory } from "../factories/BotFactory";
import { PlayerFactory } from "../factories/PlayerFactory";
import { TrickFactory } from "../factories/TrickFactory";
import { RoundState } from "../domain/round/RoundState";
import { LegalMoveGenerator } from "../rules/LegalMoveGenerator";


const players = PlayerFactory.createPlayers("hard");

const roundState: RoundState = {
    roundNumber: 1,
    trumpSuit: null,
    championPlayerId: null,
    trumpDeclared: false,
};

const trick = TrickFactory.create(1);

console.log("===== PLAYERS =====");

players.forEach(player => {
    console.log(
        player.name,
        player.hand.length
    );
});

console.log("\n===== PLAYING =====");

for (const player of players) {

    const legalCards =
        LegalMoveGenerator.getLegalCards(
            player,
            trick
        );

    const bot =
        BotFactory.create("medium");

    const decision =
        bot.chooseCard(
            player,
            legalCards,
            trick,
            roundState
        );
    const card = decision.card;
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

const winner =
    WinnerResolver.resolve(
        trick,
        roundState
    );

console.log("\n===== WINNER =====");

console.log(winner);
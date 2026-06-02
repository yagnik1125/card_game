import { TrickFactory } from "../game/TrickFactory";
import { TrickEngine } from "../game/TrickEngine";
import { WinnerResolver } from "../game/WinnerResolver";
import { RoundState } from "../game/RoundState";
import { MoveGenerator } from "../game/MoveGenerator";
import { EasyBot } from "../bots/EasyBot";
import { PlayerFactory } from "../game/PlayerFactory";
import { BotFactory } from "../bots/BotFactory";

const players = PlayerFactory.createPlayers();

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
        MoveGenerator.getLegalCards(
            player,
            trick
        );

    const bot =
        BotFactory.create("medium");

    const card =
        bot.chooseCard(
            player,
            legalCards,
            trick,
            roundState
        );

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
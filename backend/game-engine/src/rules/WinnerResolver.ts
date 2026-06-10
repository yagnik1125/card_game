import { Suit } from "../core/enums.js";
import { RoundState } from "../domain/round/RoundState.js";
import { PlayedCard } from "../domain/trick/PlayedCard.js";
import { Trick } from "../domain/trick/Trick.js";


export class WinnerResolver {
    static resolve(
        trick: Trick,
        roundState: RoundState
    ): PlayedCard {
        const trumpSuit: Suit | null = roundState.trumpSuit;
        if (trumpSuit) {
            const trumpCards: PlayedCard[] = trick.plays.filter(play => play.card.suit === trumpSuit);
            if (trumpCards.length > 0) {
                return trumpCards.reduce(
                    (best, current) =>
                        current.card.rank >
                            best.card.rank
                            ? current
                            : best
                );
            }
        }
        const leadSuit: Suit = trick.leadSuit!;
        return trick.plays.filter(play => play.card.suit === leadSuit)
            .reduce(
                (best, current) =>
                    current.card.rank >
                        best.card.rank
                        ? current
                        : best
            );
    }
}
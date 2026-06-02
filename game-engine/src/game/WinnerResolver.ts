import { PlayedCard, Trick } from "./Trick";
import { RoundState } from "./RoundState";

export class WinnerResolver {
    static resolve(
        trick: Trick,
        roundState: RoundState
    ): PlayedCard {
        const trumpSuit = roundState.trumpSuit;
        if (trumpSuit) {
            const trumpCards = trick.plays.filter(play => play.card.suit === trumpSuit);
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
        const leadSuit = trick.leadSuit!;
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
import { useSelector } from "react-redux";
import Card from "./Card";
import { suitOrder } from "@/utils/constants";
import type { RootState } from "@/store/store";

interface Props {
    cards: any[];
    legalMoves: string[];
    trumpSuit: string;
    onPlay: (cardId: string) => void;
    disabled?: boolean;
}

export default function PlayerHand({ cards, legalMoves, trumpSuit, onPlay, disabled }: Props) {
    const sortedCards = [...cards].sort((a, b) => {
        const suitDiff = suitOrder[a.suit] - suitOrder[b.suit];
        if (suitDiff !== 0) {
            return suitDiff;
        }
        return b.rank - a.rank;
    });
    const dealing = useSelector(
        (state: RootState) => state.game.dealing
    );
    const count = sortedCards.length;
    const cardPitch = 66;
    return (
        <div className="flex justify-center px-8">
            {sortedCards.map((card, index) => {
                const legal = legalMoves.includes(card.id);
                const centerOffset = (index - (count - 1) / 2) * cardPitch;

                return (
                    <div
                        key={card.id}
                        className={`
                            ${index !== 0 ? "ml-[-3.5%]" : ""}
                            transition-all
                            duration-700
                            ease-out
                            will-change-transform
                        `}
                        style={{
                            zIndex: index,
                            transform: dealing
                                ? `translate(${-centerOffset}px, -38vh) scale(0.3)`
                                : undefined,
                            opacity: dealing ? 0 : 1,
                            transitionDelay: `${index * 90}ms`
                        }}
                    >
                        <Card
                            card={card}
                            disabled={!legal || disabled}
                            trumpSuit={trumpSuit}
                            onClick={() => onPlay(card.id)}
                        />
                    </div>
                );
            })}
        </div>
    );
}
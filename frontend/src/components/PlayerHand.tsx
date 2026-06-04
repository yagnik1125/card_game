import Card from "./Card";

interface Props {
    cards: any[];
    legalMoves: string[];
    trumpSuit: string;
    onPlay: (cardId: string) => void;
    disabled?: boolean;
}

export default function PlayerHand({ cards, legalMoves, trumpSuit, onPlay, disabled }: Props) {
    return (
        <div className="flex justify-center px-8">
            {cards.map((card, index) => {
                const legal = legalMoves.includes(card.id);

                return (
                    <div
                        key={card.id}
                        className={index !== 0 ? "-ml-5" : ""}
                        style={{ zIndex: index }}
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
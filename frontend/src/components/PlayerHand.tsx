import Card from "./Card";
import {
    Card as CardType,
} from "../types/game";

interface Props {
    cards: CardType[];
    onPlay: (
        cardId: string
    ) => void;
}

export default function PlayerHand({
    cards,
    onPlay,
}: Props) {
    return (
        <div>
            {cards.map(card => (
                <Card
                    key={card.id}
                    card={card}
                    onClick={() =>
                        onPlay(card.id)
                    }
                />
            ))}
        </div>
    );
}
import { Card as CardType }
    from "../types/game";

interface Props {
    card: CardType;
    onClick?: () => void;
}

export default function Card({
    card,
    onClick,
}: Props) {
    return (
        <button
            onClick={onClick}
        >
            {card.rank}
            {" "}
            {card.suit}
        </button>
    );
}
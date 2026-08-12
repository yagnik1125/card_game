import { fireEvent, render, screen } from "@testing-library/react";
import Card from "./Card";

const baseCard = { id: "c1", suit: "HEARTS", rank: 14 };

describe("Card", () => {
    it("renders rank and suit symbols", () => {
        render(<Card card={baseCard} trumpSuit="SPADES" />);
        const button = screen.getByRole("button");
        expect(button).toHaveTextContent("A");
        expect(button).toHaveTextContent("♥️");
    });

    it("is disabled when the disabled prop is true", () => {
        const { container } = render(
            <Card card={baseCard} disabled trumpSuit="SPADES" />
        );
        expect(screen.getByRole("button")).toBeDisabled();
        expect(container.querySelector(".lucide-lock")).toBeInTheDocument();
    });

    it("is enabled by default", () => {
        render(<Card card={baseCard} trumpSuit="SPADES" />);
        expect(screen.getByRole("button")).toBeEnabled();
    });

    it("calls onClick when clicked", () => {
        const onClick = vi.fn();
        render(<Card card={baseCard} trumpSuit="SPADES" onClick={onClick} />);
        fireEvent.click(screen.getByRole("button"));
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("does not call onClick when disabled", () => {
        const onClick = vi.fn();
        render(<Card card={baseCard} disabled trumpSuit="SPADES" onClick={onClick} />);
        fireEvent.click(screen.getByRole("button"));
        expect(onClick).not.toHaveBeenCalled();
    });
});

import { render } from "@testing-library/react";
import { BotCards } from "./BotCards";

describe("BotCards", () => {
    it("renders one card back per card", () => {
        const { container } = render(
            <BotCards count={5} seat="top" />
        );
        expect(container.querySelectorAll("div.w-7.h-10")).toHaveLength(5);
    });

    it("renders a vertical pile for side seats", () => {
        const { container } = render(
            <BotCards count={3} vertical seat="left" />
        );
        expect(container.firstElementChild).toHaveClass("flex-col");
    });

    it("keeps cards at their seat when not dealing", () => {
        const { container } = render(
            <BotCards count={2} seat="top" />
        );
        const card = container.querySelector("div.w-7.h-10")!;
        expect(card).not.toHaveStyle("opacity: 0");
    });

    it("hides the pile at the deck position while dealing", () => {
        const { container } = render(
            <BotCards count={2} dealing seat="right" />
        );
        const card = container.querySelector("div.w-7.h-10")!;
        expect(card).toHaveStyle("opacity: 0");
        expect(card).toHaveStyle(
            "transform: translate(182.75px, 0px) scale(0.3)"
        );
    });
});

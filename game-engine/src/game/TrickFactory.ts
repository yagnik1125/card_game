import { Trick } from "./Trick";

export class TrickFactory {
    static create(trickNumber: number): Trick {
        return {
            trickNumber,
            leadSuit: null,
            plays: [],
        };
    }
}
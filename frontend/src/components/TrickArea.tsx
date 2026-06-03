import {
    useSelector
} from "react-redux";

import type {
    RootState
} from "@/store/store";

export default function TrickArea() {
    const trick = useSelector(
        (state: RootState) => state.game.trickCards
    );
    return (
        <div className="
                relative
                w-72
                h-56
            "
        >
            {
                trick.map((play: any, index: number) => (
                    <div
                        key={index}
                        className="
                                absolute
                                bg-white
                                text-black
                                rounded
                                shadow
                                w-20
                                h-28
                                flex
                                flex-col
                                items-center
                                justify-center
                                transition-all
                                duration-500
                            "
                        style={{
                            left: index * 55,
                            top: index % 2 ? 40 : 0
                        }}
                    >
                        <div>
                            {play.playerId}
                        </div>
                        <div>
                            {play.rank}
                        </div>
                    </div>
                )
                )
            }
        </div>
    )
}
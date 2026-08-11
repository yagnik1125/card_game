import { useCallback, useEffect, useRef, useState } from "react";
import {
    ChevronLeft,
    ChevronRight,
    X,
    Trophy,
    Hand,
    Shuffle,
    Swords,
    Medal,
    Sparkles,
    Crown,
    Flag,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const FLIP_MS = 950;
const OPEN_MS = 1500;
const CLOSE_MS = 1500;

function computeBookSize() {
    const bookH = Math.min(window.innerHeight * 0.66, 560);
    const openW = Math.min(bookH * 1.5, window.innerWidth * 0.92);
    const closedW = openW / 2;
    return { h: bookH, openW, closedW };
}

interface RulePage {
    titlePage?: boolean;
    dark?: boolean;
    eyebrow?: string;
    title?: string;
    icon?: LucideIcon;
    body?: string[];
    points?: string[];
}

const spreads: [RulePage, RulePage][] = [
    [
        { titlePage: true },
        {
            eyebrow: "Welcome",
            title: "The Objective",
            icon: Trophy,
            body: [
                "Trump & Twist is a trick-taking card game for 4 players. Win tricks, win rounds, and become the champion.",
            ],
            points: [
                "Win the most rounds to win the match.",
                "All tied up? Total tricks decide the winner",
            ],
        },
    ],
    [
        {
            eyebrow: "The Setup",
            title: "The Deal",
            icon: Hand,
            body: [
                "A standard 52-card deck is dealt evenly — every player starts with 13 cards.",
            ],
            points: [
                "SOLO — You play against 3 bots.",
                "TEAMS — 2v2, partners sit opposite.",
                "Ace is high, 2 is the lowest card.",
            ],
        },
        {
            eyebrow: "The Structure",
            title: "Round & Trick",
            icon: Shuffle,
            body: [
                "A match lasts 1-5 rounds, and every round is 13 tricks — one trick for every card in your hand.",
            ],
            points: [
                "A trick = one card from each player, in turn",
                "The trick winner leads the next trick",
            ],
        },
    ],
    [
        {
            eyebrow: "Playing Cards",
            title: "Follow Suit",
            icon: Swords,
            body: [
                "The leader plays any card from their hand — its suit becomes the lead suit for that trick.",
            ],
            points: [
                "Everyone else must play the same suit if they can",
                "Out of that suit? You may play any card",
            ],
        },
        {
            eyebrow: "Winning",
            title: "Winning a Trick",
            icon: Medal,
            body: [
                "The highest card of the lead suit wins the trick — unless a trump card appears.",
            ],
            points: [
                "Trump beats every non-trump card",
                "The highest trump takes the trick",
            ],
        },
    ],
    [
        {
            eyebrow: "Trump Suit",
            title: "The Trump Suit",
            icon: Sparkles,
            body: [
                "If one player is out of lead suit cards then he can declare trump suit if he is not the winner of previous round.",
            ],
            points: [
                "Trump cards outrank all other suits",
                "A low trump beats a high card of any suit",
            ],
        },
        {
            eyebrow: "Leadership",
            title: "The Champion",
            icon: Crown,
            body: [
                "Win the most tricks in a round and you become the Round Champion.",
            ],
            points: [
                "The champion can not declare the trump next round",
                "Rounds won are added to your tally",
            ],
        },
    ],
    [
        {
            eyebrow: "The Finish",
            title: "Winning the Match",
            icon: Flag,
            body: [
                "Every trick you win scores +1, and the player — or team — with the most tricks wins the round.",
            ],
            points: [
                "Win the most rounds to claim the match",
                "In 2V2, partners share the team score",
                "Pick a bot difficulty and claim the crown",
            ],
        },
        { dark: true },
    ],
];

export default function RuleBook({
    onClose,
}: {
    onClose: () => void;
}) {
    const [index, setIndex] = useState(0);
    const [flip, setFlip] = useState<null | "next" | "prev">(null);
    const [flipAnimate, setFlipAnimate] = useState(false);
    const [phase, setPhase] = useState<
        "closed" | "opening" | "open" | "closing"
    >("closed");
    const [size, setSize] = useState(computeBookSize);
    const timers = useRef<number[]>([]);
    const closingRef = useRef(false);

    const schedule = useCallback((fn: () => void, ms: number) => {
        const id = window.setTimeout(fn, ms);
        timers.current.push(id);
    }, []);

    useEffect(() => {
        const ids = timers.current;
        schedule(() => {
            if (!closingRef.current) setPhase("opening");
        }, 450);
        schedule(() => {
            if (!closingRef.current) setPhase("open");
        }, 450 + OPEN_MS);
        return () => {
            ids.forEach((id) => window.clearTimeout(id));
        };
    }, [schedule]);

    useEffect(() => {
        const onResize = () => setSize(computeBookSize());
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    const closing = phase === "closing";

    const go = useCallback(
        (dir: "next" | "prev") => {
            if (flip || closing || phase !== "open") {
                return;
            }
            if (dir === "next" && index >= spreads.length - 1) {
                return;
            }
            if (dir === "prev" && index <= 0) {
                return;
            }
            setFlip(dir);
            setFlipAnimate(false);
            requestAnimationFrame(() =>
                requestAnimationFrame(() => setFlipAnimate(true))
            );
            schedule(() => {
                if (closingRef.current) {
                    return;
                }
                setIndex((i) => (dir === "next" ? i + 1 : i - 1));
                setFlip(null);
            }, FLIP_MS);
        },
        [flip, closing, phase, index, schedule]
    );

    const close = useCallback(() => {
        if (closingRef.current) {
            return;
        }
        closingRef.current = true;
        setFlip(null);
        setFlipAnimate(false);
        setPhase("closing");
        schedule(() => onClose(), CLOSE_MS);
    }, [onClose, schedule]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                close();
            }
            if (e.key === "ArrowRight") {
                go("next");
            }
            if (e.key === "ArrowLeft") {
                go("prev");
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [close, go]);

    const left = spreads[index][0];
    const right = spreads[index][1];

    const shownLeft = flip === "prev" ? spreads[index - 1][0] : left;
    const shownRight = flip === "next" ? spreads[index + 1][1] : right;

    const renderBody = (body: string[]) =>
        body.map((p, i) => (
            <p
                key={i}
                className="
                    text-[13px]
                    leading-relaxed
                    text-slate-700
                    text-justify
                "
            >
                {i === 0 ? (
                    <>
                        <span className="rulebook-dropcap">
                            {p.charAt(0)}
                        </span>
                        {p.slice(1)}
                    </>
                ) : (
                    p
                )}
            </p>
        ));

    const renderPaper = (
        page: RulePage,
        side: "left" | "right"
    ) => (
        <div className="
            relative
            h-full
            w-full
            flex
            flex-col
            bg-[#f6efdf]
            text-slate-800
            overflow-hidden
        ">
            {/* paper base + grain */}
            <div className="
                absolute
                inset-0
                bg-linear-to-br
                from-[#fdf8ec]
                via-[#f6efdf]
                to-[#eadfc6]
            " />
            <div className="
                absolute
                inset-0
                opacity-[0.05]
                bg-[repeating-linear-gradient(0deg,transparent,transparent_3px,#7a5a20_3px,#7a5a20_4px)]
            " />
            <div className="
                absolute
                inset-0
                bg-radial
                from-transparent
                via-transparent
                to-black/10
            " />

            {/* margin frames */}
            <div className="
                absolute
                inset-3
                border
                border-amber-900/25
                pointer-events-none
            " />
            <div className="
                absolute
                inset-[15px]
                border
                border-amber-900/10
                pointer-events-none
            " />
            <span className="
                absolute
                top-3
                left-3
                w-1.5
                h-1.5
                rotate-45
                bg-amber-800/50
                pointer-events-none
            " />
            <span className="
                absolute
                top-3
                right-3
                w-1.5
                h-1.5
                rotate-45
                bg-amber-800/50
                pointer-events-none
            " />
            <span className="
                absolute
                bottom-3
                left-3
                w-1.5
                h-1.5
                rotate-45
                bg-amber-800/50
                pointer-events-none
            " />
            <span className="
                absolute
                bottom-3
                right-3
                w-1.5
                h-1.5
                rotate-45
                bg-amber-800/50
                pointer-events-none
            " />

            {/* spine-side shading */}
            <div className={`
                absolute
                top-0
                bottom-0
                w-10
                pointer-events-none
                ${side === "left"
                    ? "right-0 bg-linear-to-l from-black/20 via-black/5 to-transparent"
                    : "left-0 bg-linear-to-r from-black/20 via-black/5 to-transparent"
                }
            `} />

            {/* corner curl */}
            <div className={`
                absolute
                bottom-0
                w-10
                h-10
                pointer-events-none
                ${side === "left"
                    ? "left-0 bg-[linear-gradient(45deg,transparent_40%,#efe6cd_52%,#d9ccad_62%,#c9b892)] rounded-br-full"
                    : "right-0 bg-[linear-gradient(135deg,transparent_40%,#efe6cd_52%,#d9ccad_62%,#c9b892)] rounded-bl-full"
                }
            `} />

            <div className="
                relative
                flex-1
                flex
                flex-col
                px-9
                pt-7
                pb-3
            ">
                {/* running head */}
                <div className="
                    flex
                    items-center
                    justify-center
                    gap-2.5
                    text-[9px]
                    font-bold
                    tracking-[0.35em]
                    text-amber-800/60
                ">
                    <span>♠</span>
                    <span>TRUMP &amp; TWIST</span>
                    <span>♠</span>
                </div>
                <div className="
                    mt-2
                    h-px
                    w-full
                    bg-linear-to-r
                    from-transparent
                    via-amber-800/30
                    to-transparent
                " />

                {/* centered title block */}
                <div className="mt-5 text-center">
                    {page.icon && (
                        <div className="
                            mx-auto
                            mb-3
                            w-8
                            h-8
                            rounded-full
                            border
                            border-amber-700/25
                            bg-amber-700/10
                            flex
                            items-center
                            justify-center
                        ">
                            <page.icon
                                size={14}
                                className="text-amber-700"
                            />
                        </div>
                    )}
                    <div className="
                        text-[10px]
                        uppercase
                        tracking-[0.4em]
                        font-bold
                        text-amber-700/80
                    ">
                        {page.eyebrow}
                    </div>
                    <h3 className="
                        mt-1.5
                        font-display
                        font-black
                        text-[26px]
                        leading-tight
                        text-slate-900
                    ">
                        {page.title}
                    </h3>
                    <div className="
                        mt-2.5
                        flex
                        items-center
                        justify-center
                        gap-2
                        text-amber-700/70
                    ">
                        <span className="h-px w-8 bg-amber-800/30" />
                        <span className="text-xs">❖</span>
                        <span className="h-px w-8 bg-amber-800/30" />
                    </div>
                </div>

                {/* body */}
                {page.body && page.body.length > 0 && (
                    <div className="mt-4 space-y-3">
                        {renderBody(page.body)}
                    </div>
                )}

                {page.points && page.points.length > 0 && (
                    <ul className="mt-4 space-y-2">
                        {page.points.map((pt, i) => (
                            <li
                                key={i}
                                className="
                                    flex
                                    items-start
                                    gap-2.5
                                    text-[13px]
                                    leading-snug
                                    text-slate-700
                                "
                            >
                                <span className={`
                                    mt-px
                                    shrink-0
                                    text-sm
                                    font-black
                                    ${i % 2 === 1 ? "text-red-600" : "text-slate-800"}
                                `}>
                                    {["♠", "♥", "♣", "♦"][i % 4]}
                                </span>
                                <span>{pt}</span>
                            </li>
                        ))}
                    </ul>
                )}

                <div className="flex-1" />
            </div>
        </div>
    );

    const renderTitlePage = () => (
        <div className="
            relative
            h-full
            w-full
            bg-[#f6efdf]
            flex
            flex-col
            items-center
            justify-center
            text-center
            overflow-hidden
            px-8
        ">
            <div className="
                absolute
                inset-0
                bg-linear-to-br
                from-[#fdf8ec]
                via-[#f6efdf]
                to-[#eadfc6]
            " />
            <div className="
                absolute
                inset-0
                opacity-[0.05]
                bg-[repeating-linear-gradient(0deg,transparent,transparent_3px,#7a5a20_3px,#7a5a20_4px)]
            " />
            <div className="
                absolute
                inset-0
                bg-radial
                from-transparent
                via-transparent
                to-black/10
            " />
            <div className="
                absolute
                inset-3
                border
                border-amber-900/25
                pointer-events-none
            " />

            <div className="relative flex flex-col items-center">
                <div className="flex gap-3 text-2xl mb-6">
                    <span className="text-slate-800">♠</span>
                    <span className="text-red-600">♥</span>
                    <span className="text-slate-800">♣</span>
                    <span className="text-red-600">♦</span>
                </div>
                <h2 className="
                    font-display
                    font-black
                    text-4xl
                    text-slate-900
                ">
                    Trump &amp; Twist
                </h2>
                <div className="
                    mt-3
                    w-14
                    h-[3px]
                    bg-linear-to-r
                    from-transparent
                    via-amber-600
                    to-transparent
                " />
                <p className="
                    mt-3
                    text-[11px]
                    uppercase
                    tracking-[0.4em]
                    text-amber-800/80
                    font-bold
                ">
                    The Official Rule Book
                </p>
                <p className="
                    mt-6
                    text-xs
                    text-slate-500
                    italic
                ">
                    A trick-taking card game for four players
                </p>
                <div className="mt-8 text-amber-700/70 text-sm">❖</div>
            </div>
        </div>
    );

    const renderBackCover = () => (
        <div className="
            relative
            h-full
            w-full
            bg-linear-to-br
            from-[#0c3b2d]
            via-[#0a3227]
            to-[#06221b]
            flex
            flex-col
            items-center
            justify-center
            overflow-hidden
        ">
            <div className="
                absolute
                inset-0
                bg-radial
                from-transparent
                via-transparent
                to-black/50
                pointer-events-none
            " />
            <div className="
                absolute
                inset-2.5
                border-2
                border-amber-500/40
                rounded-xl
                pointer-events-none
            " />
            <div className="
                relative
                flex
                flex-col
                items-center
                gap-4
                text-center
                px-6
            ">
                <div className="
                    w-14
                    h-14
                    rounded-full
                    bg-amber-500/15
                    border
                    border-amber-400/40
                    flex
                    items-center
                    justify-center
                    animate-trophy-pulse
                ">
                    <Trophy size={26} className="text-amber-300" />
                </div>
                <h2 className="
                    font-display
                    font-black
                    text-3xl
                    text-amber-300
                ">
                    Good luck,
                    <br />
                    Champion!
                </h2>
                <p className="text-amber-100/60 text-xs">
                    Shuffle up and deal.
                </p>
                <div className="flex gap-3 text-xl">
                    <span className="text-amber-300/90">♠</span>
                    <span className="text-red-400">♥</span>
                    <span className="text-amber-300/90">♣</span>
                    <span className="text-red-400">♦</span>
                </div>
            </div>
        </div>
    );

    const renderFrontCover = () => (
        <div className="
            relative
            h-full
            w-full
            bg-linear-to-br
            from-[#0e4a36]
            via-[#0b3b2d]
            to-[#072c21]
            flex
            flex-col
            items-center
            justify-center
            overflow-hidden
        ">
            {/* vignette + leather texture */}
            <div className="
                absolute
                inset-0
                bg-radial
                from-transparent
                via-transparent
                to-black/55
                pointer-events-none
            " />
            <div className="
                absolute
                inset-0
                opacity-[0.06]
                bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,#000_2px,#000_3px)]
            " />

            {/* raised spine bands */}
            <div className="
                absolute
                top-0
                bottom-0
                left-3
                w-[3px]
                bg-amber-500/30
            " />
            <div className="
                absolute
                top-[16%]
                left-1.5
                w-7
                h-[3px]
                bg-amber-500/40
            " />
            <div className="
                absolute
                top-[48%]
                left-1.5
                w-7
                h-[3px]
                bg-amber-500/40
            " />
            <div className="
                absolute
                top-[80%]
                left-1.5
                w-7
                h-[3px]
                bg-amber-500/40
            " />

            {/* gold frames + corner ornaments */}
            <div className="
                absolute
                inset-4
                border-2
                border-amber-500/45
                rounded-lg
                pointer-events-none
            " />
            <div className="
                absolute
                inset-6
                border
                border-amber-500/25
                rounded-md
                pointer-events-none
            " />
            <span className="
                absolute
                top-5
                left-5
                w-2
                h-2
                rotate-45
                bg-amber-400/80
            " />
            <span className="
                absolute
                top-5
                right-5
                w-2
                h-2
                rotate-45
                bg-amber-400/80
            " />
            <span className="
                absolute
                bottom-5
                left-5
                w-2
                h-2
                rotate-45
                bg-amber-400/80
            " />
            <span className="
                absolute
                bottom-5
                right-5
                w-2
                h-2
                rotate-45
                bg-amber-400/80
            " />

            {/* emblem */}
            <div className="
                relative
                flex
                flex-col
                items-center
                gap-4
                text-center
                px-8
            ">
                <div className="flex gap-3 text-4xl">
                    <span className="text-amber-300/90">♠</span>
                    <span className="text-red-400">♥</span>
                    <span className="text-amber-300/90">♣</span>
                    <span className="text-red-400">♦</span>
                </div>
                <div className="
                    text-[10px]
                    uppercase
                    tracking-[0.5em]
                    text-amber-200/70
                    font-bold
                ">
                    The Official
                </div>
                <h2 className="
                    font-display
                    font-black
                    text-4xl
                    sm:text-5xl
                    leading-tight
                    text-transparent
                    bg-clip-text
                    bg-linear-to-b
                    from-amber-200
                    via-amber-400
                    to-amber-600
                    tracking-wide
                ">
                    Trump &amp; Twist
                </h2>
                <div className="w-24 h-px bg-amber-400/60" />
                <div className="
                    text-sm
                    tracking-[0.35em]
                    text-amber-200/80
                    uppercase
                    font-bold
                ">
                    Rule Book
                </div>
                <p className="text-[11px] text-amber-100/50">
                    A trick-taking card game for four players
                </p>
            </div>

            {/* bookmark ribbon */}
            <div className="
                absolute
                bottom-[-16px]
                right-[18%]
                w-5
                h-14
                bg-linear-to-b
                from-red-600
                via-red-700
                to-red-900
                shadow-lg
                [clip-path:polygon(0_0,100%_0,100%_80%,50%_100%,0_80%)]
            " />
        </div>
    );

    const renderPage = (
        page: RulePage,
        side: "left" | "right"
    ) => {
        if (page.titlePage) {
            return renderTitlePage();
        }
        if (page.dark) {
            return renderBackCover();
        }
        return renderPaper(page, side);
    };

    return (
        <div
            className="
                fixed
                inset-0
                z-200
                bg-black/85
                backdrop-blur-md
                flex
                items-center
                justify-center
                p-4
                animate-in
                fade-in
                duration-300
            "
            onClick={close}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="
                    relative
                    w-[min(92vw,900px)]
                "
            >
                <button
                    aria-label="Close rules"
                    onClick={close}
                    className="
                        absolute
                        -top-3
                        -right-3
                        z-50
                        w-10
                        h-10
                        rounded-full
                        bg-white/10
                        border
                        border-white/20
                        hover:bg-white/25
                        flex
                        items-center
                        justify-center
                        text-white
                        cursor-pointer
                        transition-all
                        hover:rotate-90
                    "
                >
                    <X size={18} />
                </button>
                <div className="animate-book-breathe">
                    <div className="relative" style={{ perspective: "2400px" }}>
                        <div
                            className="relative mx-auto rounded-xl"
                            style={{
                                height: size.h,
                                width:
                                    phase === "closed" || phase === "closing"
                                        ? size.closedW
                                        : size.openW,
                                transform:
                                    phase === "closed" || phase === "closing"
                                        ? `translateX(-${size.closedW}px)`
                                        : "translateX(0px)",
                                transition:
                                    "width 1.5s cubic-bezier(0.4, 0.05, 0.2, 1), transform 1.5s cubic-bezier(0.4, 0.05, 0.2, 1)",
                            }}
                        >

                            {/* pages layer — clipped while the book is closed */}
                            <div className={`
                                absolute
                                inset-0
                                z-10
                                rounded-xl
                                ${phase === "open" ? "" : "overflow-hidden"}
                            `}>
                                {/* turning shadow sweep */}
                                {(flip || phase === "opening") && (
                                    <div className="
                                        absolute
                                        inset-0
                                        z-[25]
                                        pointer-events-none
                                        rulebook-sweep
                                    " />
                                )}

                                {/* LEFT page block — rendered only when the book is open;
                                    while closed/opening the cover itself is the left side */}
                                {phase === "open" && (
                                    <div
                                        className="absolute inset-y-0"
                                        style={{ left: 0, width: size.closedW }}
                                    >
                                        <div className="
                                            absolute
                                            inset-y-1
                                            left-[-6px]
                                            right-4
                                            bg-[#dfd3b4]
                                            rounded-l-2xl
                                        " />
                                        <div className="
                                            absolute
                                            inset-y-0.5
                                            left-[-4px]
                                            right-3
                                            bg-[#e9debe]
                                            rounded-l-2xl
                                        " />
                                        <div className="
                                            absolute
                                            inset-y-0
                                            left-[-2px]
                                            right-2
                                            bg-[#f2ead1]
                                            rounded-l-2xl
                                        " />
                                        <div className="
                                            absolute
                                            inset-0
                                            rounded-l-2xl
                                            overflow-hidden
                                            shadow-[inset_-8px_0_14px_rgba(0,0,0,0.12)]
                                        ">
                                            {renderPage(
                                                shownLeft,
                                                "left"
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* RIGHT page block */}
                                <div
                                    className="absolute inset-y-0"
                                    style={{
                                        left: size.closedW,
                                        width: size.closedW,
                                    }}
                                >
                                    {!shownRight.dark && (
                                        <>
                                            <div className="
                                                absolute
                                                inset-y-1
                                                right-[-6px]
                                                left-4
                                                bg-[#dfd3b4]
                                                rounded-r-2xl
                                            " />
                                            <div className="
                                                absolute
                                                inset-y-0.5
                                                right-[-4px]
                                                left-3
                                                bg-[#e9debe]
                                                rounded-r-2xl
                                            " />
                                            <div className="
                                                absolute
                                                inset-y-0
                                                right-[-2px]
                                                left-2
                                                bg-[#f2ead1]
                                                rounded-r-2xl
                                            " />
                                        </>
                                    )}
                                    <div className="
                                        absolute
                                        inset-0
                                        rounded-r-2xl
                                        overflow-hidden
                                        shadow-[inset_8px_0_14px_rgba(0,0,0,0.12)]
                                    ">
                                        {renderPage(
                                            shownRight,
                                            "right"
                                        )}
                                    </div>
                                </div>

                                {/* spine + gutter */}
                                <div className="
                                    absolute
                                    top-0
                                    bottom-0
                                    left-1/2
                                    -translate-x-1/2
                                    w-px
                                    bg-black/40
                                    z-[15]
                                " />
                                <div className="
                                    absolute
                                    top-0
                                    bottom-0
                                    left-1/2
                                    -translate-x-1/2
                                    w-12
                                    bg-linear-to-r
                                    from-transparent
                                    via-black/25
                                    to-transparent
                                    z-[15]
                                    pointer-events-none
                                " />

                                {/* flipping page overlay */}
                                {flip === "next" && !closing && (
                                    <div className={`
                                        rulebook-flip
                                        ${flipAnimate ? "rulebook-flip-next" : ""}
                                    `}>
                                        <div className="rulebook-flip-face">
                                            {renderPage(right, "right")}
                                        </div>
                                        <div
                                            className="rulebook-flip-face"
                                            style={{ transform: "rotateY(180deg)" }}
                                        >
                                            {renderPage(
                                                spreads[index + 1][0],
                                                "left"
                                            )}
                                        </div>
                                    </div>
                                )}
                                {flip === "prev" && !closing && (
                                    <div
                                        className={`
                                            rulebook-flip
                                            ${flipAnimate ? "rulebook-flip-prev" : ""}
                                        `}
                                        style={
                                            flipAnimate
                                                ? undefined
                                                : { transform: "rotateY(-180deg)" }
                                        }
                                    >
                                        <div className="rulebook-flip-face">
                                            {renderPage(
                                                spreads[index - 1][1],
                                                "right"
                                            )}
                                        </div>
                                        <div
                                            className="rulebook-flip-face"
                                            style={{ transform: "rotateY(180deg)" }}
                                        >
                                            {renderPage(left, "left")}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* front cover — outside the page clip so it can swing open */}
                            <div
                                className={`
                                    rulebook-cover
                                    ${phase === "opening" ? "rulebook-cover-open" : phase === "open" ? "rulebook-cover-open-hold" : ""}
                                `}
                                style={{
                                    left: size.closedW,
                                    width: size.closedW,
                                }}
                            >
                                <div className="rulebook-cover-face">
                                    {renderFrontCover()}
                                </div>
                                <div
                                    className="rulebook-cover-face"
                                    style={{ transform: "rotateY(180deg)" }}
                                >
                                    {renderTitlePage()}
                                </div>
                            </div>
                        </div>

                        {/* shadow under the book (not affected by the stage translate) */}
                        <div
                            className="
                                absolute
                                -bottom-5
                                left-1/2
                                -translate-x-1/2
                                h-8
                                bg-black/60
                                blur-2xl
                                rounded-full
                                pointer-events-none
                            "
                            style={{
                                width:
                                    (phase === "closed" ||
                                        phase === "closing"
                                        ? size.closedW
                                        : size.openW) * 0.88,
                                transition:
                                    "width 1.5s cubic-bezier(0.4, 0.05, 0.2, 1)",
                            }}
                        />
                    </div>
                </div>

                {/* controls */}
                <div className="
                    mt-8
                    flex
                    items-center
                    justify-center
                    gap-6
                ">
                    <button
                        aria-label="Previous page"
                        onClick={() => go("prev")}
                        disabled={
                            index === 0 || flip !== null || phase !== "open"
                        }
                        className="
                            w-11
                            h-11
                            rounded-full
                            bg-white/10
                            border
                            border-white/15
                            hover:bg-white/20
                            flex
                            items-center
                            justify-center
                            text-white
                            cursor-pointer
                            disabled:opacity-30
                            disabled:cursor-not-allowed
                            transition-all
                        "
                    >
                        <ChevronLeft size={20} />
                    </button>

                    <div className="flex items-center gap-2">
                        {spreads.map((_, i) => (
                            <span
                                key={i}
                                className={`
                                    w-2.5
                                    h-2.5
                                    rounded-full
                                    transition-all
                                    ${i === index
                                        ? "bg-amber-400 w-6"
                                        : "bg-white/20"
                                    }
                                `}
                            />
                        ))}
                    </div>

                    <div className="
                        text-white/70
                        text-sm
                        font-semibold
                        min-w-12
                        text-center
                    ">
                        {index + 1} / {spreads.length}
                    </div>

                    <button
                        aria-label="Next page"
                        onClick={() => go("next")}
                        disabled={
                            index === spreads.length - 1 ||
                            flip !== null ||
                            phase !== "open"
                        }
                        className="
                            w-11
                            h-11
                            rounded-full
                            bg-white/10
                            border
                            border-white/15
                            hover:bg-white/20
                            flex
                            items-center
                            justify-center
                            text-white
                            cursor-pointer
                            disabled:opacity-30
                            disabled:cursor-not-allowed
                            transition-all
                        "
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>

                <div className="
                    mt-4
                    text-center
                    text-[11px]
                    text-white/40
                    uppercase
                    tracking-[0.3em]
                ">
                    Use arrow keys or buttons to flip
                </div>
            </div>
        </div>
    );
}

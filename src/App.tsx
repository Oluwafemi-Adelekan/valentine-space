import { useState, useCallback, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LandingScreen } from "./components/LandingScreen";
import { MainStage } from "./components/MainStage";
import { QuoteSection } from "./components/QuoteSection";
import { GuySection } from "./components/GuySection";
import { MemoriesTicker } from "./components/MemoriesTicker";
import { LiveCam } from "./components/LiveCam";
import { AudioPlayer } from "./components/AudioPlayer";
import { SectionVoiceover } from "./components/SectionVoiceover";

// Audio imports
import heroAudio from "./assets/Hero.mp3";
import quoteAudio from "./assets/Love quote.mp3";
import guyAudio from "./assets/Cool guy.mp3";
import carouselAudio from "./assets/Carousel section.mp3";

const SECTION_COUNT = 4;
const SECTION_LABELS = ["Hero", "Quote", "Guy", "Memories"];

// ─── Subtitle data ───
const heroSubs = [
    { time: 0, text: "Hey there. So, uh, since you made it this far..." },
    { time: 4, text: "...it means like, you agreed to be my Valentine." },
    { time: 7, text: "I just wanted to say, I really love you, you know?" },
    { time: 11, text: "That's why I put this whole website together, to show you just how much you mean to me." },
    { time: 16, text: "So, take your time, scroll through it, and just enjoy it." },
    { time: 21, text: "Okay? You deserve it." },
];

const quoteSubs = [
    { time: 0, text: "Hey there. So, um, you know, I've been thinking about this a lot lately..." },
    { time: 5, text: "...and I just had to share it with you again. It's like, my absolute favorite love quote." },
    { time: 10, text: "And it goes like this:" },
    { time: 12, text: '"In all the world, there is no heart for me like yours.' },
    { time: 16, text: 'In all the world, there is no love for you like mine."' },
    { time: 21, text: "I just feel like it really captures everything, you know?" },
    { time: 25, text: "I thought it would be really nice for you to hear it from me again." },
    { time: 28, text: "Just to remind you how much you mean to me." },
];

const guySubs = [
    { time: 0, text: "Hey there. Uh, so, I just wanted to say, you know, there's really nothing to see here, just me." },
    { time: 6, text: "Still that goofy guy you know and love." },
    { time: 9, text: "I mean seriously, through all the ups and downs..." },
    { time: 12, text: "...my heart's still the same, you know? It's all about keeping that lighthearted spirit alive." },
    { time: 17, text: "Especially today." },
    { time: 19, text: "So, I hope you feel that warmth and joy, 'cause that's what you mean to me." },
    { time: 23, text: "Just wanted to remind you that I'm here, still your silly buddy sending all my love your way." },
];

const carouselSubs = [
    { time: 0, text: "Hey, um, so I just wanted to share something really special with you, you know?" },
    { time: 6, text: "This part, it just... it really shows my most fond memories of us." },
    { time: 12, text: "It's in black and white but... oh man, the magic happens when you hover over it." },
    { time: 18, text: "You see how life like, really comes alive when you step into my world, you know?" },
    { time: 24, text: "It's... it's just us." },
    { time: 27, text: "And, um, there are so many more memories to create together. I just feel it." },
];

function App() {
    const [isValentine, setIsValentine] = useState(false);
    const [current, setCurrent] = useState(0);
    const isAnimating = useRef(false);
    const deltaAccumulator = useRef(0);
    const accumulatorTimer = useRef<ReturnType<typeof setTimeout>>();

    const goTo = useCallback((index: number) => {
        const clamped = Math.max(0, Math.min(SECTION_COUNT - 1, index));
        if (clamped === current || isAnimating.current) return;
        isAnimating.current = true;
        setCurrent(clamped);
        setTimeout(() => { isAnimating.current = false; }, 900);
    }, [current]);

    useEffect(() => {
        if (!isValentine) return;
        const THRESHOLD = 50;

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            if (isAnimating.current) return;
            deltaAccumulator.current += e.deltaY;
            clearTimeout(accumulatorTimer.current);
            accumulatorTimer.current = setTimeout(() => { deltaAccumulator.current = 0; }, 200);
            if (Math.abs(deltaAccumulator.current) >= THRESHOLD) {
                if (deltaAccumulator.current > 0) goTo(current + 1);
                else goTo(current - 1);
                deltaAccumulator.current = 0;
            }
        };

        let touchStartY = 0;
        const handleTouchStart = (e: TouchEvent) => { touchStartY = e.touches[0].clientY; };
        const handleTouchEnd = (e: TouchEvent) => {
            if (isAnimating.current) return;
            const diff = touchStartY - e.changedTouches[0].clientY;
            if (Math.abs(diff) > 40) {
                if (diff > 0) goTo(current + 1);
                else goTo(current - 1);
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowDown" || e.key === " ") { e.preventDefault(); goTo(current + 1); }
            if (e.key === "ArrowUp") { e.preventDefault(); goTo(current - 1); }
        };

        window.addEventListener("wheel", handleWheel, { passive: false });
        window.addEventListener("touchstart", handleTouchStart, { passive: true });
        window.addEventListener("touchend", handleTouchEnd, { passive: true });
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("wheel", handleWheel);
            window.removeEventListener("touchstart", handleTouchStart);
            window.removeEventListener("touchend", handleTouchEnd);
            window.removeEventListener("keydown", handleKeyDown);
            clearTimeout(accumulatorTimer.current);
        };
    }, [isValentine, current, goTo]);

    return (
        <div className="bg-black w-full h-screen font-sans text-white overflow-hidden">
            <AudioPlayer isPlaying={isValentine} />
            <AnimatePresence mode="wait">
                {!isValentine ? (
                    <LandingScreen key="landing" onComplete={() => setIsValentine(true)} />
                ) : (
                    <motion.div
                        key="main"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1 }}
                        className="w-full h-full relative"
                    >
                        <LiveCam />

                        {/* Section Dot Indicators */}
                        <nav className="fixed right-6 top-1/2 -translate-y-1/2 z-[60] flex flex-col gap-4">
                            {SECTION_LABELS.map((label, i) => (
                                <button
                                    key={label}
                                    onClick={() => goTo(i)}
                                    className="group relative flex items-center justify-center w-5 h-5 cursor-pointer"
                                    aria-label={label}
                                >
                                    <span className={`absolute inset-0 rounded-full border transition-all duration-300 ${current === i ? "border-pink-400 scale-110" : "border-white/30 group-hover:border-white/60"
                                        }`} />
                                    <motion.span
                                        className="w-2 h-2 rounded-full"
                                        animate={{
                                            backgroundColor: current === i ? "#f472b6" : "transparent",
                                            scale: current === i ? 1 : 0,
                                        }}
                                        transition={{ duration: 0.3 }}
                                    />
                                    <span className="absolute right-8 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                        {label}
                                    </span>
                                </button>
                            ))}
                        </nav>

                        {/* Sections Container */}
                        <div
                            className="w-full transition-transform duration-700 ease-in-out will-change-transform"
                            style={{ transform: `translateY(-${current * 100}vh)` }}
                        >
                            {/* HERO */}
                            <div className="h-screen w-full relative">
                                <MainStage />
                                <SectionVoiceover audioSrc={heroAudio} subtitles={heroSubs} isActive={current === 0} />
                            </div>

                            {/* QUOTE */}
                            <div className="h-screen w-full relative">
                                <QuoteSection />
                                <SectionVoiceover audioSrc={quoteAudio} subtitles={quoteSubs} isActive={current === 1} />
                            </div>

                            {/* GUY */}
                            <div className="h-screen w-full relative">
                                <GuySection />
                                <SectionVoiceover audioSrc={guyAudio} subtitles={guySubs} isActive={current === 2} />
                            </div>

                            {/* MEMORIES */}
                            <div className="h-screen w-full relative">
                                <MemoriesTicker />
                                <SectionVoiceover audioSrc={carouselAudio} subtitles={carouselSubs} isActive={current === 3} />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default App;

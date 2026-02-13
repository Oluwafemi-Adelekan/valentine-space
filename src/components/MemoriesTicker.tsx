import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

import mem1 from "../assets/Memory 1.jpg";
import mem2 from "../assets/Memory 2.jpg";
import mem3 from "../assets/Memory 3.jpg";
import mem4 from "../assets/Memory 4.jpg";
import mem5 from "../assets/Memory 5.jpg";
import mem6 from "../assets/Memory 6.jpg";
import mem7 from "../assets/Memory 7.jpg";
import mem8 from "../assets/Memory 8.jpg";
import mem9 from "../assets/Memory 9.jpg";
import mem10 from "../assets/Memory 10.jpg";
import mem11 from "../assets/Memory 11.jpg";

const MEMORIES = [mem1, mem2, mem3, mem4, mem5, mem6, mem7, mem8, mem9, mem10, mem11];

export function MemoriesTicker() {
    // Triple the array for truly seamless infinite loop — no visible gap
    const tripled = [...MEMORIES, ...MEMORIES, ...MEMORIES];
    const [activeIndex, setActiveIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);

    // On mobile, detect which image is in the center of the viewport
    useEffect(() => {
        const isMobile = window.matchMedia("(max-width: 768px)").matches;
        if (!isMobile) return;

        const container = containerRef.current;
        if (!container) return;

        const observer = new IntersectionObserver(
            (entries) => {
                let bestEntry: IntersectionObserverEntry | null = null;
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        if (!bestEntry || entry.intersectionRatio > bestEntry.intersectionRatio) {
                            bestEntry = entry;
                        }
                    }
                }
                if (bestEntry) {
                    const idx = Number((bestEntry.target as HTMLElement).dataset.idx);
                    if (!isNaN(idx)) setActiveIndex(idx);
                }
            },
            { root: null, threshold: [0.5, 0.75, 1.0] }
        );

        const items = container.querySelectorAll("[data-idx]");
        items.forEach((item) => observer.observe(item));

        return () => observer.disconnect();
    }, []);

    return (
        <section className="h-screen bg-black overflow-hidden relative flex flex-col justify-center py-20 z-40">
            {/* Edge gradients for seamless fade */}
            <div className="absolute top-0 left-0 w-32 h-full bg-gradient-to-r from-black to-transparent z-10" />
            <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-black to-transparent z-10" />

            <div className="flex w-full">
                <motion.div
                    ref={containerRef}
                    className="flex gap-8 items-center px-4"
                    animate={{ x: [0, -(MEMORIES.length * 320)] }}
                    transition={{
                        repeat: Infinity,
                        duration: 60,
                        ease: "linear",
                    }}
                    style={{ willChange: "transform" }}
                >
                    {tripled.map((src, i) => {
                        const sizeClass =
                            i % 3 === 0
                                ? "w-[300px] h-[533px]"
                                : i % 3 === 1
                                    ? "w-[250px] h-[444px]"
                                    : "w-[350px] h-[622px]";

                        const isMobileActive = activeIndex === i;

                        return (
                            <div
                                key={i}
                                data-idx={i}
                                className={`${sizeClass} flex-shrink-0 overflow-hidden transition-all duration-700 transform hover:scale-105 border border-white/10 ${isMobileActive ? "grayscale-0" : "grayscale hover:grayscale-0"
                                    }`}
                            >
                                <img
                                    src={src}
                                    alt={`Memory ${(i % MEMORIES.length) + 1}`}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />
                            </div>
                        );
                    })}
                </motion.div>
            </div>

            <div className="absolute bottom-10 left-0 right-0 text-center z-20">
                <h3 className="text-white/50 font-mono text-sm tracking-widest uppercase relative inline-block overflow-hidden px-4 py-2">
                    <span className="relative z-10">...and many more to come</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                </h3>
            </div>
        </section>
    );
}

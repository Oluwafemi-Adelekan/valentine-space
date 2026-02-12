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
    // Double the array for seamless infinite loop
    const doubled = [...MEMORIES, ...MEMORIES];

    return (
        <section className="h-screen bg-black overflow-hidden relative flex flex-col justify-center py-20 z-40">
            {/* Edge gradients for seamless fade */}
            <div className="absolute top-0 left-0 w-32 h-full bg-gradient-to-r from-black to-transparent z-10" />
            <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-black to-transparent z-10" />

            <div className="flex w-full">
                <motion.div
                    className="flex gap-8 items-center px-4"
                    animate={{ x: [0, -(MEMORIES.length * 320)] }}
                    transition={{
                        repeat: Infinity,
                        duration: 60,
                        ease: "linear",
                    }}
                >
                    {doubled.map((src, i) => {
                        // Varied sizes: cycle through 3 size classes for visual rhythm
                        const sizeClass =
                            i % 3 === 0
                                ? "w-[300px] h-[533px]"
                                : i % 3 === 1
                                    ? "w-[250px] h-[444px]"
                                    : "w-[350px] h-[622px]";

                        return (
                            <div
                                key={i}
                                className={`${sizeClass} flex-shrink-0 overflow-hidden grayscale hover:grayscale-0 transition-all duration-500 transform hover:scale-105 border border-white/10`}
                            >
                                <img
                                    src={src}
                                    alt={`Memory ${(i % MEMORIES.length) + 1}`}
                                    className="w-full h-full object-cover"
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

import { motion } from "framer-motion";
import { SmokeCanvas } from "./SmokeCanvas";

const quote = "In all the world, there is no heart for me like yours. In all the world, there is no love for you like mine.";

export function QuoteSection() {
    const words = quote.split(" ");

    return (
        <section className="h-screen w-full flex items-center justify-center bg-black relative overflow-hidden">
            {/* WebGL Smoke Background */}
            <SmokeCanvas />

            {/* Quote Content — UnifrakturCook font, pink color */}
            <div className="max-w-4xl px-8 text-center relative z-10 mix-blend-screen">
                <motion.div
                    className="text-3xl md:text-5xl font-unifraktur leading-relaxed cursor-default text-pink-400"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                >
                    {words.map((word, i) => (
                        <motion.span
                            key={i}
                            className="inline-block mx-1.5 will-change-transform cursor-pointer"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04, duration: 0.5 }}
                            viewport={{ once: true }}
                            whileHover={{
                                scale: 1.4,
                                y: -12,
                                rotate: Math.random() * 16 - 8,
                                opacity: 0.4,
                                filter: "blur(3px)",
                                textShadow: "0 0 20px rgba(244,114,182,0.8)",
                                transition: { duration: 0.35, ease: "easeOut" },
                            }}
                        >
                            {word}
                        </motion.span>
                    ))}
                </motion.div>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="mt-12 text-lg md:text-xl text-pink-300/50 font-light"
                >
                    - Maya Angelou
                </motion.p>
            </div>
        </section>
    );
}

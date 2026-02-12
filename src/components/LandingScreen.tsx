import { motion } from "framer-motion";
import { useState } from "react";
import "./LandingScreen.css"; // Import CSS for petals

interface LandingScreenProps {
    onComplete: () => void;
}

export function LandingScreen({ onComplete }: LandingScreenProps) {
    const [isExiting, setIsExiting] = useState(false);

    const handleYesClick = () => {
        setIsExiting(true);
        setTimeout(onComplete, 1500);
    };

    // Generate fixed number of petals for CSS animation
    const petals = Array.from({ length: 50 });

    return (
        <motion.div
            className="fixed inset-0 flex flex-col items-center justify-center bg-black text-white z-50 overflow-hidden"
            exit={{ opacity: 0, transition: { duration: 1 } }}
        >
            {/* CSS Petals Layer */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {petals.map((_, i) => (
                    <div
                        key={i}
                        className="petal"
                        style={{
                            left: `${Math.random() * 100}vw`,
                            animationDelay: `${Math.random() * 5}s`,
                            animationDuration: `${Math.random() * 5 + 5}s`,
                            opacity: Math.random() * 0.5 + 0.3
                        }}
                    />
                ))}
            </div>

            {/* Content Container - Portal Target */}
            <motion.div
                className="relative z-10 flex flex-col items-center"
                animate={isExiting ? {
                    scale: [1, 50],
                    opacity: [1, 0],
                    rotate: [0, 5]
                } : {}}
                transition={{ duration: 1.5, ease: "easeInOut" }}
            >
                <motion.h1
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-4xl md:text-6xl font-unifraktur mb-8 text-center px-4"
                >
                    Will you be my valentine?
                </motion.h1>

                <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1, type: "spring" }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleYesClick}
                    className="px-8 py-3 bg-pink-500 rounded-full text-xl font-semibold hover:bg-pink-600 transition-colors shadow-[0_0_20px_rgba(236,72,153,0.5)] cursor-pointer"
                >
                    Yes 💖
                </motion.button>
            </motion.div>
        </motion.div>
    );
}

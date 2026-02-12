import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import heroVideo from "../assets/Hero video.mp4";
import { CloveCursor } from "./CloveCursor";

export function MainStage() {
    const [isHolding, setIsHolding] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [isHovered, setIsHovered] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleMouseMove = (e: MouseEvent) => {
            setMousePos({ x: e.clientX, y: e.clientY });
        };

        // Only listen for mouse move globally (for cursor tracking)
        window.addEventListener("mousemove", handleMouseMove);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className="relative h-screen w-full overflow-hidden bg-black cursor-none"
            onMouseDown={() => setIsHolding(true)}
            onMouseUp={() => setIsHolding(false)}
            onMouseLeave={() => { setIsHolding(false); setIsHovered(false); }}
            onMouseEnter={() => setIsHovered(true)}
            onTouchStart={() => setIsHolding(true)}
            onTouchEnd={() => setIsHolding(false)}
        >
            {/* Video Background with Zoom Effect */}
            <div
                className="absolute inset-0 transition-transform duration-700 ease-out will-change-transform"
                style={{ transform: isHolding ? "scale(1.25)" : "scale(1.05)" }}
            >
                <div className="absolute inset-0 bg-black/30 z-10 pointer-events-none" />
                <video
                    src={heroVideo}
                    autoPlay loop muted playsInline
                    className="w-full h-full object-cover"
                />
            </div>

            {/* Custom Cursor — ONLY visible when hovering this section */}
            {isHovered && (
                <motion.div
                    className="fixed pointer-events-none z-50 mix-blend-difference"
                    animate={{
                        x: mousePos.x - 32,
                        y: mousePos.y - 32,
                        scale: isHolding ? 0.8 : 1,
                    }}
                    transition={{ type: "spring", stiffness: 500, damping: 28 }}
                >
                    <CloveCursor isHolding={isHolding} />
                </motion.div>
            )}

            {/* Scroll Indicator */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none z-20">
                <div className="w-5 h-8 border-2 border-white/50 rounded-full flex justify-center p-1">
                    <div className="w-1 h-2 bg-white rounded-full animate-scroll" />
                </div>
                <span className="text-white/50 text-xs tracking-widest uppercase">Scroll</span>
            </div>
        </div>
    );
}

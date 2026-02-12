import { useEffect, useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";

const SECTIONS = [
    { id: "hero", label: "Hero" },
    { id: "quote", label: "Quote" },
    { id: "guy", label: "Guy" },
    { id: "memories", label: "Memories" },
];

export function SectionDots() {
    const [active, setActive] = useState(0);
    const isScrolling = useRef(false);
    const cooldown = useRef<ReturnType<typeof setTimeout>>();

    // Track active section via IntersectionObserver
    useEffect(() => {
        const observers: IntersectionObserver[] = [];
        SECTIONS.forEach((section, index) => {
            const el = document.getElementById(section.id);
            if (!el) return;
            const observer = new IntersectionObserver(
                ([entry]) => { if (entry.isIntersecting) setActive(index); },
                { threshold: 0.5 }
            );
            observer.observe(el);
            observers.push(observer);
        });
        return () => observers.forEach((o) => o.disconnect());
    }, []);

    // Fullpage-style snap: any scroll jumps to next/prev section
    const goToSection = useCallback((index: number) => {
        if (index < 0 || index >= SECTIONS.length) return;
        const el = document.getElementById(SECTIONS[index].id);
        if (!el) return;
        isScrolling.current = true;
        el.scrollIntoView({ behavior: "smooth" });
        // Cooldown prevents rapid-fire snapping
        clearTimeout(cooldown.current);
        cooldown.current = setTimeout(() => { isScrolling.current = false; }, 800);
    }, []);

    useEffect(() => {
        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            if (isScrolling.current) return;
            if (e.deltaY > 0) goToSection(active + 1);
            else if (e.deltaY < 0) goToSection(active - 1);
        };

        // Touch support
        let touchStartY = 0;
        const handleTouchStart = (e: TouchEvent) => { touchStartY = e.touches[0].clientY; };
        const handleTouchEnd = (e: TouchEvent) => {
            if (isScrolling.current) return;
            const diff = touchStartY - e.changedTouches[0].clientY;
            if (Math.abs(diff) > 30) {
                if (diff > 0) goToSection(active + 1);
                else goToSection(active - 1);
            }
        };

        window.addEventListener("wheel", handleWheel, { passive: false });
        window.addEventListener("touchstart", handleTouchStart, { passive: true });
        window.addEventListener("touchend", handleTouchEnd, { passive: true });

        return () => {
            window.removeEventListener("wheel", handleWheel);
            window.removeEventListener("touchstart", handleTouchStart);
            window.removeEventListener("touchend", handleTouchEnd);
            clearTimeout(cooldown.current);
        };
    }, [active, goToSection]);

    const scrollTo = (id: string) => {
        const idx = SECTIONS.findIndex((s) => s.id === id);
        goToSection(idx);
    };

    return (
        <nav className="fixed right-6 top-1/2 -translate-y-1/2 z-[60] flex flex-col gap-4">
            {SECTIONS.map((section, i) => (
                <button
                    key={section.id}
                    onClick={() => scrollTo(section.id)}
                    className="group relative flex items-center justify-center w-5 h-5 cursor-pointer"
                    aria-label={section.label}
                >
                    {/* Outer ring — pink when active */}
                    <span
                        className={`absolute inset-0 rounded-full border transition-all duration-300 ${active === i ? "border-pink-400 scale-110" : "border-white/30 group-hover:border-white/60"
                            }`}
                    />
                    {/* Inner dot — pink fill */}
                    <motion.span
                        className="w-2 h-2 rounded-full"
                        animate={{
                            backgroundColor: active === i ? "#f472b6" : "transparent",
                            scale: active === i ? 1 : 0,
                        }}
                        transition={{ duration: 0.3 }}
                    />
                    {/* Tooltip */}
                    <span className="absolute right-8 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        {section.label}
                    </span>
                </button>
            ))}
        </nav>
    );
}

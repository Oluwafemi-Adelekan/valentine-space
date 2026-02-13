import { useEffect, useRef, useState, useCallback } from "react";

interface VoiceoverHUDProps {
    audioRef: React.RefObject<HTMLAudioElement | null>;
    globalMuted: boolean;
    onToggleMute: () => void;
}

function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function VoiceoverHUD({ audioRef, globalMuted, onToggleMute }: VoiceoverHUDProps) {
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const dragRef = useRef(false);
    const rafRef = useRef<number>(0);
    const idleTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    // Auto-hide playhead/timecodes after 5s of no mouse movement
    useEffect(() => {
        const handleMouseMove = () => {
            setIsHovered(true);
            clearTimeout(idleTimerRef.current);
            idleTimerRef.current = setTimeout(() => {
                if (!dragRef.current) setIsHovered(false);
            }, 2000);
        };
        window.addEventListener("mousemove", handleMouseMove);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            clearTimeout(idleTimerRef.current);
        };
    }, []);

    // Poll audio state via rAF
    const tick = useCallback(() => {
        const audio = audioRef.current;
        if (audio && !dragRef.current) {
            const dur = audio.duration || 0;
            const cur = audio.currentTime || 0;
            setCurrentTime(cur);
            setDuration(dur);
            setProgress(dur > 0 ? cur / dur : 0);
            setIsPlaying(!audio.paused && !audio.ended);
        }
        rafRef.current = requestAnimationFrame(tick);
    }, [audioRef]);

    useEffect(() => {
        rafRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafRef.current);
    }, [tick]);

    const togglePlayPause = useCallback(() => {
        const audio = audioRef.current;
        if (!audio) return;
        if (audio.paused) {
            audio.play().catch(() => { });
        } else {
            audio.pause();
        }
    }, [audioRef]);

    const scrubTo = useCallback((clientX: number) => {
        const audio = audioRef.current;
        if (!audio || !audio.duration) return;
        const frac = Math.max(0, Math.min(1, clientX / window.innerWidth));
        audio.currentTime = frac * audio.duration;
        setProgress(frac);
        setCurrentTime(audio.currentTime);
    }, [audioRef]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dragRef.current = true;
        setIsDragging(true);
    }, []);

    useEffect(() => {
        if (!isDragging) return;
        const handleMouseMove = (e: MouseEvent) => {
            e.preventDefault();
            scrubTo(e.clientX);
        };
        const handleMouseUp = () => {
            dragRef.current = false;
            setIsDragging(false);
        };
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isDragging, scrubTo]);

    const controlsVisible = isHovered || isDragging;

    return (
        <>
            {/* ═══ Top Center: MUTE + PLAY/PAUSE — always visible ═══ */}
            <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[56] flex items-center gap-8 pointer-events-auto">
                <button
                    onClick={onToggleMute}
                    className="text-white/70 hover:text-white text-xs font-semibold font-mono uppercase tracking-[0.25em] transition-colors duration-300 cursor-pointer whitespace-nowrap"
                >
                    {globalMuted ? "UNMUTE" : "MUTE"}
                </button>
                <button
                    onClick={togglePlayPause}
                    className="text-white/70 hover:text-white text-xs font-semibold font-mono uppercase tracking-[0.25em] transition-colors duration-300 cursor-pointer whitespace-nowrap"
                >
                    {isPlaying ? "PAUSE" : "PLAY"}
                </button>
            </div>

            {/* ═══ Current Timecode — left center (hover only) ═══ */}
            <div
                className="fixed left-6 top-1/2 -translate-y-1/2 z-[56] text-white/60 text-xs font-semibold font-mono tracking-widest tabular-nums transition-opacity duration-500 ease-in-out pointer-events-none"
                style={{ opacity: controlsVisible ? 1 : 0 }}
            >
                {formatTime(currentTime)}
            </div>

            {/* ═══ Duration — right center (hover only) ═══ */}
            <div
                className="fixed right-16 top-1/2 -translate-y-1/2 z-[56] text-white/60 text-xs font-semibold font-mono tracking-widest tabular-nums transition-opacity duration-500 ease-in-out pointer-events-none"
                style={{ opacity: controlsVisible ? 1 : 0 }}
            >
                {formatTime(duration)}
            </div>

            {/* ═══ Vertical Playhead Line (hover only) ═══ */}
            <div
                className="fixed top-0 bottom-0 z-[56] group pointer-events-auto"
                style={{
                    left: `${progress * 100}%`,
                    transition: isDragging
                        ? "none"
                        : "left 0.15s linear",
                    width: "48px",
                    marginLeft: "-24px",
                    cursor: isDragging ? "grabbing" : "grab",
                    opacity: controlsVisible ? 1 : 0,
                    pointerEvents: controlsVisible ? "auto" : "none",
                }}
                onMouseDown={handleMouseDown}
            >
                <div
                    className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 transition-all duration-500 ease-in-out"
                    style={{
                        width: isDragging ? "2px" : "1px",
                        backgroundColor: isDragging
                            ? "rgba(244, 114, 182, 0.9)"
                            : "rgba(255, 255, 255, 0.15)",
                    }}
                />
                <div
                    className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 ease-in-out"
                    style={{
                        width: "4px",
                        backgroundColor: "rgba(244, 114, 182, 0.4)",
                        boxShadow: "0 0 12px 4px rgba(244, 114, 182, 0.15)",
                    }}
                />
            </div>
        </>
    );
}

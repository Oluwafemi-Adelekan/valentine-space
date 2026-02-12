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

/**
 * Cinematic voiceover HUD inspired by Mario Roudil's portfolio.
 * - Vertical playhead line (draggable) progresses left-to-right
 * - Current timecode on the left, total duration on the right
 * - Center PAUSE / PLAY toggle (voiceover only)
 * - Top center SOUND ON / SOUND OFF (all audio)
 */
export function VoiceoverHUD({ audioRef, globalMuted, onToggleMute }: VoiceoverHUDProps) {
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const dragRef = useRef(false);
    const rafRef = useRef<number>(0);

    // Poll audio state via rAF for smooth playhead
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

    // Toggle play/pause (voiceover only)
    const togglePlayPause = useCallback(() => {
        const audio = audioRef.current;
        if (!audio) return;
        if (audio.paused) {
            audio.play().catch(() => { });
        } else {
            audio.pause();
        }
    }, [audioRef]);

    // Scrub: start drag
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        dragRef.current = true;
        setIsDragging(true);
        scrubTo(e.clientX);
    }, []);

    // Scrub: move
    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
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
    }, [isDragging]);

    const scrubTo = (clientX: number) => {
        const audio = audioRef.current;
        if (!audio || !audio.duration) return;
        const frac = Math.max(0, Math.min(1, clientX / window.innerWidth));
        audio.currentTime = frac * audio.duration;
        setProgress(frac);
        setCurrentTime(audio.currentTime);
    };

    return (
        <div className="fixed inset-0 z-[55] pointer-events-none select-none">

            {/* ═══ SOUND ON / OFF — top center ═══ */}
            <button
                onClick={onToggleMute}
                className="pointer-events-auto absolute top-6 left-1/2 -translate-x-1/2 text-white/60 hover:text-white text-xs font-mono uppercase tracking-[0.3em] transition-all duration-500 ease-in-out cursor-pointer"
            >
                {globalMuted ? "SOUND OFF" : "SOUND ON"}
            </button>

            {/* ═══ Current Timecode — left center ═══ */}
            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/50 text-xs font-mono tracking-widest tabular-nums transition-all duration-300 ease-in-out">
                {formatTime(currentTime)}
            </div>

            {/* ═══ Duration — right center ═══ */}
            <div className="absolute right-6 top-1/2 -translate-y-1/2 text-white/50 text-xs font-mono tracking-widest tabular-nums transition-all duration-300 ease-in-out">
                {formatTime(duration)}
            </div>

            {/* ═══ PAUSE / PLAY — center ═══ */}
            <button
                onClick={togglePlayPause}
                className="pointer-events-auto absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/60 hover:text-white text-xs font-mono uppercase tracking-[0.3em] transition-all duration-500 ease-in-out cursor-pointer"
            >
                {isPlaying ? "PAUSE" : "PLAY"}
            </button>

            {/* ═══ Vertical Playhead Line — full height, scrubable ═══ */}
            <div
                className="pointer-events-auto absolute top-0 bottom-0 cursor-col-resize group"
                style={{
                    left: `${progress * 100}%`,
                    transition: isDragging ? "none" : "left 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)",
                    width: "20px",
                    marginLeft: "-10px",
                }}
                onMouseDown={handleMouseDown}
            >
                {/* The visible line */}
                <div
                    className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 transition-all duration-300 ease-in-out"
                    style={{
                        width: isDragging ? "2px" : "1px",
                        backgroundColor: isDragging ? "rgba(244,114,182,0.8)" : "rgba(255,255,255,0.2)",
                    }}
                />
                {/* Hover glow */}
                <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[3px] bg-white/0 group-hover:bg-white/30 transition-all duration-300 ease-in-out" />
            </div>
        </div>
    );
}

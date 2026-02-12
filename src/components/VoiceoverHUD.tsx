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

    // Scrub helpers
    const scrubTo = useCallback((clientX: number) => {
        const audio = audioRef.current;
        if (!audio || !audio.duration) return;
        const frac = Math.max(0, Math.min(1, clientX / window.innerWidth));
        audio.currentTime = frac * audio.duration;
        setProgress(frac);
        setCurrentTime(audio.currentTime);
    }, [audioRef]);

    // Magnetic playhead: on mousedown anywhere on the playhead hit area, start dragging
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dragRef.current = true;
        setIsDragging(true);
        // Snap to current playhead position, don't jump
    }, []);

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            e.preventDefault();
            scrubTo(e.clientX);
        };
        const handleMouseUp = (e: MouseEvent) => {
            e.preventDefault();
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

    // Click on the track area to jump
    const handleTrackClick = useCallback((e: React.MouseEvent) => {
        scrubTo(e.clientX);
    }, [scrubTo]);

    return (
        <div className="fixed inset-0 z-[55] pointer-events-none select-none">

            {/* ═══ Top Center: SOUND + PLAY/PAUSE horizontal ═══ */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-8 pointer-events-auto">
                <button
                    onClick={onToggleMute}
                    className="text-white/60 hover:text-white text-xs font-mono uppercase tracking-[0.3em] transition-all duration-500 ease-in-out cursor-pointer whitespace-nowrap"
                >
                    {globalMuted ? "SOUND OFF" : "SOUND ON"}
                </button>
                <button
                    onClick={togglePlayPause}
                    className="text-white/60 hover:text-white text-xs font-mono uppercase tracking-[0.3em] transition-all duration-500 ease-in-out cursor-pointer whitespace-nowrap"
                >
                    {isPlaying ? "PAUSE" : "PLAY"}
                </button>
            </div>

            {/* ═══ Current Timecode — left center ═══ */}
            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/50 text-xs font-mono tracking-widest tabular-nums transition-all duration-300 ease-in-out">
                {formatTime(currentTime)}
            </div>

            {/* ═══ Duration — right center (offset to avoid dot nav) ═══ */}
            <div className="absolute right-16 top-1/2 -translate-y-1/2 text-white/50 text-xs font-mono tracking-widest tabular-nums transition-all duration-300 ease-in-out">
                {formatTime(duration)}
            </div>

            {/* ═══ Playhead Track — full width invisible hit area ═══ */}
            <div
                className="pointer-events-auto absolute top-0 bottom-0 left-0 right-0 cursor-col-resize"
                style={{ width: "100%", zIndex: -1 }}
                onClick={handleTrackClick}
            />

            {/* ═══ Vertical Playhead Line — magnetic, wide hit area ═══ */}
            <div
                className="pointer-events-auto absolute top-0 bottom-0 group"
                style={{
                    left: `${progress * 100}%`,
                    transition: isDragging ? "none" : "left 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)",
                    width: "48px",
                    marginLeft: "-24px",
                    cursor: isDragging ? "grabbing" : "grab",
                }}
                onMouseDown={handleMouseDown}
            >
                {/* The visible line */}
                <div
                    className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 transition-all duration-500 ease-in-out"
                    style={{
                        width: isDragging ? "2px" : "1px",
                        backgroundColor: isDragging
                            ? "rgba(244, 114, 182, 0.9)"
                            : "rgba(255, 255, 255, 0.15)",
                    }}
                />
                {/* Hover glow — magnetic feel */}
                <div
                    className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 ease-in-out"
                    style={{
                        width: "4px",
                        backgroundColor: "rgba(244, 114, 182, 0.4)",
                        boxShadow: "0 0 12px 4px rgba(244, 114, 182, 0.15)",
                    }}
                />
                {/* Invisible magnetic grab zone */}
                <div className="absolute inset-0" />
            </div>
        </div>
    );
}

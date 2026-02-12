import { useEffect, useRef, useState } from "react";

interface SubtitleCue {
    time: number; // seconds
    text: string;
}

interface SectionVoiceoverProps {
    audioSrc: string;
    subtitles: SubtitleCue[];
    isActive: boolean;
}

/**
 * Plays a voiceover when isActive becomes true (fade in).
 * Pauses with fade out when leaving.
 * Resets + replays every time the section is re-entered.
 * Displays synced subtitles at the bottom center.
 */
export function SectionVoiceover({ audioSrc, subtitles, isActive }: SectionVoiceoverProps) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const fadeRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
    const [currentText, setCurrentText] = useState("");

    // Play / pause with fade
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isActive) {
            // Reset and play from start
            audio.currentTime = 0;
            audio.volume = 0;
            audio.play().catch(() => { });

            // Fade in over 1.5s
            clearInterval(fadeRef.current);
            fadeRef.current = setInterval(() => {
                if (audio.volume < 0.95) {
                    audio.volume = Math.min(audio.volume + 0.05, 1);
                } else {
                    audio.volume = 1;
                    clearInterval(fadeRef.current);
                }
            }, 75); // 20 steps × 75ms ≈ 1.5s
        } else {
            // Fade out over 0.8s
            clearInterval(fadeRef.current);
            fadeRef.current = setInterval(() => {
                if (audio.volume > 0.05) {
                    audio.volume = Math.max(audio.volume - 0.05, 0);
                } else {
                    audio.volume = 0;
                    audio.pause();
                    clearInterval(fadeRef.current);
                }
            }, 40); // 20 steps × 40ms ≈ 0.8s

            setCurrentText("");
        }

        return () => clearInterval(fadeRef.current);
    }, [isActive]);

    // Subtitle sync
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !isActive) return;

        const onTimeUpdate = () => {
            const t = audio.currentTime;
            let activeText = "";
            for (let i = subtitles.length - 1; i >= 0; i--) {
                if (t >= subtitles[i].time) {
                    activeText = subtitles[i].text;
                    break;
                }
            }
            setCurrentText(activeText);
        };

        const onEnded = () => setCurrentText("");

        audio.addEventListener("timeupdate", onTimeUpdate);
        audio.addEventListener("ended", onEnded);
        return () => {
            audio.removeEventListener("timeupdate", onTimeUpdate);
            audio.removeEventListener("ended", onEnded);
        };
    }, [isActive, subtitles]);

    return (
        <>
            <audio ref={audioRef} src={audioSrc} preload="auto" />
            {/* Subtitle bar */}
            {currentText && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 max-w-xl w-[90%] text-center pointer-events-none">
                    <div className="inline-block bg-black/70 backdrop-blur-sm px-5 py-2.5 rounded-lg">
                        <p className="text-white/90 text-sm md:text-base font-light leading-relaxed">
                            {currentText}
                        </p>
                    </div>
                </div>
            )}
        </>
    );
}

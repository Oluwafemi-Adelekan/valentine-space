import { useEffect, useState } from "react";

interface SubtitleCue {
    time: number;
    text: string;
}

interface SectionVoiceoverProps {
    audioRef: React.RefObject<HTMLAudioElement | null>;
    audioSrc: string;
    subtitles: SubtitleCue[];
    isActive: boolean;
    globalMuted: boolean;
}

/**
 * Manages voiceover playback for a single section.
 * Audio element is created here but ref is shared with parent for HUD control.
 */
export function SectionVoiceover({ audioRef, audioSrc, subtitles, isActive, globalMuted }: SectionVoiceoverProps) {
    const [currentText, setCurrentText] = useState("");

    // Mute/unmute based on global toggle
    useEffect(() => {
        const audio = audioRef.current;
        if (audio) audio.muted = globalMuted;
    }, [globalMuted, audioRef]);

    // Play / pause with fade
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        let fadeInterval: ReturnType<typeof setInterval> | undefined;

        if (isActive) {
            audio.currentTime = 0;
            audio.volume = 0;
            audio.play().catch(() => { });

            // Fade in over 1.5s
            fadeInterval = setInterval(() => {
                if (audio.volume < 0.95) {
                    audio.volume = Math.min(audio.volume + 0.05, 1);
                } else {
                    audio.volume = 1;
                    clearInterval(fadeInterval);
                }
            }, 75);
        } else {
            // Fade out over 0.8s
            fadeInterval = setInterval(() => {
                if (audio.volume > 0.05) {
                    audio.volume = Math.max(audio.volume - 0.05, 0);
                } else {
                    audio.volume = 0;
                    audio.pause();
                    clearInterval(fadeInterval);
                }
            }, 40);
            setCurrentText("");
        }

        return () => clearInterval(fadeInterval);
    }, [isActive, audioRef]);

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
    }, [isActive, subtitles, audioRef]);

    return (
        <>
            <audio ref={audioRef} src={audioSrc} preload="auto" />
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

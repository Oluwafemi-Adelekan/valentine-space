import { useEffect, useRef } from "react";
import audioSrc from "../assets/nikitakondrashev-love-437013.mp3";

export function AudioPlayer({ isPlaying, globalMuted }: { isPlaying: boolean; globalMuted: boolean }) {
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        if (isPlaying && audioRef.current) {
            const audio = audioRef.current;
            audio.volume = 0;
            audio.play().catch(e => console.error("Audio play failed", e));

            // Fade in over 5 seconds, cap at 0.5 (50% volume)
            let volume = 0;
            const fadeInterval = setInterval(() => {
                if (volume < 0.5) {
                    volume = Math.min(volume + 0.01, 0.5);
                    audio.volume = volume;
                } else {
                    clearInterval(fadeInterval);
                }
            }, 100);

            return () => clearInterval(fadeInterval);
        }
    }, [isPlaying]);

    // Global mute
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.muted = globalMuted;
        }
    }, [globalMuted]);

    return (
        <audio ref={audioRef} src={audioSrc} loop />
    );
}

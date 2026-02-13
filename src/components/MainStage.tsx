export function MainStage() {
    return (
        <div className="relative h-screen w-full overflow-hidden bg-black">
            {/* Video Background — Streamable embed, scaled to 108% (intentional) */}
            <div className="absolute inset-0">
                <div className="absolute inset-0 bg-black/30 z-10 pointer-events-none" />
                <iframe
                    src="https://streamable.com/e/0g2x8e?nocontrols=1&autoplay=1&muted=1&loop=1"
                    allow="autoplay; fullscreen"
                    allowFullScreen
                    className="w-full h-full"
                    style={{
                        border: "none",
                        transform: "scale(1.08)",
                        transformOrigin: "center center",
                        pointerEvents: "none",
                    }}
                    title="Hero video"
                />
            </div>

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

export function MainStage() {
    return (
        <div className="relative h-[100dvh] w-full overflow-hidden bg-black">
            {/* Video Background — Google Drive direct, scaled to 108% (intentional) */}
            <div className="absolute inset-0">
                <div className="absolute inset-0 bg-black/30 z-10 pointer-events-none" />
                <video
                    src="https://drive.google.com/uc?export=download&id=1tUpfsQH_PhN12cIP7pehdo4BPamRUdOG"
                    autoPlay loop muted playsInline
                    preload="auto"
                    crossOrigin="anonymous"
                    className="w-full h-full object-cover"
                    style={{ transform: "scale(1.08)", transformOrigin: "center center" }}
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

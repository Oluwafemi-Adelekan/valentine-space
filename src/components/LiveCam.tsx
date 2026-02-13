export function LiveCam() {
    return (
        <div className="fixed top-4 right-4 z-50 w-32 h-40 md:w-32 md:h-40 bg-gray-900 rounded-lg overflow-hidden border border-white/20 shadow-2xl
                        max-md:w-[102px] max-md:h-[128px] max-md:top-14">
            <div className="absolute top-2 left-2 z-10 flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] font-mono text-white/80 uppercase tracking-wider">REC</span>
            </div>

            {/* Video Loop — Streamable embed */}
            <iframe
                src="https://streamable.com/e/vdw9vf?nocontrols=1&autoplay=1&muted=1&loop=1"
                allow="autoplay; fullscreen"
                allowFullScreen
                className="w-full h-full opacity-80"
                style={{ border: "none", pointerEvents: "none" }}
                title="Live cam"
            />

            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                <span className="text-[10px] font-mono text-white/90 uppercase tracking-wider">
                    MY-LIVE-CAM
                </span>
            </div>
        </div>
    );
}

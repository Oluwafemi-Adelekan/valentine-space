export function LiveCam() {
    return (
        <div className="fixed top-4 right-4 z-50 w-32 h-40 md:w-32 md:h-40 bg-gray-900 rounded-lg overflow-hidden border border-white/20 shadow-2xl
                        max-md:w-[102px] max-md:h-[128px] max-md:top-14">
            <div className="absolute top-2 left-2 z-10 flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] font-mono text-white/80 uppercase tracking-wider">REC</span>
            </div>

            {/* Video Loop — Cloudinary CDN direct */}
            <video
                src="https://res.cloudinary.com/dinsvbrfd/video/upload/livecam-video_xegcoa.mp4"
                autoPlay loop muted playsInline
                preload="auto"
                className="w-full h-full object-cover opacity-80"
            />

            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                <span className="text-[10px] font-mono text-white/90 uppercase tracking-wider">
                    MY-LIVE-CAM
                </span>
            </div>
        </div>
    );
}

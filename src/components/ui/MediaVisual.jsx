import { motion, AnimatePresence } from 'framer-motion';

export default function MediaVisual({ url, type = 'image', label }) {
    if (!url) return null;

    const isVideo = url.endsWith('.mp4') || type === 'video';

    return (
        <div className="relative h-full w-full bg-black overflow-hidden">
            <AnimatePresence mode="wait">
                <motion.div
                    key={url}
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute inset-0 h-full w-full"
                >
                    {isVideo ? (
                        <video
                            src={url}
                            className="w-full h-full object-cover"
                            autoPlay
                            muted
                            loop
                            playsInline
                        />
                    ) : (
                        <img
                            src={url}
                            className="w-full h-full object-cover"
                            alt={label || "Visual Context"}
                        />
                    )}

                    {/* Overlay Gradient for contrast with floating text cards */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20" />
                </motion.div>
            </AnimatePresence>

            {/* Label / HUD */}
            {label && (
                <div className="absolute bottom-10 left-10 z-50 border-l-4 border-[#FAFF00] pl-6 py-2 bg-black/40 backdrop-blur-md">
                    <span className="block text-[10px] font-black uppercase tracking-[0.3em] text-[#FAFF00]/60 mb-1">Visual Archive</span>
                    <span className="block text-2xl font-bold text-white font-serif-display leading-none">{label}</span>
                </div>
            )}
        </div>
    );
}

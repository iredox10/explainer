import { motion } from 'framer-motion';

export default function TacticalVisual({ label, center, annotations = [], heatmap = [] }) {
    // Pitch configuration (SVG coords)
    const width = 400;
    const height = 600;

    return (
        <div className="relative h-full w-full flex flex-col items-center justify-center bg-emerald-900 p-8 shadow-inner overflow-hidden">
            {/* Header / HUD */}
            <div className="absolute top-10 left-10 z-50 border-l-4 border-[#FAFF00] pl-6 py-2 bg-black/20 backdrop-blur-md">
                <span className="block text-[10px] font-black uppercase tracking-[0.3em] text-[#FAFF00]/60 mb-1">Tactical Analysis</span>
                <span className="block text-2xl font-bold text-white font-serif-display leading-none">{label}</span>
            </div>

            {/* Pitch Container */}
            <div className="relative w-full max-w-2xl h-[80vh] flex items-center justify-center">
                <svg
                    viewBox={`0 0 ${width} ${height}`}
                    className="w-full h-full drop-shadow-2xl"
                    style={{ maxHeight: '70vh' }}
                >
                    {/* Dark Grass Pattern */}
                    <rect width={width} height={height} fill="#065f46" rx="8" />

                    {/* Stripes */}
                    {[...Array(10)].map((_, i) => (
                        <rect
                            key={i}
                            y={(i * height) / 10}
                            width={width}
                            height={height / 20}
                            fill="#064e3b"
                            opacity="0.3"
                        />
                    ))}

                    {/* Outer Boundary */}
                    <rect
                        x="20" y="20" width={width - 40} height={height - 40}
                        fill="none" stroke="white" strokeWidth="2" opacity="0.6"
                    />

                    {/* Halfway Line */}
                    <line
                        x1="20" y1={height / 2} x2={width - 20} y2={height / 2}
                        stroke="white" strokeWidth="2" opacity="0.6"
                    />
                    <circle
                        cx={width / 2} cy={height / 2} r="40"
                        fill="none" stroke="white" strokeWidth="2" opacity="0.6"
                    />
                    <circle cx={width / 2} cy={height / 2} r="3" fill="white" />

                    {/* Penalty Boxes (Top & Bottom) */}
                    {[20, height - 120].map((y, i) => (
                        <g key={i}>
                            <rect
                                x={width / 2 - 80} y={y === 20 ? y : y + 20} width="160" height="80"
                                fill="none" stroke="white" strokeWidth="2" opacity="0.8"
                            />
                            <rect
                                x={width / 2 - 40} y={y === 20 ? y : y + 60} width="80" height="40"
                                fill="none" stroke="white" strokeWidth="2" opacity="0.8"
                            />
                        </g>
                    ))}

                    {/* Heatmaps / Danger Zones */}
                    {heatmap?.map((zone, i) => (
                        <motion.rect
                            key={`zone-${i}`}
                            x={zone.x}
                            y={zone.y}
                            width={zone.w || 60}
                            height={zone.h || 60}
                            fill="#ef4444"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.4 }}
                            transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
                            rx="10"
                            filter="blur(8px)"
                        />
                    ))}

                    {/* Player Markers (Animated) */}
                    {center && (
                        <motion.circle
                            cx={center[0]}
                            cy={center[1]}
                            r="8"
                            fill="#FAFF00"
                            stroke="black"
                            strokeWidth="2"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", damping: 10 }}
                        />
                    )}
                </svg>

                {/* Annotation Labels (Floating overlay for better readability) */}
                {annotations?.map((ann, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + i * 0.2 }}
                        className="absolute bg-white text-black px-3 py-1 text-[10px] font-black uppercase border-2 border-black shadow-lg pointer-events-none"
                        style={{
                            left: `${ann.x}%`,
                            top: `${ann.y}%`,
                            transform: 'translate(-50%, -50%)'
                        }}
                    >
                        {ann.text}
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

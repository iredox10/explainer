import { motion } from 'framer-motion';

export default function Timeline({ label, highlight, steps = [] }) {
    // Standard set of dates if none provided (from the user draft)
    const dates = steps.length > 0 ? steps : [
        { year: '1984', label: 'AFCON Final' },
        { year: '1988', label: 'AFCON Final' },
        { year: '2000', label: 'The Home Loss' },
        { year: '2026', label: 'The Referendum' }
    ];

    const currentIndex = dates.findIndex(d => d.year === highlight);

    return (
        <div className="relative h-full w-full flex flex-col items-center justify-center bg-gray-50 p-8 md:p-24 overflow-hidden">
            {/* Header / HUD */}
            <div className="absolute top-10 left-10 z-50 border-l-4 border-[#FAFF00] pl-6 py-2 bg-black/5 backdrop-blur-md">
                <span className="block text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-1">Historical Context</span>
                <span className="block text-2xl font-bold text-black font-serif-display leading-none">{label}</span>
            </div>

            <div className="relative w-full max-w-4xl h-full flex items-center justify-center pt-20">
                {/* Horizontal Track */}
                <div className="absolute w-full h-1 bg-gray-200 top-1/2 -translate-y-1/2 rounded-full overflow-hidden">
                    <motion.div
                        className="absolute h-full bg-black"
                        initial={{ width: 0 }}
                        animate={{
                            width: currentIndex !== -1 ? `${(currentIndex / (dates.length - 1)) * 100}%` : '0%'
                        }}
                        transition={{ duration: 1, ease: "circOut" }}
                    />
                </div>

                {/* Nodes */}
                <div className="relative w-full flex justify-between">
                    {dates.map((d, i) => {
                        const isActive = d.year === highlight;
                        return (
                            <div key={i} className="relative flex flex-col items-center">
                                <motion.div
                                    animate={{
                                        scale: isActive ? 1.5 : 1,
                                        backgroundColor: isActive ? '#FAFF00' : '#FFF',
                                        borderColor: isActive ? '#000' : '#D1D5DB'
                                    }}
                                    className="w-4 h-4 rounded-full border-2 bg-white z-10 transition-colors"
                                />
                                <div className="absolute top-8 text-center whitespace-nowrap">
                                    <span className={`block font-black text-xl md:text-3xl ${isActive ? 'text-black' : 'text-gray-300'}`}>
                                        {d.year}
                                    </span>
                                    {isActive && (
                                        <motion.span
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mt-1"
                                        >
                                            {d.label}
                                        </motion.span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Pulsing Alert Shadow (When highlighted) */}
            {highlight && (
                <motion.div
                    key={`pulse-${highlight}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: [0, 0.1, 0], scale: [1, 1.5, 2] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 bg-[#FAFF00] rounded-full pointer-events-none"
                    style={{ filter: 'blur(100px)' }}
                />
            )}
        </div>
    );
}

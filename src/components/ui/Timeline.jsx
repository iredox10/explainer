import { motion } from 'framer-motion';

/**
 * @param {{
 *  label?: string;
 *  highlight?: string;
 *  steps?: Array<{ year: string; label: string }>;
 *  variant?: 'track' | 'stacked' | 'cards';
 *  animated?: boolean;
 *  showContextLabel?: boolean;
 *  hud?: boolean;
 * }} props
 */
export default function Timeline({ label, highlight, steps = [], variant = 'track', animated = true, showContextLabel = true, hud = true }) {
    const dates = steps.length > 0 ? steps : [
        { year: '1984', label: 'AFCON Final' },
        { year: '1988', label: 'AFCON Final' },
        { year: '2000', label: 'The Home Loss' },
        { year: '2026', label: 'The Referendum' }
    ];

    const currentIndex = dates.findIndex((d) => d.year === highlight);
    const scrollClass = 'w-full h-[70vh] md:h-[640px] overflow-auto pr-3 pb-2 custom-scrollbar overscroll-contain pointer-events-auto';
    const scrollStyle = { touchAction: 'pan-x pan-y', WebkitOverflowScrolling: 'touch' };
    const trackScrollClass = `w-full overflow-auto ${scrollClass}`;

    const Header = () => (
        <div className="flex items-start justify-between gap-6">
            <div className="border-l-4 border-[#FAFF00] pl-6 py-2">
                {showContextLabel && (
                    <span className="block text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-1">Historical Context</span>
                )}
                <span className="block text-2xl font-bold text-black font-serif-display leading-none">{label}</span>
            </div>
        </div>
    );

    if (variant === 'stacked') {
        return (
            <div className="relative w-full bg-gray-50 p-8 md:p-12">
                <Header />
                <div className={`mt-8 ${scrollClass}`} style={scrollStyle}>
                    <div className="space-y-5 min-w-[680px]">
                        {dates.map((d, i) => {
                            const isActive = d.year === highlight;
                            return (
                                <div key={i} className="flex items-start gap-4">
                                    <div className={`w-24 text-right font-black text-2xl md:text-3xl ${isActive ? 'text-black' : 'text-gray-400'}`}>
                                        {d.year}
                                    </div>
                                    <div className={`flex-1 rounded-2xl border p-5 md:p-6 shadow-sm ${isActive ? 'border-black bg-[#FAFF00]/20' : 'border-gray-200 bg-white'}`}>
                                        <p className="text-base md:text-lg font-semibold text-gray-900">{d.label}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    if (variant === 'cards') {
        return (
            <div className="relative w-full bg-gray-50 p-8 md:p-12">
                <Header />
                <div className={`mt-8 ${scrollClass}`} style={scrollStyle}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 min-w-[720px]">
                        {dates.map((d, i) => {
                            const isActive = d.year === highlight;
                            return (
                                <div
                                    key={i}
                                    className={`rounded-2xl border p-6 md:p-7 shadow-sm ${isActive ? 'border-black bg-[#FAFF00]/20' : 'border-gray-200 bg-white'}`}
                                >
                                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Year</div>
                                    <div className="text-3xl md:text-4xl font-black text-black mt-1">{d.year}</div>
                                    <p className="text-base md:text-lg font-semibold text-gray-900 mt-3">{d.label}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    const ProgressTag = animated ? motion.div : 'div';
    const NodeTag = animated ? motion.div : 'div';
    const LabelTag = animated ? motion.span : 'span';

    return (
        <div className={`relative w-full bg-gray-50 ${hud ? 'p-8 md:p-24' : 'p-8 md:p-12'}`}>
            {hud ? (
                <div className="absolute top-10 left-10 z-50 border-l-4 border-[#FAFF00] pl-6 py-2 bg-black/5 backdrop-blur-md">
                    {showContextLabel && (
                        <span className="block text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-1">Historical Context</span>
                    )}
                    <span className="block text-2xl font-bold text-black font-serif-display leading-none">{label}</span>
                </div>
            ) : (
                <Header />
            )}

            <div className={`relative w-full ${hud ? 'h-full' : 'mt-8'} flex items-center justify-center ${hud ? 'pt-20' : ''}`}>
                <div className={trackScrollClass} style={scrollStyle}>
                    <div className="relative min-h-[280px] py-12">
                        <div className="absolute w-full h-1 bg-gray-200 top-1/2 -translate-y-1/2 rounded-full overflow-hidden">
                            <ProgressTag
                                className="absolute h-full bg-black"
                                {...(animated ? {
                                    initial: { width: 0 },
                                    animate: { width: currentIndex !== -1 ? `${(currentIndex / (dates.length - 1)) * 100}%` : '0%' },
                                    transition: { duration: 1, ease: 'circOut' }
                                } : {
                                    style: { width: currentIndex !== -1 ? `${(currentIndex / (dates.length - 1)) * 100}%` : '0%' }
                                })}
                            />
                        </div>

                        <div
                            className="relative w-full flex justify-between min-w-[640px]"
                            style={{ minWidth: `${Math.max(640, dates.length * 140)}px` }}
                        >
                            {dates.map((d, i) => {
                                const isActive = d.year === highlight;
                                return (
                                    <div key={i} className="relative flex flex-col items-center">
                                        <NodeTag
                                            {...(animated ? {
                                                animate: {
                                                    scale: isActive ? 1.5 : 1,
                                                    backgroundColor: isActive ? '#FAFF00' : '#FFF',
                                                    borderColor: isActive ? '#000' : '#D1D5DB'
                                                }
                                            } : {
                                                style: {
                                                    backgroundColor: isActive ? '#FAFF00' : '#FFF',
                                                    borderColor: isActive ? '#000' : '#D1D5DB'
                                                }
                                            })}
                                            className="w-4 h-4 rounded-full border-2 bg-white z-10 transition-colors"
                                        />
                                        <div className="absolute top-8 text-center whitespace-nowrap">
                                            <span className={`block font-black text-xl md:text-3xl ${isActive ? 'text-black' : 'text-gray-300'}`}>
                                                {d.year}
                                            </span>
                                            <LabelTag
                                                {...(animated && isActive ? {
                                                    initial: { opacity: 0, y: 10 },
                                                    animate: { opacity: 1, y: 0 }
                                                } : {})}
                                                className={`block text-[10px] font-bold uppercase tracking-widest mt-1 ${isActive ? 'text-gray-700' : 'text-gray-300'}`}
                                            >
                                                {d.label}
                                            </LabelTag>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {highlight && animated && (
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

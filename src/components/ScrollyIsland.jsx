import { useState } from 'react';
import { Scrollama, Step } from 'react-scrollama';
import { motion, AnimatePresence } from 'framer-motion';

// Sub-Component A: AnimatedMap
function AnimatedMap({ viewBox, highlight, label }) {
    return (
        <div className="relative h-full w-full flex items-center justify-center bg-[#f8f9fa]">
            <motion.svg
                viewBox={viewBox}
                className="h-full w-full max-h-[80vh] max-w-[80vw]"
                animate={{ viewBox }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
            >
                {/* Africa Outline (Simplified) */}
                <path
                    d="M300,100 L400,150 L500,300 L450,500 L300,550 L150,400 L100,250 Z"
                    fill="#e5e7eb"
                    stroke="#d1d5db"
                    strokeWidth="1"
                />
                {/* Nigeria Outline (Simplified, roughly positioned) */}
                <motion.path
                    d="M220,320 L280,320 L280,380 L220,380 Z"
                    fill="#FAFF00" // Vox Yellow
                    stroke="#000000"
                    strokeWidth="2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: highlight === 'nigeria' ? 1 : 0 }}
                    transition={{ duration: 0.5 }}
                />
            </motion.svg>
            <div className="absolute bottom-10 right-10 bg-white border-l-4 border-[#FAFF00] px-6 py-4 shadow-lg">
                <span className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Region</span>
                <span className="block text-xl font-bold text-black font-serif-display">{label}</span>
            </div>
        </div>
    );
}

// Sub-Component B: AnimatedChart
function AnimatedChart({ data, accentColor, label }) {
    // Normalize data to 0-100 range for SVG height of 200
    const maxVal = Math.max(...data);
    const points = data
        .map((val, i) => {
            const x = (i / (data.length - 1)) * 300; // Width 300
            const y = 200 - (val / maxVal) * 180; // Height 200, padding 20
            return `${x},${y}`;
        })
        .join(" ");

    return (
        <div className="relative h-full w-full flex items-center justify-center bg-[#f8f9fa]">
            <div className="w-[90%] max-w-[600px] bg-white p-10 shadow-xl border-t-4 border-[#FAFF00]">
                <h3 className="mb-8 text-2xl font-bold text-black font-serif-display">{label}</h3>
                <svg viewBox="0 0 300 200" className="h-full w-full overflow-visible">
                    {/* Grid lines */}
                    <line x1="0" y1="200" x2="300" y2="200" stroke="#e5e7eb" strokeWidth="1" />
                    <line x1="0" y1="150" x2="300" y2="150" stroke="#f3f4f6" strokeWidth="1" strokeDasharray="4" />
                    <line x1="0" y1="100" x2="300" y2="100" stroke="#f3f4f6" strokeWidth="1" strokeDasharray="4" />
                    <line x1="0" y1="50" x2="300" y2="50" stroke="#f3f4f6" strokeWidth="1" strokeDasharray="4" />
                    <line x1="0" y1="0" x2="0" y2="200" stroke="#e5e7eb" strokeWidth="1" />

                    {/* The Chart Line */}
                    <motion.polyline
                        points={points}
                        fill="none"
                        stroke={accentColor || "#000"}
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                    />
                    
                    {/* Area under curve (optional effect) */}
                     <motion.polyline
                        points={`${points} 300,200 0,200`}
                        fill={accentColor ? `${accentColor}20` : "#00000010"}
                        stroke="none"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1.5, delay: 0.5 }}
                    />
                </svg>
            </div>
        </div>
    );
}

export default function ScrollyIsland({ steps }) {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);

    const onStepEnter = ({ data }) => {
        setCurrentStepIndex(data);
    };

    const currentStep = steps[currentStepIndex];

    return (
        <div className="relative">
            {/* Layer 1: The Visuals (Sticky Background) */}
            <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden bg-gray-100">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStepIndex}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0 h-full w-full"
                    >
                        {currentStep.type === 'map' && (
                            <AnimatedMap
                                viewBox={currentStep.viewBox}
                                highlight={currentStep.highlight}
                                label={currentStep.label}
                            />
                        )}
                        {currentStep.type === 'chart' && (
                            <AnimatedChart
                                data={currentStep.chartData}
                                accentColor={currentStep.accentColor || "#000"}
                                label={currentStep.label}
                            />
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Layer 2: The Text (Scrolling Foreground) */}
            <div className="relative z-10 -mt-[100vh]">
                <Scrollama onStepEnter={onStepEnter} offset={0.6}>
                    {steps.map((step, index) => (
                        <Step data={index} key={index}>
                            <div className="flex h-screen items-center justify-center pointer-events-none px-6">
                                <div className="mx-auto max-w-md bg-white p-8 shadow-2xl pointer-events-auto border-l-4 border-[#FAFF00]">
                                    <span className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-3">
                                        Step {index + 1}/{steps.length}
                                    </span>
                                    <p className="text-xl font-medium leading-relaxed text-gray-900 font-serif">
                                        {step.text}
                                    </p>
                                </div>
                            </div>
                        </Step>
                    ))}
                </Scrollama>
                <div className="h-[50vh]" /> {/* Extra space at the bottom */}
            </div>
        </div>
    );
}
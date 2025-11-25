import { useState } from 'react';
import { Scrollama, Step } from 'react-scrollama';
import { motion, AnimatePresence } from 'framer-motion';

// Sub-Component A: AnimatedMap
function AnimatedMap({ viewBox, highlight, label }) {
    return (
        <div className="relative h-full w-full flex items-center justify-center bg-blue-50">
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
                    stroke="#9ca3af"
                    strokeWidth="2"
                />
                {/* Nigeria Outline (Simplified, roughly positioned) */}
                <motion.path
                    d="M220,320 L280,320 L280,380 L220,380 Z"
                    fill="#facc15" // Yellow-400
                    stroke="#ca8a04"
                    strokeWidth="2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: highlight === 'nigeria' ? 1 : 0 }}
                    transition={{ duration: 0.5 }}
                />
            </motion.svg>
            <div className="absolute bottom-10 right-10 rounded bg-white/80 px-4 py-2 font-bold shadow">
                {label}
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
        <div className="relative h-full w-full flex items-center justify-center bg-gray-50">
            <div className="h-[300px] w-[400px] rounded-xl bg-white p-8 shadow-2xl">
                <h3 className="mb-4 text-xl font-bold text-gray-800">{label}</h3>
                <svg viewBox="0 0 300 200" className="h-full w-full overflow-visible">
                    {/* Grid lines */}
                    <line x1="0" y1="200" x2="300" y2="200" stroke="#e5e7eb" strokeWidth="2" />
                    <line x1="0" y1="0" x2="0" y2="200" stroke="#e5e7eb" strokeWidth="2" />

                    {/* The Chart Line */}
                    <motion.polyline
                        points={points}
                        fill="none"
                        stroke={accentColor}
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
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
                                accentColor={currentStep.accentColor}
                                label={currentStep.label}
                            />
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Layer 2: The Text (Scrolling Foreground) */}
            <div className="relative z-10 -mt-[100vh]">
                <Scrollama onStepEnter={onStepEnter} offset={0.5}>
                    {steps.map((step, index) => (
                        <Step data={index} key={index}>
                            <div className="flex h-screen items-center justify-center pointer-events-none">
                                <div className="mx-auto max-w-md rounded-lg bg-white/90 p-8 shadow-xl backdrop-blur-sm pointer-events-auto">
                                    <p className="text-2xl font-bold text-gray-900">{step.text}</p>
                                </div>
                            </div>
                        </Step>
                    ))}
                </Scrollama>
                <div className="h-screen" /> {/* Extra space at the bottom */}
            </div>
        </div>
    );
}

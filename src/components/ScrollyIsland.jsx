import { useState, useEffect } from 'react';
import { Scrollama, Step } from 'react-scrollama';
import { motion, AnimatePresence } from 'framer-motion';

import AnimatedChart from './ui/AnimatedChart';
import AnimatedMap from './ui/AnimatedMap';



export default function ScrollyIsland({ steps, forcedStep = null }) {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);

    const onStepEnter = ({ data }) => {
        setCurrentStepIndex(data);
    };

    useEffect(() => {
        if (forcedStep !== null && forcedStep !== undefined && steps[forcedStep]) {
            const el = document.getElementById(`scrolly-step-${forcedStep}`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [forcedStep]);

    if (!steps || steps.length === 0) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-50 border-y border-gray-100">
                <div className="text-center p-12">
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-gray-300 mb-4">Discovery Engine Offline</p>
                    <h3 className="text-2xl font-serif italic text-gray-400">No scrollytelling steps defined for this story.</h3>
                </div>
            </div>
        );
    }

    const currentStep = steps[currentStepIndex];

    return (
        <div className="relative">
            {/* Layer 1: The Visuals (Sticky Background) */}
            <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden bg-white">
                <div className="absolute inset-0 h-full w-full">
                    <AnimatePresence mode="wait">
                        {currentStep.type === 'map' && (
                            <motion.div
                                key="map-layer"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="h-full w-full"
                            >
                                <AnimatedMap
                                    center={currentStep.center || [20, 0]}
                                    zoom={currentStep.zoom || 1}
                                    highlight={currentStep.highlight}
                                    label={currentStep.label}
                                    scope={currentStep.scope || 'africa'}
                                />
                            </motion.div>
                        )}
                        {currentStep.type === 'chart' && (
                            <motion.div
                                key="chart-layer"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="h-full w-full"
                            >
                                <AnimatedChart
                                    type={currentStep.chartType}
                                    data={currentStep.chartData}
                                    labels={currentStep.chartLabels}
                                    colors={currentStep.chartColors}
                                    accentColor={currentStep.accentColor || "#000"}
                                    label={currentStep.label}
                                />
                            </motion.div>
                        )}
                        {currentStep.type === 'text' && (
                            <motion.div
                                key="text-spacer"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0 }}
                                exit={{ opacity: 0 }}
                                className="h-full w-full bg-white"
                            />
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Layer 2: The Text (Scrolling Foreground) */}
            <div className="relative z-10 -mt-[100vh]">
                <Scrollama onStepEnter={onStepEnter} offset={0.6}>
                    {steps.map((step, index) => (
                        <Step data={index} key={index}>
                            <div id={`scrolly-step-${index}`} className={`flex items-center justify-center pointer-events-none px-6 ${step.type === 'text' ? 'min-h-screen py-32' : 'h-screen'}`}>
                                <motion.div
                                    initial={{ opacity: 0, y: 50 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ margin: "-20% 0px -20% 0px" }}
                                    transition={{ duration: 0.8, ease: "circOut" }}
                                    className={`pointer-events-auto shadow-2xl transition-all duration-500 ${step.type === 'text'
                                        ? 'w-full max-w-3xl bg-white/50 backdrop-blur-sm p-8 md:p-20 border-y-4 border-[#FAFF00] shadow-none !bg-transparent'
                                        : 'w-full max-w-[calc(100vw-3rem)] md:max-w-md bg-white p-6 md:p-8 border-l-4 border-[#FAFF00]'
                                        }`}
                                >
                                    <span className="block text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-400 mb-3">
                                        {step.type === 'text' ? 'Narrative Context' : `Step ${index + 1}/${steps.length}`}
                                    </span>
                                    <p className={`leading-relaxed text-gray-900 font-serif ${step.type === 'text' ? 'text-2xl md:text-4xl font-bold tracking-tight' : 'text-lg md:text-xl font-medium'
                                        }`}>
                                        {step.text}
                                    </p>
                                </motion.div>
                            </div>
                        </Step>
                    ))}
                </Scrollama>
                <div className="h-[50vh]" /> {/* Extra space at the bottom */}
            </div>
        </div>
    );
}
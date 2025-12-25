import { useState, useEffect } from 'react';
import { Scrollama, Step } from 'react-scrollama';
import { motion, AnimatePresence, useSpring, useMotionValue } from 'framer-motion';

import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";

const AFRICA_URL = "https://cdn.jsdelivr.net/npm/@highcharts/map-collection/custom/africa.topo.json";
const MotionGeography = motion(Geography);

function AnimatedMap({ center = [20, 0], zoom = 1, highlight, label }) {
    const springConfig = { damping: 20, stiffness: 100, mass: 1 };

    // Motion values for our coordinates
    const lon = useMotionValue(center[0]);
    const lat = useMotionValue(center[1]);
    const z = useMotionValue(zoom);

    // Smooth springs
    const smoothLon = useSpring(lon, springConfig);
    const smoothLat = useSpring(lat, springConfig);
    const smoothZ = useSpring(z, springConfig);

    // Sync props to motion values
    useEffect(() => {
        lon.set(center[0]);
        lat.set(center[1]);
        z.set(zoom);
    }, [center, zoom, lon, lat, z]);

    // Internal state to force re-render for ZoomableGroup (since it needs raw numbers)
    const [renderCenter, setRenderCenter] = useState(center);
    const [renderZoom, setRenderZoom] = useState(zoom);

    useEffect(() => {
        const unsubLon = smoothLon.on("change", (v) => setRenderCenter(prev => [v, prev[1]]));
        const unsubLat = smoothLat.on("change", (v) => setRenderCenter(prev => [prev[0], v]));
        const unsubZ = smoothZ.on("change", (v) => setRenderZoom(v));
        return () => { unsubLon(); unsubLat(); unsubZ(); };
    }, [smoothLon, smoothLat, smoothZ]);

    return (
        <div className="relative h-full w-full flex items-center justify-center bg-white">
            <ComposableMap
                projection="geoMercator"
                projectionConfig={{
                    scale: 150,
                    center: [20, 0]
                }}
                className="w-full h-full"
            >
                <ZoomableGroup
                    center={renderCenter}
                    zoom={renderZoom}
                >
                    <Geographies geography={AFRICA_URL} parseGeographies={(geos) => geos}>
                        {({ geographies }) =>
                            geographies.map((geo) => {
                                const isHighlighted = highlight && (
                                    geo.properties.name.toLowerCase() === highlight.toLowerCase() ||
                                    geo.id === highlight
                                );
                                return (
                                    <MotionGeography
                                        key={geo.rsmKey}
                                        geography={geo}
                                        initial={false}
                                        animate={{
                                            fill: isHighlighted ? "#FAFF00" : "#F5F5F3",
                                        }}
                                        transition={{ duration: 0.8 }}
                                        stroke="#D6D6DA"
                                        strokeWidth={0.5}
                                        style={{
                                            default: { outline: "none" },
                                            hover: { fill: "#FAFF00", outline: "none" },
                                            pressed: { outline: "none" },
                                        }}
                                    />
                                );
                            })
                        }
                    </Geographies>
                </ZoomableGroup>
            </ComposableMap>
            <AnimatePresence mode="wait">
                <motion.div
                    key={label}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="absolute bottom-10 right-10 bg-black/5 backdrop-blur-md border-l-4 border-[#FAFF00] px-8 py-6 shadow-2xl"
                >
                    <span className="block text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-2">Operational Sector</span>
                    <span className="block text-2xl font-bold text-black font-serif-display leading-none">{label}</span>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}


// Sub-Component B: AnimatedChart
// Sub-Component B: AnimatedChart
function AnimatedChart({ type = 'line', data = [10, 20, 30], labels = [], colors = [], accentColor, label }) {
    const maxVal = Math.max(...data, 1);
    const chartHeight = 200;
    const chartWidth = 300;

    // Line Chart Logic
    const points = data
        .map((val, i) => {
            const x = data.length > 1 ? (i / (data.length - 1)) * chartWidth : chartWidth / 2;
            const y = chartHeight - (val / maxVal) * (chartHeight - 20);
            return `${x},${y}`;
        })
        .join(" ");

    // Pie Chart Logic
    const total = data.reduce((a, b) => a + b, 0);
    let cumulativePercent = 0;

    const getCoordinatesForPercent = (percent) => {
        const x = Math.cos(2 * Math.PI * percent);
        const y = Math.sin(2 * Math.PI * percent);
        return [x, y];
    };

    const getSegmentColor = (i) => {
        if (colors && colors[i]) return colors[i];
        if (type === 'pie') {
            return i % 2 === 0 ? (accentColor || "#000") : `${accentColor || "#000"}90`;
        }
        return accentColor || "#000";
    };

    return (
        <div className="relative h-full w-full flex items-center justify-center bg-[#f8f9fa] p-4">
            <div className="w-full max-w-[640px] max-h-[90vh] overflow-y-auto bg-white p-8 md:p-12 shadow-2xl border-t-4 border-[#FAFF00] custom-scrollbar">
                <h3 className="mb-10 text-3xl font-bold text-black font-serif-display leading-tight">{label}</h3>

                <div className="aspect-video w-full flex items-center justify-center">
                    <svg viewBox={`-10 -10 ${chartWidth + 20} ${chartHeight + 20}`} className="w-full h-full overflow-visible">
                        {type === 'line' && (
                            <>
                                <line x1="0" y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke="#e5e7eb" strokeWidth="1" />
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
                                <motion.polyline
                                    points={`${points} ${chartWidth},${chartHeight} 0,${chartHeight}`}
                                    fill={accentColor ? `${accentColor}20` : "#00000010"}
                                    stroke="none"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 1.5, delay: 0.5 }}
                                />
                            </>
                        )}

                        {type === 'bar' && (
                            <g>
                                <line x1="0" y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke="#e5e7eb" strokeWidth="1" />
                                {data.map((val, i) => {
                                    const h = (val / maxVal) * (chartHeight - 20);
                                    const w = (chartWidth / data.length) * 0.8;
                                    const x = (i * (chartWidth / data.length)) + (chartWidth / data.length - w) / 2;
                                    return (
                                        <motion.rect
                                            key={i}
                                            x={x}
                                            y={chartHeight}
                                            width={w}
                                            initial={{ height: 0, y: chartHeight }}
                                            animate={{ height: h, y: chartHeight - h }}
                                            fill={getSegmentColor(i)}
                                            transition={{ duration: 1, delay: i * 0.1, ease: "circOut" }}
                                            rx="4"
                                        />
                                    );
                                })}
                            </g>
                        )}

                        {type === 'pie' && (
                            <g transform={`translate(${chartWidth / 2}, ${chartHeight / 2})`}>
                                {data.map((val, i) => {
                                    const percent = val / (total || 1);
                                    const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
                                    cumulativePercent += percent;
                                    const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
                                    const largeArcFlag = percent > 0.5 ? 1 : 0;
                                    const radius = 80;

                                    const pathData = [
                                        `M ${startX * radius} ${startY * radius}`,
                                        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX * radius} ${endY * radius}`,
                                        `L 0 0`,
                                    ].join(' ');

                                    return (
                                        <motion.path
                                            key={i}
                                            d={pathData}
                                            fill={getSegmentColor(i)}
                                            initial={{ opacity: 0, scale: 0 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ duration: 0.8, delay: i * 0.1 }}
                                            stroke="white"
                                            strokeWidth="2"
                                        />
                                    );
                                })}
                            </g>
                        )}
                    </svg>
                </div>

                <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-6 border-t border-gray-50 pt-8">
                    {data.map((v, i) => (
                        <div key={i} className="flex flex-col gap-1 border-l-2 pl-3" style={{ borderColor: getSegmentColor(i) }}>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                {labels[i] || `Category ${i + 1}`}
                            </span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-xl font-bold text-black">{v}</span>
                                {type === 'pie' && total > 0 && (
                                    <span className="text-[10px] font-medium text-gray-400">({Math.round((v / total) * 100)}%)</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function ScrollyIsland({ steps }) {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);

    const onStepEnter = ({ data }) => {
        setCurrentStepIndex(data);
    };

    if (!steps || steps.length === 0) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-50 border-y border-gray-100">
                <div className="text-center p-12">
                    <p class="text-xs font-black uppercase tracking-[0.3em] text-gray-300 mb-4">Discovery Engine Offline</p>
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
                            <div className={`flex items-center justify-center pointer-events-none px-6 ${step.type === 'text' ? 'min-h-screen py-32' : 'h-screen'}`}>
                                <motion.div
                                    initial={{ opacity: 0, y: 50 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ margin: "-20% 0px -20% 0px" }}
                                    transition={{ duration: 0.8, ease: "circOut" }}
                                    className={`pointer-events-auto shadow-2xl transition-all duration-500 ${step.type === 'text'
                                        ? 'max-w-3xl bg-white/50 backdrop-blur-sm p-12 md:p-20 border-y-4 border-[#FAFF00] shadow-none !bg-transparent'
                                        : 'max-w-md bg-white p-8 border-l-4 border-[#FAFF00]'
                                        }`}
                                >
                                    <span className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-3">
                                        {step.type === 'text' ? 'Narrative Context' : `Step ${index + 1}/${steps.length}`}
                                    </span>
                                    <p className={`leading-relaxed text-gray-900 font-serif ${step.type === 'text' ? 'text-4xl font-bold tracking-tight' : 'text-xl font-medium'
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
import { motion } from 'framer-motion';

import { analytics } from '../../lib/telemetry.js';

export default function AnimatedChart({ type = 'line', data = [10, 20, 30], labels = [], colors = [], accentColor, label, annotations = [] }) {
    const maxVal = Math.max(...data, 1);
    const chartHeight = 200;
    const chartWidth = 300;
    const pieRadius = 80;
    const pieCenter = { x: chartWidth / 2, y: (chartHeight / 2) - 10 };
    const barBaseline = chartHeight - 30;
    const barMaxHeight = chartHeight - 50;

    const pointCoords = data.map((val, i) => {
        const x = data.length > 1 ? (i / (data.length - 1)) * chartWidth : chartWidth / 2;
        const y = chartHeight - (val / maxVal) * (chartHeight - 20);
        return { x, y };
    });

    // Line/Area Chart Logic
    const points = pointCoords.map((point) => `${point.x},${point.y}`).join(" ");

    // Pie Chart Logic
    const total = data.reduce((a, b) => a + b, 0);
    let cumulativePercent = 0;
    const pieStartOffset = -0.25;

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
        <div className="relative flex h-full w-full flex-col justify-center p-4 md:p-8">
            <h3 className="mb-4 text-center text-lg md:text-2xl font-bold text-black font-serif-display leading-tight">{label}</h3>

            {/* Annotations Layer */}
            {annotations.map((ann, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + (i * 0.1), duration: 0.5 }}
                    className="absolute z-40 px-3 py-1 bg-[#FAFF00] text-black text-xs font-bold shadow-md border border-black pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
                    style={{
                        left: `${ann.x}%`,
                        top: `${ann.y}%`,
                    }}
                >
                    {ann.text}
                </motion.div>
            ))}

            <div className="w-full max-w-5xl flex-1 flex items-center justify-center min-h-0">
                <svg
                    width="100%"
                    height="100%"
                    viewBox={`-10 -10 ${chartWidth + 20} ${chartHeight + 20}`}
                    preserveAspectRatio="xMidYMid meet"
                    className="overflow-visible max-h-[60vh]"
                >
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

                    {type === 'area' && (
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
                                fill={accentColor ? `${accentColor}30` : "#00000020"}
                                stroke="none"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 1.5, delay: 0.4 }}
                            />
                            {pointCoords.map((point, i) => (
                                <motion.circle
                                    key={i}
                                    cx={point.x}
                                    cy={point.y}
                                    r="3"
                                    fill={colors?.[i] || accentColor || "#000"}
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.2 + (i * 0.05) }}
                                />
                            ))}
                        </>
                    )}

                    {type === 'scatter' && (
                        <>
                            <line x1="0" y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke="#e5e7eb" strokeWidth="1" />
                            {pointCoords.map((point, i) => (
                                <motion.circle
                                    key={i}
                                    cx={point.x}
                                    cy={point.y}
                                    r="6"
                                    fill={colors?.[i] || accentColor || "#000"}
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.2 + (i * 0.05) }}
                                    onClick={() => analytics.track('chart_point_click', { index: i, value: data[i], label: labels[i] || '' })}
                                />
                            ))}
                        </>
                    )}

                    {type === 'bar' && (
                                <g>
                                    <line x1="0" y1={barBaseline} x2={chartWidth} y2={barBaseline} stroke="#e5e7eb" strokeWidth="1" />
                                    {data.map((val, i) => {
                                // Support multi-series if data[i] is an object { values: [v1, v2] }
                                const isMulti = typeof val === 'object' && val.values;
                                const values = isMulti ? val.values : [val];
                                const groupW = (chartWidth / data.length) * 0.8;
                                const groupX = (i * (chartWidth / data.length)) + (chartWidth / data.length - groupW) / 2;

                                return (
                                    <g key={i}>
                                        {values.map((v, seriesIdx) => {
                                            const h = (v / maxVal) * barMaxHeight;
                                            const w = groupW / values.length;
                                            const x = groupX + (seriesIdx * w);
                                            return (
                                                <motion.rect
                                                    key={seriesIdx}
                                                    x={x}
                                                    y={barBaseline}
                                                    width={w * 0.9} // Slight gap between bars in group
                                                    initial={{ height: 0, y: barBaseline }}
                                                    animate={{ height: h, y: barBaseline - h }}
                                                    fill={isMulti ? (val.colors?.[seriesIdx] || getSegmentColor(seriesIdx)) : getSegmentColor(i)}
                                                    transition={{ duration: 1, delay: (i * 0.1) + (seriesIdx * 0.05), ease: "circOut" }}
                                                    rx="2"
                                                    onClick={() => analytics.track('chart_bar_click', { index: i, value: v, label: labels[i] || '' })}
                                                />
                                            );
                                        })}
                                    </g>
                                );
                            })}
                        </g>
                    )}

                    {type === 'pie' && (
                        <g transform={`translate(${pieCenter.x}, ${pieCenter.y})`}>
                            {data.map((val, i) => {
                                const percent = val / (total || 1);
                                const [startX, startY] = getCoordinatesForPercent(cumulativePercent + pieStartOffset);
                                cumulativePercent += percent;
                                const [endX, endY] = getCoordinatesForPercent(cumulativePercent + pieStartOffset);
                                const largeArcFlag = percent > 0.5 ? 1 : 0;

                                const pathData = [
                                    `M ${startX * pieRadius} ${startY * pieRadius}`,
                                    `A ${pieRadius} ${pieRadius} 0 ${largeArcFlag} 1 ${endX * pieRadius} ${endY * pieRadius}`,
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
                                        onClick={() => analytics.track('chart_pie_click', { index: i, value: val, label: labels[i] || '' })}
                                    />
                                );
                            })}
                        </g>
                    )}
                </svg>
            </div>

            <div className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-3 border-t border-gray-100 pt-4">
                {data.map((v, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <div className="h-3 w-1 rounded-full" style={{ backgroundColor: getSegmentColor(i) }} />
                        <div className="flex flex-col">
                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-wider text-gray-400 leading-none">
                                {labels[i] || `Cat ${i + 1}`}
                            </span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-sm md:text-lg font-bold text-black leading-tight">{v}</span>
                                {type === 'pie' && total > 0 && (
                                    <span className="text-[9px] md:text-[10px] font-medium text-gray-400">({Math.round((v / total) * 100)}%)</span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

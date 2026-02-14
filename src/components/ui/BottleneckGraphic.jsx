const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const toNumber = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const formatValue = (value, unit) => {
    if (!Number.isFinite(value)) return '';
    const formatted = new Intl.NumberFormat('en-US').format(value);
    return unit ? `${formatted}${unit}` : formatted;
};

export default function BottleneckGraphic({
    sourceLabel = 'Source',
    sourceValue = 13000,
    outputLabel = 'Output',
    outputValue = 4000,
    unit = 'MW',
    bottleneckLabel = 'Transmission',
    bottleneckSubLabel = 'Distribution',
    caption
}) {
    const source = toNumber(sourceValue, 0);
    const output = toNumber(outputValue, 0);
    const ratio = source > 0 ? output / source : 0;
    const clampedRatio = clamp(ratio, 0.15, 1);

    const viewWidth = 620;
    const viewHeight = 160;
    const leftWidth = 240;
    const neckWidth = 90;
    const rightWidth = viewWidth - leftWidth - neckWidth;
    const maxHeight = 120;
    const minHeight = 36;
    const outputHeight = minHeight + (maxHeight - minHeight) * clampedRatio;
    const sourceHeight = maxHeight;
    const topLeft = (viewHeight - sourceHeight) / 2;
    const bottomLeft = topLeft + sourceHeight;
    const topRight = (viewHeight - outputHeight) / 2;
    const bottomRight = topRight + outputHeight;

    return (
        <div className="w-full bg-gray-50 border border-gray-200 rounded-3xl p-6 md:p-10">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                <div className="text-left">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">{sourceLabel}</p>
                    <p className="text-3xl md:text-4xl font-black text-black mt-2">
                        {formatValue(source, unit)}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">{outputLabel}</p>
                    <p className="text-3xl md:text-4xl font-black text-black mt-2">
                        {formatValue(output, unit)}
                    </p>
                </div>
            </div>

            <div className="relative mt-8">
                <svg
                    viewBox={`0 0 ${viewWidth} ${viewHeight}`}
                    className="w-full h-[160px]"
                    preserveAspectRatio="none"
                >
                    <polygon
                        points={`0 ${topLeft} ${leftWidth} ${topRight} ${leftWidth} ${bottomRight} 0 ${bottomLeft}`}
                        fill="#FAFF00"
                        stroke="#000"
                        strokeWidth="2"
                    />
                    <rect
                        x={leftWidth}
                        y={topRight}
                        width={neckWidth}
                        height={outputHeight}
                        fill="#FAFF00"
                        stroke="#000"
                        strokeWidth="2"
                    />
                    <rect
                        x={leftWidth + neckWidth}
                        y={topRight}
                        width={rightWidth}
                        height={outputHeight}
                        fill="#FAFF00"
                        stroke="#000"
                        strokeWidth="2"
                    />
                </svg>

                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white/90 border border-black text-black text-[10px] font-black uppercase tracking-[0.2em] px-3 py-2 rounded-xl shadow-sm text-center">
                        <div>{bottleneckLabel}</div>
                        <div className="text-gray-500">{bottleneckSubLabel}</div>
                    </div>
                </div>
            </div>

            {caption && (
                <p className="mt-4 text-xs font-medium text-gray-500 text-center uppercase tracking-widest">
                    {caption}
                </p>
            )}
        </div>
    );
}

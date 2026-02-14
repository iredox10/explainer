import { useState } from 'react';
import { Reorder, useDragControls } from 'framer-motion';
import { Trash2, Upload, Loader2, X, GripVertical, Maximize2, Minimize2, Video, Map as MapIcon, BarChart3, AlignLeft, Layers, Columns, MoveHorizontal, Crosshair, ArrowLeft, MessageSquarePlus } from 'lucide-react';
import MapConfigurator from './editors/MapConfigurator';
import ChartConfigurator from './editors/ChartConfigurator';
import RichTextEditor from './editors/RichTextEditor';
import Timeline from '../ui/Timeline';
import BottleneckGraphic from '../ui/BottleneckGraphic';

export default function BlockWrapper({ block, onUpdate, onDelete, isLocked, uploadingField, onTriggerUpload, isActive, onActivate }) {
    const dragControls = useDragControls();

    const isLayoutBlock = ['image', 'beforeAfter', 'callout', 'quote', 'map', 'chart'].includes(block.type);
    const comments = Array.isArray(block.comments) ? block.comments : [];
    const [newComment, setNewComment] = useState('');

    const addComment = () => {
        if (!newComment.trim()) return;
        const entry = {
            id: `${block.id}-${Date.now()}`,
            text: newComment.trim(),
            createdAt: new Date().toISOString()
        };
        onUpdate({
            ...block,
            comments: [...comments, entry]
        });
        setNewComment('');
    };

    const removeComment = (id) => {
        onUpdate({
            ...block,
            comments: comments.filter((c) => c.id !== id)
        });
    };
    const isFullWidth = block.layout === 'full-width';

    const isVideo = (url) => {
        if (!url) return false;
        const ext = url.split('.').pop().toLowerCase();
        return ['mp4', 'webm', 'mov', 'ogg'].includes(ext);
    };

    const toggleLayout = () => {
        onUpdate({
            ...block,
            layout: isFullWidth ? 'standard' : 'full-width'
        });
    };

    const addScrollyStep = (type) => {
        const currentSteps = block.steps || [];
        let newStep = { type, text: '' };

        if (type === 'map') {
            newStep = { ...newStep, center: [20, 0], zoom: 1, highlight: {}, label: 'New Location' };
        } else if (type === 'chart') {
            newStep = { ...newStep, chartType: 'line', label: 'New Chart', accentColor: '#FAFF00', chartData: [], chartLabels: [], chartColors: [] };
        } else if (type === 'text') {
            newStep = { ...newStep, label: 'Narrative Break' };
        } else if (type === 'tactical') {
            newStep = { ...newStep, label: 'Tactical Analysis', center: [50, 50], annotations: [] };
        } else if (type === 'timeline') {
            newStep = {
                ...newStep,
                label: 'Historical Timeline',
                highlight: '2024',
                timelineSteps: [
                    { year: '1984', label: 'AFCON Final' },
                    { year: '1988', label: 'AFCON Final' },
                    { year: '2000', label: 'The Home Loss' },
                    { year: '2024', label: 'The Referendum' }
                ]
            };
        } else if (type === 'media') {
            newStep = { ...newStep, label: 'Media Backdrop', url: '', mediaType: 'image' };
        }

        onUpdate({
            ...block,
            steps: [...currentSteps, newStep]
        });
    };

    const updateScrollyStep = (index, updates) => {
        const newSteps = [...(block.steps || [])];
        newSteps[index] = { ...newSteps[index], ...updates };
        onUpdate({ ...block, steps: newSteps });
    };

    const removeScrollyStep = (index) => {
        const newSteps = (block.steps || []).filter((_, i) => i !== index);
        onUpdate({ ...block, steps: newSteps });
    };

    const contentClass = (isLayoutBlock && !isFullWidth) ? "max-w-2xl mx-auto" : "";

    return (
        <Reorder.Item
            value={block}
            dragListener={false}
            dragControls={dragControls}
            className={`relative group min-h-[50px] p-2 rounded-xl transition-all ${isActive ? 'ring-2 ring-[#FAFF00] bg-gray-50' : 'hover:bg-gray-50/50'}`}
            onClick={(e) => {
                e.stopPropagation();
                onActivate();
            }}
        >
            {/* Control Bar - Floating Top Right */}
                {!isLocked && (
                    <div className="absolute -top-3 right-4 z-50 flex items-center gap-1 bg-white shadow-sm border border-gray-200 rounded-lg p-1 opacity-0 group-hover:opacity-100 transition-all">
                        {/* Drag Handle */}
                        <div
                            className="p-1.5 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded"
                            onPointerDown={(e) => dragControls.start(e)}
                            title="Drag to reorder"
                            data-no-dnd="true"
                        >
                            <GripVertical className="w-3.5 h-3.5" />
                        </div>

                    {/* Layout Toggle */}
                    {isLayoutBlock && (
                        <button
                            onClick={toggleLayout}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title={isFullWidth ? "Switch to Standard Width" : "Switch to Full Width"}
                        >
                            {isFullWidth ? (
                                <Minimize2 className="w-3.5 h-3.5" />
                            ) : (
                                <Maximize2 className="w-3.5 h-3.5" />
                            )}
                        </button>
                    )}

                    {/* Separator */}
                    <div className="w-px h-4 bg-gray-200 mx-0.5" />

                    {/* Delete */}
                    <button
                        onClick={onDelete}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete block"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}

            <div className={contentClass}>
                {block.type === 'beforeAfter' && (
                    <div className="bg-gray-50 p-8 rounded-[2rem] border border-gray-100 space-y-6">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Visual Comparison Protocol</h4>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => !isLocked && onUpdate({ ...block, displayMode: block.displayMode === 'split' ? 'slider' : 'split' })}
                                    className="bg-white border border-gray-100 p-2 rounded-lg text-[9px] font-black uppercase flex items-center gap-2 hover:bg-gray-50 text-gray-500 hover:text-black transition-colors"
                                    title="Toggle Display Mode"
                                >
                                    {block.displayMode === 'split' ? <Columns className="w-3 h-3" /> : <MoveHorizontal className="w-3 h-3" />}
                                    {block.displayMode === 'split' ? 'Split' : 'Slider'}
                                </button>
                                <input
                                    className="bg-white border border-gray-100 p-2 rounded-lg text-[9px] font-black uppercase w-20 text-center"
                                    value={block.leftLabel}
                                    placeholder="Left"
                                    onChange={(e) => onUpdate({ ...block, leftLabel: e.target.value })}
                                    onFocus={onActivate}
                                    disabled={isLocked}
                                />
                                <input
                                    className="bg-white border border-gray-100 p-2 rounded-lg text-[9px] font-black uppercase w-20 text-center"
                                    value={block.rightLabel}
                                    placeholder="Right"
                                    onChange={(e) => onUpdate({ ...block, rightLabel: e.target.value })}
                                    onFocus={onActivate}
                                    disabled={isLocked}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <div className="aspect-[4/3] bg-white rounded-2xl border-2 border-dashed border-gray-100 flex items-center justify-center overflow-hidden relative group/item">
                                    {block.leftImage ? (
                                        isVideo(block.leftImage) ? (
                                            <video src={block.leftImage} className="w-full h-full object-cover" autoPlay muted loop />
                                        ) : (
                                            <img src={block.leftImage} className="w-full h-full object-cover" />
                                        )
                                    ) : (
                                        <Upload className="w-6 h-6 text-gray-200" />
                                    )}
                                    {!isLocked && (
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => {
                                                    console.log('BlockWrapper: Upload triggered for', `${block.id}_left`);
                                                    onTriggerUpload(`${block.id}_left`);
                                                }}
                                                className="bg-[#FAFF00] text-black px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1 hover:bg-black hover:text-white transition-all"
                                            >
                                                {uploadingField === `${block.id}_left` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                                                {block.leftImage ? 'Replace' : 'Upload'}
                                            </button>
                                            {block.leftImage && (
                                                <button
                                                    onClick={() => onUpdate({ ...block, leftImage: '' })}
                                                    className="bg-white/20 text-white px-2 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-red-500 transition-all"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="aspect-[4/3] bg-white rounded-2xl border-2 border-dashed border-gray-100 flex items-center justify-center overflow-hidden relative group/item">
                                    {block.rightImage ? (
                                        isVideo(block.rightImage) ? (
                                            <video src={block.rightImage} className="w-full h-full object-cover" autoPlay muted loop />
                                        ) : (
                                            <img src={block.rightImage} className="w-full h-full object-cover" />
                                        )
                                    ) : (
                                        <Upload className="w-6 h-6 text-gray-200" />
                                    )}
                                    {!isLocked && (
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => {
                                                    console.log('BlockWrapper: Upload triggered for', `${block.id}_right`);
                                                    onTriggerUpload(`${block.id}_right`);
                                                }}
                                                className="bg-[#FAFF00] text-black px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1 hover:bg-black hover:text-white transition-all"
                                            >
                                                {uploadingField === `${block.id}_right` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                                                {block.rightImage ? 'Replace' : 'Upload'}
                                            </button>
                                            {block.rightImage && (
                                                <button
                                                    onClick={() => onUpdate({ ...block, rightImage: '' })}
                                                    className="bg-white/20 text-white px-2 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-red-500 transition-all"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <input
                            className="w-full bg-white border border-gray-100 p-4 rounded-2xl text-xs font-medium text-gray-500 italic"
                            placeholder="Provide a caption for the comparison..."
                            value={block.caption}
                            onChange={(e) => onUpdate({ ...block, caption: e.target.value })}
                            onFocus={onActivate}
                            disabled={isLocked}
                        />
                    </div>
                )}
                {block.type === 'p' && (
                    <RichTextEditor
                        value={block.text}
                        onChange={(value) => onUpdate({ ...block, text: value })}
                        placeholder="Start writing..."
                        className="w-full text-xl font-serif leading-relaxed outline-none border-none bg-transparent"
                        onFocus={onActivate}
                        disabled={isLocked}
                    />
                )}
                {block.type === 'heading' && (
                    <input
                        className="w-full text-4xl font-black outline-none border-none placeholder:text-gray-100 tracking-tighter bg-transparent"
                        placeholder="Section Subheading..."
                        value={block.text}
                        onChange={(e) => onUpdate({ ...block, text: e.target.value })}
                        onFocus={onActivate}
                        disabled={isLocked}
                    />
                )}
                {block.type === 'quote' && (
                    <div className="pl-6 border-l-4 border-[#FAFF00] space-y-2 py-2">
                        <RichTextEditor
                            value={block.text}
                            onChange={(value) => onUpdate({ ...block, text: value })}
                            placeholder="The striking quote..."
                            className="w-full text-2xl font-serif italic font-bold outline-none border-none bg-transparent"
                            onFocus={onActivate}
                            disabled={isLocked}
                        />
                        <input
                            className="w-full text-xs font-black uppercase tracking-widest outline-none border-none text-gray-400 bg-transparent"
                            placeholder="— Source Attribution"
                            value={block.author}
                            onChange={(e) => onUpdate({ ...block, author: e.target.value })}
                            onFocus={onActivate}
                            disabled={isLocked}
                        />
                    </div>
                )}
                {block.type === 'callout' && (
                    <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100 space-y-4">
                        <input
                            className="w-full text-[10px] font-black uppercase tracking-[0.2em] outline-none border-none text-gray-400 bg-transparent"
                            placeholder="Callout Title (e.g. CONTEXT)"
                            value={block.title}
                            onChange={(e) => onUpdate({ ...block, title: e.target.value })}
                            onFocus={onActivate}
                            disabled={isLocked}
                        />
                        <RichTextEditor
                            value={block.text}
                            onChange={(value) => onUpdate({ ...block, text: value })}
                            placeholder="Factual highlight or insight..."
                            className="w-full text-lg font-bold outline-none border-none bg-transparent"
                            onFocus={onActivate}
                            disabled={isLocked}
                        />
                    </div>
                )}
                {block.type === 'image' && (
                    <div className="space-y-4">
                        {block.url ? (
                            <div className="relative group/img aspect-video rounded-3xl overflow-hidden bg-gray-50 border border-gray-100">
                                <img src={block.url} className="w-full h-full object-cover" />
                                {!isLocked && (
                                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover/img:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => onTriggerUpload(block.id)}
                                            className="bg-[#FAFF00] text-black p-3 rounded-full hover:bg-black hover:text-white transition-all"
                                            title="Replace Image"
                                        >
                                            <Upload className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => onUpdate({ ...block, url: '' })}
                                            className="bg-black/50 text-white p-3 rounded-full hover:bg-red-500 transition-all"
                                            title="Remove Image"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <button
                                onClick={() => {
                                    if (!isLocked) onTriggerUpload(block.id);
                                }}
                                className="w-full aspect-video rounded-3xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center gap-4 text-gray-300 hover:border-black hover:text-black transition-all"
                            >
                                {uploadingField === block.id ? <Loader2 className="animate-spin" /> : <Upload className="w-8 h-8" />}
                                <span className="text-xs font-black uppercase tracking-widest">Upload Visual Content</span>
                            </button>
                        )}
                    </div>
                )}
                {block.type === 'video' && (
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <input
                                className="flex-1 bg-white border border-gray-100 p-3 rounded-xl text-xs font-medium"
                                placeholder="Video URL (Vimeo/YouTube/MP4)..."
                                value={block.url}
                                onChange={(e) => onUpdate({ ...block, url: e.target.value })}
                                onFocus={onActivate}
                                disabled={isLocked}
                            />
                            <button
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${block.autoplay ? 'bg-black text-white border-black' : 'bg-white text-gray-400 border-gray-100'}`}
                                onClick={() => !isLocked && onUpdate({ ...block, autoplay: !block.autoplay })}
                            >
                                Autoplay
                            </button>
                        </div>
                        {block.url && (
                            <div className="aspect-video bg-black rounded-2xl overflow-hidden flex items-center justify-center relative border border-gray-100">
                                <Video className="w-12 h-12 text-white/50" />
                            </div>
                        )}
                        <input
                            className="w-full bg-white border border-gray-100 p-4 rounded-2xl text-xs font-medium text-gray-500 italic"
                            placeholder="Video caption..."
                            value={block.caption}
                            onChange={(e) => onUpdate({ ...block, caption: e.target.value })}
                            onFocus={onActivate}
                            disabled={isLocked}
                        />
                    </div>
                )}
                {block.type === 'map' && (
                    <div className="bg-white border border-gray-100 p-4 rounded-3xl space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <MapIcon className="w-4 h-4 text-gray-400" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Interactive Map</span>
                        </div>
                        <MapConfigurator
                            value={block}
                            onChange={(newConfig) => onUpdate({ ...block, ...newConfig })}
                        />
                        <input
                            className="w-full bg-white border border-gray-100 p-4 rounded-2xl text-xs font-medium text-gray-500 italic"
                            placeholder="Map caption..."
                            value={block.caption || ''}
                            onChange={(e) => onUpdate({ ...block, caption: e.target.value })}
                            onFocus={onActivate}
                            disabled={isLocked}
                        />
                    </div>
                )}
                {block.type === 'chart' && (
                    <div className="space-y-4">
                        <ChartConfigurator
                            value={{
                                type: block.chartType || 'line',
                                title: block.label || '',
                                accentColor: block.accentColor || '#FAFF00',
                                data: (block.chartData || []).map((val, i) => ({
                                    value: val,
                                    label: (block.chartLabels || [])[i] || '',
                                    color: (block.chartColors || [])[i] || block.accentColor || '#FAFF00'
                                })),
                                annotations: block.annotations || []
                            }}
                            onChange={(newConfig) => {
                                onUpdate({
                                    ...block,
                                    chartType: newConfig.type,
                                    label: newConfig.title,
                                    accentColor: newConfig.accentColor,
                                    chartData: newConfig.data.map(d => Number(d.value)),
                                    chartLabels: newConfig.data.map(d => d.label),
                                    chartColors: newConfig.data.map(d => d.color),
                                    annotations: newConfig.annotations
                                });
                            }}
                        />
                        <input
                            className="w-full bg-white border border-gray-100 p-4 rounded-2xl text-xs font-medium text-gray-500 italic"
                            placeholder="Chart caption..."
                            value={block.caption || ''}
                            onChange={(e) => onUpdate({ ...block, caption: e.target.value })}
                            onFocus={onActivate}
                            disabled={isLocked}
                        />
                    </div>
                )}
                {block.type === 'bottleneck' && (
                    <div className="bg-white border border-gray-100 p-6 rounded-3xl space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <MoveHorizontal className="w-4 h-4 text-gray-400" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Bottleneck</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Source Label</label>
                                <input
                                    className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl text-xs font-bold"
                                    value={block.sourceLabel || ''}
                                    onChange={(e) => onUpdate({ ...block, sourceLabel: e.target.value })}
                                    disabled={isLocked}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Source Value</label>
                                <input
                                    type="number"
                                    className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl text-xs font-bold"
                                    value={block.sourceValue ?? ''}
                                    onChange={(e) => onUpdate({ ...block, sourceValue: Number(e.target.value) })}
                                    disabled={isLocked}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Output Label</label>
                                <input
                                    className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl text-xs font-bold"
                                    value={block.outputLabel || ''}
                                    onChange={(e) => onUpdate({ ...block, outputLabel: e.target.value })}
                                    disabled={isLocked}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Output Value</label>
                                <input
                                    type="number"
                                    className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl text-xs font-bold"
                                    value={block.outputValue ?? ''}
                                    onChange={(e) => onUpdate({ ...block, outputValue: Number(e.target.value) })}
                                    disabled={isLocked}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Unit</label>
                                <input
                                    className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl text-xs font-bold"
                                    value={block.unit || ''}
                                    onChange={(e) => onUpdate({ ...block, unit: e.target.value })}
                                    disabled={isLocked}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Caption</label>
                                <input
                                    className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl text-xs font-bold"
                                    value={block.caption || ''}
                                    onChange={(e) => onUpdate({ ...block, caption: e.target.value })}
                                    disabled={isLocked}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Bottleneck Label</label>
                                <input
                                    className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl text-xs font-bold"
                                    value={block.bottleneckLabel || ''}
                                    onChange={(e) => onUpdate({ ...block, bottleneckLabel: e.target.value })}
                                    disabled={isLocked}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Bottleneck Sub-Label</label>
                                <input
                                    className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl text-xs font-bold"
                                    value={block.bottleneckSubLabel || ''}
                                    onChange={(e) => onUpdate({ ...block, bottleneckSubLabel: e.target.value })}
                                    disabled={isLocked}
                                />
                            </div>
                        </div>

                        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
                            <BottleneckGraphic
                                sourceLabel={block.sourceLabel}
                                sourceValue={block.sourceValue}
                                outputLabel={block.outputLabel}
                                outputValue={block.outputValue}
                                unit={block.unit}
                                bottleneckLabel={block.bottleneckLabel}
                                bottleneckSubLabel={block.bottleneckSubLabel}
                                caption={block.caption}
                            />
                        </div>
                    </div>
                )}
                {block.type === 'timeline' && (
                    <div className="bg-white border border-gray-100 p-6 rounded-3xl space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <ArrowLeft className="w-4 h-4 text-gray-400" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Timeline</span>
                            </div>
                            {!isLocked && (
                                <button
                                    onClick={() => onUpdate({
                                        ...block,
                                        timelineSteps: [...(block.timelineSteps || []), { year: '2025', label: 'New Milestone' }]
                                    })}
                                    className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg bg-gray-100 hover:bg-black hover:text-white transition-colors"
                                >
                                    Add Point
                                </button>
                            )}
                        </div>

                        <input
                            className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl text-xs font-bold"
                            placeholder="Timeline Label"
                            value={block.label || ''}
                            onChange={(e) => onUpdate({ ...block, label: e.target.value })}
                            onFocus={onActivate}
                            disabled={isLocked}
                        />

                        <div className="space-y-2">
                            {(block.timelineSteps || []).map((entry, entryIndex) => (
                                <div key={entryIndex} className="grid grid-cols-12 gap-2 items-center">
                                    <input
                                        className="col-span-3 bg-gray-50 border border-gray-100 p-2 rounded-lg text-[10px] font-black uppercase tracking-widest"
                                        placeholder="Year"
                                        value={entry.year || ''}
                                        onChange={(e) => {
                                            const next = [...(block.timelineSteps || [])];
                                            next[entryIndex] = { ...next[entryIndex], year: e.target.value };
                                            onUpdate({ ...block, timelineSteps: next });
                                        }}
                                        onFocus={onActivate}
                                        disabled={isLocked}
                                    />
                                    <input
                                        className="col-span-8 bg-gray-50 border border-gray-100 p-2 rounded-lg text-xs font-medium"
                                        placeholder="Event description"
                                        value={entry.label || ''}
                                        onChange={(e) => {
                                            const next = [...(block.timelineSteps || [])];
                                            next[entryIndex] = { ...next[entryIndex], label: e.target.value };
                                            onUpdate({ ...block, timelineSteps: next });
                                        }}
                                        onFocus={onActivate}
                                        disabled={isLocked}
                                    />
                                    {!isLocked && (
                                        <button
                                            className="col-span-1 text-gray-300 hover:text-red-500"
                                            onClick={() => {
                                                const next = (block.timelineSteps || []).filter((_, i) => i !== entryIndex);
                                                onUpdate({ ...block, timelineSteps: next });
                                            }}
                                            title="Remove"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            ))}
                            {(block.timelineSteps || []).length === 0 && (
                                <p className="text-[10px] text-gray-300 italic">No timeline points yet.</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Highlight Year</span>
                            <select
                                className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl text-xs font-bold"
                                value={block.highlight || ''}
                                onChange={(e) => onUpdate({ ...block, highlight: e.target.value })}
                                disabled={isLocked}
                            >
                                <option value="">None</option>
                                {(block.timelineSteps || []).map((entry, entryIndex) => (
                                    <option key={entryIndex} value={entry.year}>{entry.year}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Timeline Style</span>
                            <div className="grid grid-cols-3 gap-2">
                                {['track', 'stacked', 'cards'].map((style) => (
                                    <button
                                        key={style}
                                        onClick={() => !isLocked && onUpdate({ ...block, style })}
                                        className={`p-2 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${block.style === style ? 'bg-black text-white border-black' : 'bg-white text-gray-400 border-gray-200 hover:text-black'}`}
                                    >
                                        {style}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="h-[420px] bg-gray-50 border border-gray-100 rounded-2xl overflow-hidden">
                            <Timeline label={block.label} highlight={block.highlight} steps={block.timelineSteps || []} variant={block.style || 'track'} />
                        </div>
                    </div>
                )}
                {block.type === 'scrolly-group' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                            <div className="flex items-center gap-2">
                                <Layers className="w-4 h-4 text-gray-400" />
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Scrollytelling Sequence</h4>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => !isLocked && addScrollyStep('map')} className="text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 bg-gray-100 hover:bg-black hover:text-white rounded-lg transition-colors flex items-center gap-1"><MapIcon className="w-3 h-3" /> Map</button>
                                <button onClick={() => !isLocked && addScrollyStep('chart')} className="text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 bg-gray-100 hover:bg-black hover:text-white rounded-lg transition-colors flex items-center gap-1"><BarChart3 className="w-3 h-3" /> Chart</button>
                                <button onClick={() => !isLocked && addScrollyStep('media')} className="text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 bg-gray-100 hover:bg-black hover:text-white rounded-lg transition-colors flex items-center gap-1"><Video className="w-3 h-3" /> Media</button>
                                <button onClick={() => !isLocked && addScrollyStep('tactical')} className="text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 bg-gray-100 hover:bg-black hover:text-white rounded-lg transition-colors flex items-center gap-1"><Crosshair className="w-3 h-3" /> Tactics</button>
                                <button onClick={() => !isLocked && addScrollyStep('timeline')} className="text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 bg-gray-100 hover:bg-black hover:text-white rounded-lg transition-colors flex items-center gap-1"><ArrowLeft className="w-3 h-3" /> History</button>
                                <button onClick={() => !isLocked && addScrollyStep('text')} className="text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 bg-gray-100 hover:bg-black hover:text-white rounded-lg transition-colors flex items-center gap-1"><AlignLeft className="w-3 h-3" /> Text</button>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {(block.steps || []).map((step, idx) => (
                                <div key={idx} className="bg-white border border-gray-100 p-6 rounded-2xl space-y-4 shadow-sm relative group/step">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-bold">{idx + 1}</div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{step.type} Step</span>
                                        </div>
                                        <button onClick={() => !isLocked && removeScrollyStep(idx)} className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover/step:opacity-100">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            {step.type === 'map' && (
                                                <MapConfigurator
                                                    value={step}
                                                    onChange={(newConfig) => updateScrollyStep(idx, newConfig)}
                                                />
                                            )}
                                            {step.type === 'chart' && (
                                                <ChartConfigurator
                                                    value={{
                                                        type: step.chartType || 'line',
                                                        title: step.label || '',
                                                        accentColor: step.accentColor || '#FAFF00',
                                                        data: (step.chartData || []).map((val, i) => ({
                                                            value: val,
                                                            label: (step.chartLabels || [])[i] || '',
                                                            color: (step.chartColors || [])[i] || step.accentColor || '#FAFF00'
                                                        }))
                                                    }}
                                                    onChange={(newConfig) => {
                                                        updateScrollyStep(idx, {
                                                            ...step,
                                                            chartType: newConfig.type,
                                                            label: newConfig.title,
                                                            accentColor: newConfig.accentColor,
                                                            chartData: newConfig.data.map(d => Number(d.value)),
                                                            chartLabels: newConfig.data.map(d => d.label),
                                                            chartColors: newConfig.data.map(d => d.color)
                                                        });
                                                    }}
                                                />
                                            )}
                                            {step.type === 'timeline' && (
                                                <div className="space-y-4">
                                                    <input
                                                        className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl text-xs font-bold"
                                                        placeholder="Timeline Label"
                                                        value={step.label || ''}
                                                        onChange={(e) => updateScrollyStep(idx, { label: e.target.value })}
                                                        disabled={isLocked}
                                                    />
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Timeline Points</span>
                                                            <button
                                                                onClick={() => !isLocked && updateScrollyStep(idx, {
                                                                    timelineSteps: [...(step.timelineSteps || []), { year: '2025', label: 'New Milestone' }]
                                                                })}
                                                                className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg bg-gray-100 hover:bg-black hover:text-white transition-colors"
                                                            >
                                                                Add Point
                                                            </button>
                                                        </div>
                                                        <div className="space-y-2">
                                                            {(step.timelineSteps || []).map((entry, entryIndex) => (
                                                                <div key={entryIndex} className="grid grid-cols-12 gap-2 items-center">
                                                                    <input
                                                                        className="col-span-3 bg-white border border-gray-100 p-2 rounded-lg text-[10px] font-black uppercase tracking-widest"
                                                                        placeholder="Year"
                                                                        value={entry.year || ''}
                                                                        onChange={(e) => {
                                                                            const next = [...(step.timelineSteps || [])];
                                                                            next[entryIndex] = { ...next[entryIndex], year: e.target.value };
                                                                            updateScrollyStep(idx, { timelineSteps: next });
                                                                        }}
                                                                        disabled={isLocked}
                                                                    />
                                                                    <input
                                                                        className="col-span-8 bg-white border border-gray-100 p-2 rounded-lg text-xs font-medium"
                                                                        placeholder="Event description"
                                                                        value={entry.label || ''}
                                                                        onChange={(e) => {
                                                                            const next = [...(step.timelineSteps || [])];
                                                                            next[entryIndex] = { ...next[entryIndex], label: e.target.value };
                                                                            updateScrollyStep(idx, { timelineSteps: next });
                                                                        }}
                                                                        disabled={isLocked}
                                                                    />
                                                                    <button
                                                                        className="col-span-1 text-gray-300 hover:text-red-500"
                                                                        onClick={() => {
                                                                            if (isLocked) return;
                                                                            const next = (step.timelineSteps || []).filter((_, i) => i !== entryIndex);
                                                                            updateScrollyStep(idx, { timelineSteps: next });
                                                                        }}
                                                                        title="Remove"
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                            {(step.timelineSteps || []).length === 0 && (
                                                                <p className="text-[10px] text-gray-300 italic">No timeline points yet.</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Highlight Year</span>
                                                        <select
                                                            className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl text-xs font-bold"
                                                            value={step.highlight || ''}
                                                            onChange={(e) => updateScrollyStep(idx, { highlight: e.target.value })}
                                                            disabled={isLocked}
                                                        >
                                                            <option value="">None</option>
                                                            {(step.timelineSteps || []).map((entry, entryIndex) => (
                                                                <option key={entryIndex} value={entry.year}>{entry.year}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                            )}
                                            {step.type === 'text' && (
                                                <input
                                                    className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl text-xs font-bold"
                                                    placeholder="Section Label (Optional)"
                                                    value={step.label || ''}
                                                    onChange={(e) => updateScrollyStep(idx, { label: e.target.value })}
                                                    disabled={isLocked}
                                                />
                                            )}
                                        </div>
                                        <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl">
                                            <RichTextEditor
                                                value={step.text || ''}
                                                onChange={(value) => updateScrollyStep(idx, { text: value })}
                                                placeholder="Narrative text for this step..."
                                                className="w-full text-xs font-medium leading-relaxed outline-none border-none bg-transparent"
                                                onFocus={onActivate}
                                                disabled={isLocked}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {(block.steps || []).length === 0 && (
                                <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-300">Empty Sequence</p>
                                    <p className="text-xs text-gray-400 mt-1">Add a visual step to begin</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {!isLocked && (
                    <div className="mt-6 border-t border-gray-100 pt-4 space-y-3">
                        <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">
                            <MessageSquarePlus className="w-3.5 h-3.5" /> Editorial Notes
                        </div>
                        <div className="space-y-2">
                            {comments.map((comment) => (
                                <div key={comment.id} className="flex items-start justify-between gap-4 bg-white border border-gray-100 rounded-xl p-3">
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-800">{comment.text}</p>
                                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">{new Date(comment.createdAt).toLocaleString()}</p>
                                    </div>
                                    <button
                                        onClick={() => removeComment(comment.id)}
                                        className="text-gray-300 hover:text-red-500 transition-colors"
                                        title="Remove note"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                            {comments.length === 0 && (
                                <p className="text-[10px] text-gray-300 italic">No notes yet.</p>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                className="flex-1 bg-white border border-gray-100 p-3 rounded-xl text-[10px] font-bold"
                                placeholder="Add an editorial note..."
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                onFocus={onActivate}
                            />
                            <button
                                onClick={addComment}
                                className="bg-black text-white px-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest"
                            >
                                Add
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </Reorder.Item>
    );
}

import { Reorder, useDragControls } from 'framer-motion';
import { Trash2, Upload, Loader2, X, GripVertical, Maximize2, Minimize2 } from 'lucide-react';

export default function BlockWrapper({ block, onUpdate, onDelete, isLocked, uploadingField, onTriggerUpload }) {
    const dragControls = useDragControls();
    
    const isLayoutBlock = ['image', 'beforeAfter', 'callout', 'quote'].includes(block.type);
    const isFullWidth = block.layout === 'full-width';

    const toggleLayout = () => {
        onUpdate({ 
            ...block, 
            layout: isFullWidth ? 'standard' : 'full-width' 
        });
    };

    const contentClass = (isLayoutBlock && !isFullWidth) ? "max-w-2xl mx-auto" : "";

    return (
        <Reorder.Item
            value={block}
            dragListener={!isLocked}
            dragControls={dragControls}
            className="relative group min-h-[50px]"
        >
            {/* Control Bar - Floating Top Right */}
            {!isLocked && (
                <div className="absolute -top-3 right-4 z-50 flex items-center gap-1 bg-white shadow-sm border border-gray-200 rounded-lg p-1 opacity-0 group-hover:opacity-100 transition-all">
                    {/* Drag Handle */}
                    <div 
                        className="p-1.5 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded"
                        onPointerDown={(e) => dragControls.start(e)}
                        title="Drag to reorder"
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
                            <input
                                className="bg-white border border-gray-100 p-2 rounded-lg text-[9px] font-black uppercase w-20 text-center"
                                value={block.leftLabel}
                                placeholder="Left"
                                onChange={(e) => onUpdate({ ...block, leftLabel: e.target.value })}
                                disabled={isLocked}
                            />
                            <input
                                className="bg-white border border-gray-100 p-2 rounded-lg text-[9px] font-black uppercase w-20 text-center"
                                value={block.rightLabel}
                                placeholder="Right"
                                onChange={(e) => onUpdate({ ...block, rightLabel: e.target.value })}
                                disabled={isLocked}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                            <div className="aspect-[4/3] bg-white rounded-2xl border-2 border-dashed border-gray-100 flex items-center justify-center overflow-hidden relative group/item">
                                {block.leftImage ? (
                                    <img src={block.leftImage} className="w-full h-full object-cover" />
                                ) : (
                                    <Upload className="w-6 h-6 text-gray-200" />
                                )}
                                <button
                                    onClick={() => {
                                        if (isLocked) return;
                                        onTriggerUpload(`${block.id}_left`);
                                    }}
                                    className="absolute inset-0 bg-black/40 opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center justify-center text-white text-[9px] font-black uppercase tracking-widest"
                                >
                                    {uploadingField === `${block.id}_left` ? <Loader2 className="animate-spin" /> : 'Choose Primary'}
                                </button>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="aspect-[4/3] bg-white rounded-2xl border-2 border-dashed border-gray-100 flex items-center justify-center overflow-hidden relative group/item">
                                {block.rightImage ? (
                                    <img src={block.rightImage} className="w-full h-full object-cover" />
                                ) : (
                                    <Upload className="w-6 h-6 text-gray-200" />
                                )}
                                <button
                                    onClick={() => {
                                        if (isLocked) return;
                                        onTriggerUpload(`${block.id}_right`);
                                    }}
                                    className="absolute inset-0 bg-black/40 opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center justify-center text-white text-[9px] font-black uppercase tracking-widest"
                                >
                                    {uploadingField === `${block.id}_right` ? <Loader2 className="animate-spin" /> : 'Choose Secondary'}
                                </button>
                            </div>
                        </div>
                    </div>
                    <input
                        className="w-full bg-white border border-gray-100 p-4 rounded-2xl text-xs font-medium text-gray-500 italic"
                        placeholder="Provide a caption for the comparison..."
                        value={block.caption}
                        onChange={(e) => onUpdate({ ...block, caption: e.target.value })}
                        disabled={isLocked}
                    />
                </div>
            )}
            {block.type === 'p' && (
                <textarea
                    className="w-full text-xl font-serif leading-relaxed outline-none resize-none border-none placeholder:text-gray-400 bg-transparent"
                    placeholder="Start writing..."
                    rows="1"
                    style={{ height: 'auto', minHeight: '1em' }}
                    value={block.text}
                    onChange={(e) => {
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                        onUpdate({ ...block, text: e.target.value });
                    }}
                    onInput={(e) => {
                         e.target.style.height = 'auto';
                         e.target.style.height = e.target.scrollHeight + 'px';
                    }}
                    disabled={isLocked}
                />
            )}
            {block.type === 'heading' && (
                <input
                    className="w-full text-4xl font-black outline-none border-none placeholder:text-gray-100 tracking-tighter bg-transparent"
                    placeholder="Section Subheading..."
                    value={block.text}
                    onChange={(e) => onUpdate({ ...block, text: e.target.value })}
                    disabled={isLocked}
                />
            )}
            {block.type === 'quote' && (
                <div className="pl-6 border-l-4 border-[#FAFF00] space-y-2 py-2">
                    <textarea
                        className="w-full text-2xl font-serif italic font-bold outline-none resize-none border-none placeholder:text-gray-200 bg-transparent"
                        placeholder="The striking quote..."
                        rows="1"
                        value={block.text}
                        onChange={(e) => onUpdate({ ...block, text: e.target.value })}
                        disabled={isLocked}
                    />
                    <input
                        className="w-full text-xs font-black uppercase tracking-widest outline-none border-none text-gray-400 bg-transparent"
                        placeholder="— Source Attribution"
                        value={block.author}
                        onChange={(e) => onUpdate({ ...block, author: e.target.value })}
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
                        disabled={isLocked}
                    />
                    <textarea
                        className="w-full text-lg font-bold outline-none resize-none border-none placeholder:text-gray-200 bg-transparent"
                        placeholder="Factual highlight or insight..."
                        rows="1"
                        value={block.text}
                        onChange={(e) => onUpdate({ ...block, text: e.target.value })}
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
                                <button 
                                    onClick={() => onUpdate({ ...block, url: '' })} 
                                    className="absolute top-4 right-4 bg-black/50 text-white p-3 rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity"
                                >
                                    <X className="w-4 h-4" />
                                </button>
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
            </div>
        </Reorder.Item>
    );
}

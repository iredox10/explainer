import React from 'react';
import { Reorder, useDragControls } from 'framer-motion';
import { GripVertical, Trash2, Maximize2, Minimize2 } from 'lucide-react';

export default function BlockWrapper({ block, onDelete, onUpdate, children }) {
    const dragControls = useDragControls();
    
    // Determine if this block type supports resizing (layout toggling)
    // Common resizeable types in this project seems to be images, charts, maps
    const isResizable = ['image', 'map', 'chart', 'scrolly-section'].includes(block.type);
    const isFullWidth = block.layout === 'full-width';

    const toggleLayout = () => {
        if (!onUpdate) return;
        const newLayout = isFullWidth ? 'contained' : 'full-width';
        onUpdate(block.id, { layout: newLayout });
    };

    return (
        <Reorder.Item
            value={block}
            dragListener={false}
            dragControls={dragControls}
            className="relative group mb-6"
        >
            {/* Control Bar - Visible on Hover */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 p-1 bg-gray-900 text-white rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto">
                
                {/* Drag Handle */}
                <div 
                    className="p-1.5 cursor-grab active:cursor-grabbing hover:bg-gray-700 rounded-md transition-colors"
                    onPointerDown={(e) => dragControls.start(e)}
                >
                    <GripVertical className="w-3.5 h-3.5 text-gray-400" />
                </div>

                {/* Separator */}
                <div className="w-px h-3 bg-gray-700 mx-0.5" />

                {/* Resize Toggle (if supported) */}
                {isResizable && (
                    <button
                        onClick={toggleLayout}
                        className="p-1.5 hover:bg-gray-700 rounded-md transition-colors text-gray-300 hover:text-white"
                        title={isFullWidth ? "Shrink to Container" : "Expand to Full Width"}
                    >
                        {isFullWidth ? (
                            <Minimize2 className="w-3.5 h-3.5" />
                        ) : (
                            <Maximize2 className="w-3.5 h-3.5" />
                        )}
                    </button>
                )}

                {/* Delete Button */}
                <button
                    onClick={() => onDelete(block.id)}
                    className="p-1.5 hover:bg-red-900/50 text-gray-300 hover:text-red-400 rounded-md transition-colors"
                    title="Delete Block"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Block Content Container */}
            <div className={`
                relative rounded-xl border-2 border-transparent transition-all duration-200
                ${isFullWidth ? 'w-full' : 'max-w-3xl mx-auto'}
                group-hover:border-gray-100 group-hover:bg-gray-50/50
            `}>
                {children}
            </div>
            
            {/* Active Indicator (Left Border) */}
            <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-gray-200 opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />
            
        </Reorder.Item>
    );
}

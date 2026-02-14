import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, RotateCcw, ZoomIn, ZoomOut, Move, Crop } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ImageCropper({ imageFile, onCrop, onCancel }) {
    const [imageSrc, setImageSrc] = useState(null);
    const [cropBox, setCropBox] = useState({ x: 10, y: 10, width: 80, height: 60 });
    const [aspectRatio, setAspectRatio] = useState(null);
    const [rotation, setRotation] = useState(0);
    const [scale, setScale] = useState(1);
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [resizeHandle, setResizeHandle] = useState(null);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
    const [isLoading, setIsLoading] = useState(true);
    
    const containerRef = useRef(null);
    const imageRef = useRef(null);

    useEffect(() => {
        if (imageFile) {
            console.log('ImageCropper: Loading image file', imageFile.name, imageFile.type);
            setIsLoading(true);
            const reader = new FileReader();
            reader.onload = (e) => {
                console.log('ImageCropper: File read successfully');
                setImageSrc(e.target.result);
                const img = new Image();
                img.onload = () => {
                    console.log('ImageCropper: Image loaded', img.width, 'x', img.height);
                    setImageSize({ width: img.width, height: img.height });
                    setIsLoading(false);
                };
                img.onerror = () => {
                    console.error('ImageCropper: Failed to load image');
                    setIsLoading(false);
                };
                img.src = e.target.result;
            };
            reader.onerror = () => {
                console.error('ImageCropper: Failed to read file');
                setIsLoading(false);
            };
            reader.readAsDataURL(imageFile);
        }
    }, [imageFile]);

    useEffect(() => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setContainerSize({ width: rect.width, height: rect.height });
        }
    }, [imageSrc]);

    const aspectRatios = [
        { label: 'Free', value: null },
        { label: '16:9', value: 16 / 9 },
        { label: '4:3', value: 4 / 3 },
        { label: '1:1', value: 1 },
        { label: '3:4', value: 3 / 4 },
        { label: '9:16', value: 9 / 16 },
    ];

    const handleAspectRatioChange = (ratio) => {
        setAspectRatio(ratio);
        if (ratio) {
            const newHeight = cropBox.width / ratio;
            const maxY = 100 - newHeight;
            setCropBox(prev => ({
                ...prev,
                height: newHeight,
                y: Math.min(prev.y, Math.max(0, maxY))
            }));
        }
    };

    const handleMouseDown = (e, action, handle = null) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (action === 'drag') {
            setIsDragging(true);
            setDragStart({ x: e.clientX, y: e.clientY });
        } else if (action === 'resize') {
            setIsResizing(true);
            setResizeHandle(handle);
            setDragStart({ x: e.clientX, y: e.clientY });
        }
    };

    const handleMouseMove = useCallback((e) => {
        if (!isDragging && !isResizing) return;

        const deltaX = ((e.clientX - dragStart.x) / containerSize.width) * 100;
        const deltaY = ((e.clientY - dragStart.y) / containerSize.height) * 100;

        if (isDragging) {
            setCropBox(prev => {
                const newX = Math.max(0, Math.min(100 - prev.width, prev.x + deltaX));
                const newY = Math.max(0, Math.min(100 - prev.height, prev.y + deltaY));
                return { ...prev, x: newX, y: newY };
            });
        } else if (isResizing) {
            setCropBox(prev => {
                let newBox = { ...prev };
                
                const minSize = 10;
                
                if (resizeHandle.includes('e')) {
                    newBox.width = Math.max(minSize, Math.min(100 - prev.x, prev.width + deltaX));
                    if (aspectRatio) {
                        newBox.height = newBox.width / aspectRatio;
                    }
                }
                if (resizeHandle.includes('w')) {
                    const newWidth = Math.max(minSize, prev.width - deltaX);
                    const newX = prev.x + prev.width - newWidth;
                    if (newX >= 0) {
                        newBox.width = newWidth;
                        newBox.x = newX;
                        if (aspectRatio) {
                            newBox.height = newBox.width / aspectRatio;
                        }
                    }
                }
                if (resizeHandle.includes('s')) {
                    newBox.height = Math.max(minSize, Math.min(100 - prev.y, prev.height + deltaY));
                    if (aspectRatio) {
                        newBox.width = newBox.height * aspectRatio;
                    }
                }
                if (resizeHandle.includes('n')) {
                    const newHeight = Math.max(minSize, prev.height - deltaY);
                    const newY = prev.y + prev.height - newHeight;
                    if (newY >= 0) {
                        newBox.height = newHeight;
                        newBox.y = newY;
                        if (aspectRatio) {
                            newBox.width = newBox.height * aspectRatio;
                        }
                    }
                }
                
                newBox.x = Math.max(0, Math.min(100 - newBox.width, newBox.x));
                newBox.y = Math.max(0, Math.min(100 - newBox.height, newBox.y));
                
                return newBox;
            });
        }

        setDragStart({ x: e.clientX, y: e.clientY });
    }, [isDragging, isResizing, resizeHandle, dragStart, containerSize, aspectRatio]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
        setIsResizing(false);
        setResizeHandle(null);
    }, []);

    useEffect(() => {
        if (isDragging || isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

    const handleCrop = async () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
            const scaleX = img.width / 100;
            const scaleY = img.height / 100;
            
            const cropX = cropBox.x * scaleX;
            const cropY = cropBox.y * scaleY;
            const cropWidth = cropBox.width * scaleX;
            const cropHeight = cropBox.height * scaleY;
            
            canvas.width = cropWidth;
            canvas.height = cropHeight;
            
            if (rotation !== 0 || scale !== 1) {
                ctx.translate(canvas.width / 2, canvas.height / 2);
                ctx.rotate((rotation * Math.PI) / 180);
                ctx.scale(scale, scale);
                ctx.translate(-canvas.width / 2, -canvas.height / 2);
            }
            
            ctx.drawImage(
                img,
                cropX, cropY, cropWidth, cropHeight,
                0, 0, cropWidth, cropHeight
            );
            
            canvas.toBlob((blob) => {
                const croppedFile = new File([blob], imageFile.name, {
                    type: imageFile.type || 'image/jpeg',
                    lastModified: Date.now()
                });
                onCrop(croppedFile);
            }, imageFile.type || 'image/jpeg', 0.9);
        };
        
        img.src = imageSrc;
    };

    const handleReset = () => {
        setCropBox({ x: 10, y: 10, width: 80, height: 60 });
        setRotation(0);
        setScale(1);
        setAspectRatio(null);
    };

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted || !imageSrc) {
        return createPortal(
            <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center">
                <div className="text-white font-black uppercase tracking-widest">Loading cropper...</div>
            </div>,
            document.body
        );
    }

    return createPortal(
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] bg-black/90 flex flex-col"
            >
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <div className="flex items-center gap-4">
                        <h2 className="text-white font-black uppercase tracking-widest text-sm">Crop Image</h2>
                        <div className="flex gap-1">
                            {aspectRatios.map((ar) => (
                                <button
                                    key={ar.label}
                                    onClick={() => handleAspectRatioChange(ar.value)}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                                        aspectRatio === ar.value
                                            ? 'bg-[#FAFF00] text-black'
                                            : 'bg-white/10 text-white hover:bg-white/20'
                                    }`}
                                >
                                    {ar.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleReset}
                            className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all"
                            title="Reset"
                        >
                            <RotateCcw className="w-4 h-4" />
                        </button>
                        <button
                            onClick={onCancel}
                            className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleCrop}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#FAFF00] text-black hover:bg-[#FAFF00]/80 transition-all font-black uppercase text-xs tracking-widest"
                        >
                            <Check className="w-4 h-4" />
                            Apply Crop
                        </button>
                    </div>
                </div>

                <div className="flex-1 flex items-center justify-center p-8 overflow-hidden">
                    <div
                        ref={containerRef}
                        className="relative max-w-full max-h-full select-none"
                        style={{
                            transform: `rotate(${rotation}deg) scale(${scale})`,
                        }}
                    >
                        <img
                            ref={imageRef}
                            src={imageSrc}
                            alt="Crop preview"
                            className="max-w-full max-h-[70vh] object-contain"
                            draggable={false}
                        />

                        <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                                background: `linear-gradient(to right, rgba(0,0,0,0.6) ${cropBox.x}%, rgba(0,0,0,0.6) ${cropBox.x}%, transparent ${cropBox.x}%, transparent ${cropBox.x + cropBox.width}%, rgba(0,0,0,0.6) ${cropBox.x + cropBox.width}%),
                                             linear-gradient(to bottom, rgba(0,0,0,0.6) ${cropBox.y}%, transparent ${cropBox.y}%, transparent ${cropBox.y + cropBox.height}%, rgba(0,0,0,0.6) ${cropBox.y + cropBox.height}%)`
                            }}
                        />

                        <div
                            className="absolute border-2 border-[#FAFF00] cursor-move pointer-events-auto"
                            style={{
                                left: `${cropBox.x}%`,
                                top: `${cropBox.y}%`,
                                width: `${cropBox.width}%`,
                                height: `${cropBox.height}%`,
                            }}
                            onMouseDown={(e) => handleMouseDown(e, 'drag')}
                        >
                            <div className="absolute inset-0 pointer-events-none">
                                <div className="absolute inset-0 border border-white/30" />
                                
                                <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/30" />
                                <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/30" />
                                <div className="absolute top-1/3 left-0 right-0 h-px bg-white/30" />
                                <div className="absolute top-2/3 left-0 right-0 h-px bg-white/30" />
                            </div>

                            <div
                                className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-[#FAFF00] cursor-nw-resize"
                                onMouseDown={(e) => handleMouseDown(e, 'resize', 'nw')}
                            />
                            <div
                                className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-[#FAFF00] cursor-n-resize"
                                onMouseDown={(e) => handleMouseDown(e, 'resize', 'n')}
                            />
                            <div
                                className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-[#FAFF00] cursor-ne-resize"
                                onMouseDown={(e) => handleMouseDown(e, 'resize', 'ne')}
                            />
                            <div
                                className="absolute top-1/2 -translate-y-1/2 -left-1.5 w-3 h-3 bg-white border-2 border-[#FAFF00] cursor-w-resize"
                                onMouseDown={(e) => handleMouseDown(e, 'resize', 'w')}
                            />
                            <div
                                className="absolute top-1/2 -translate-y-1/2 -right-1.5 w-3 h-3 bg-white border-2 border-[#FAFF00] cursor-e-resize"
                                onMouseDown={(e) => handleMouseDown(e, 'resize', 'e')}
                            />
                            <div
                                className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-[#FAFF00] cursor-sw-resize"
                                onMouseDown={(e) => handleMouseDown(e, 'resize', 'sw')}
                            />
                            <div
                                className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-[#FAFF00] cursor-s-resize"
                                onMouseDown={(e) => handleMouseDown(e, 'resize', 's')}
                            />
                            <div
                                className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-[#FAFF00] cursor-se-resize"
                                onMouseDown={(e) => handleMouseDown(e, 'resize', 'se')}
                            />
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-white/10 flex items-center justify-center gap-4">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setScale(Math.max(0.5, scale - 0.1))}
                            className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all"
                            title="Zoom Out"
                        >
                            <ZoomOut className="w-4 h-4" />
                        </button>
                        <span className="text-white text-xs font-bold w-16 text-center">{Math.round(scale * 100)}%</span>
                        <button
                            onClick={() => setScale(Math.min(2, scale + 0.1))}
                            className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all"
                            title="Zoom In"
                        >
                            <ZoomIn className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="h-6 w-px bg-white/20" />

                    <div className="flex items-center gap-2">
                        <span className="text-white/50 text-[10px] uppercase tracking-widest">Rotation</span>
                        <input
                            type="range"
                            min="-180"
                            max="180"
                            value={rotation}
                            onChange={(e) => setRotation(Number(e.target.value))}
                            className="w-32 accent-[#FAFF00]"
                        />
                        <span className="text-white text-xs font-bold w-12 text-center">{rotation}°</span>
                    </div>

                    <div className="h-6 w-px bg-white/20" />

                    <div className="text-white/50 text-xs">
                        Crop: {Math.round(cropBox.width)}% × {Math.round(cropBox.height)}%
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>,
        document.body
    );
}
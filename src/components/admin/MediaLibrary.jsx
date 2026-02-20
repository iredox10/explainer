import { useState, useEffect, useCallback } from 'react';
import { Image, Search, Upload, X, Tag, Trash2, Loader2, Grid, List, Filter, Check, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { mediaService, useImageOptimizer } from '../../lib/media';

export default function MediaLibrary({ onSelect, mode = 'browse', selectedIds = [] }) {
    const [media, setMedia] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTags, setSelectedTags] = useState([]);
    const [availableTags, setAvailableTags] = useState([]);
    const [viewMode, setViewMode] = useState('grid');
    const [uploading, setUploading] = useState(false);
    const [selectedMedia, setSelectedMedia] = useState(null);
    const [showTagInput, setShowTagInput] = useState(false);
    const [newTag, setNewTag] = useState('');

    const { optimizeImage } = useImageOptimizer();

    useEffect(() => {
        loadMedia();
        loadTags();
    }, [searchTerm, selectedTags]);

    const loadMedia = async () => {
        setLoading(true);
        try {
            const filters = {};
            if (searchTerm) filters.search = searchTerm;
            if (selectedTags.length > 0) filters.tag = selectedTags[0];
            
            const data = await mediaService.getMediaLibrary(filters);
            setMedia(data);
        } catch (e) {
            console.error('Error loading media:', e);
        } finally {
            setLoading(false);
        }
    };

    const loadTags = async () => {
        try {
            const tags = await mediaService.getPopularTags();
            setAvailableTags(tags);
        } catch (e) {
            console.error('Error loading tags:', e);
        }
    };

    const handleUpload = useCallback(async (files) => {
        setUploading(true);
        try {
            for (const file of files) {
                const optimized = await optimizeImage(file, {
                    maxWidth: 1920,
                    quality: 0.85,
                    format: 'webp'
                });

                await mediaService.uploadMedia(optimized.file, {
                    filename: file.name,
                    originalSize: file.size,
                    optimizedSize: optimized.optimizedSize,
                    dimensions: JSON.stringify(optimized.dimensions)
                });
            }
            await loadMedia();
            await loadTags();
        } catch (e) {
            console.error('Error uploading:', e);
        } finally {
            setUploading(false);
        }
    }, [optimizeImage]);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
        if (files.length > 0) handleUpload(files);
    }, [handleUpload]);

    const handleSelect = (item) => {
        if (mode === 'select') {
            onSelect?.(item);
        } else {
            setSelectedMedia(selectedMedia?.$id === item.$id ? null : item);
        }
    };

    const handleDelete = async (item) => {
        if (confirm(`Delete "${item.originalName || item.filename}"?`)) {
            await mediaService.deleteMedia(item.$id, item.fileId);
            setMedia(media.filter(m => m.$id !== item.$id));
            if (selectedMedia?.$id === item.$id) setSelectedMedia(null);
        }
    };

    const handleAddTag = async (mediaId, tag) => {
        if (!tag.trim()) return;
        await mediaService.addTag(mediaId, tag.trim());
        await loadMedia();
        await loadTags();
        setNewTag('');
        setShowTagInput(false);
    };

    const handleRemoveTag = async (mediaId, tag) => {
        await mediaService.removeTag(mediaId, tag);
        await loadMedia();
        await loadTags();
    };

    const filteredMedia = media.filter(item => {
        if (selectedTags.length > 0) {
            const itemTags = item.tags || [];
            if (!selectedTags.some(t => itemTags.includes(t))) return false;
        }
        if (searchTerm) {
            return (item.filename || '').toLowerCase().includes(searchTerm.toLowerCase());
        }
        return true;
    });

    return (
        <div 
            className="h-full flex flex-col bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
        >
            <div className="p-4 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search media..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white border border-gray-200 rounded-xl py-2 pl-10 pr-4 text-xs font-bold focus:outline-none focus:border-black"
                            />
                        </div>
                        <div className="flex gap-1">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-black text-[#FAFF00]' : 'text-gray-400 hover:bg-gray-100'}`}
                            >
                                <Grid className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-black text-[#FAFF00]' : 'text-gray-400 hover:bg-gray-100'}`}
                            >
                                <List className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <label className="flex items-center gap-2 px-4 py-2 bg-[#FAFF00] text-black rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-black hover:text-[#FAFF00] transition-all">
                        <Upload className="w-4 h-4" />
                        Upload
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={(e) => handleUpload(Array.from(e.target.files))}
                        />
                    </label>
                </div>

                {availableTags.length > 0 && (
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <Filter className="w-3 h-3 text-gray-400" />
                        {availableTags.slice(0, 8).map(({ tag, count }) => (
                            <button
                                key={tag}
                                onClick={() => setSelectedTags(
                                    selectedTags.includes(tag) 
                                        ? selectedTags.filter(t => t !== tag)
                                        : [tag]
                                )}
                                className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider transition-all ${
                                    selectedTags.includes(tag)
                                        ? 'bg-black text-[#FAFF00]'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                {tag} ({count})
                            </button>
                        ))}
                        {selectedTags.length > 0 && (
                            <button
                                onClick={() => setSelectedTags([])}
                                className="text-[9px] font-bold text-gray-400 hover:text-black"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="animate-spin w-8 h-8 text-[#FAFF00]" />
                    </div>
                ) : filteredMedia.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <Image className="w-12 h-12 mb-4 opacity-30" />
                        <p className="text-xs font-bold uppercase tracking-widest">No media found</p>
                        <p className="text-[10px] mt-1">Drop images here to upload</p>
                    </div>
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {filteredMedia.map(item => (
                            <motion.div
                                key={item.$id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                onClick={() => handleSelect(item)}
                                className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer group ${
                                    (selectedIds.includes(item.$id) || selectedMedia?.$id === item.$id)
                                        ? 'ring-2 ring-[#FAFF00] ring-offset-2'
                                        : ''
                                }`}
                            >
                                <img 
                                    src={item.url} 
                                    alt={item.originalName || item.filename}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                    {mode === 'select' ? (
                                        <Check className="w-8 h-8 text-[#FAFF00]" />
                                    ) : (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(item); }}
                                                className="p-2 bg-red-500 rounded-lg text-white hover:bg-red-600 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                {item.tags && item.tags.length > 0 && (
                                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                                        <div className="flex gap-1 flex-wrap">
                                            {item.tags.slice(0, 2).map(tag => (
                                                <span key={tag} className="text-[8px] font-bold text-white bg-white/20 px-1 rounded">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filteredMedia.map(item => (
                            <div
                                key={item.$id}
                                onClick={() => handleSelect(item)}
                                className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all ${
                                    (selectedIds.includes(item.$id) || selectedMedia?.$id === item.$id)
                                        ? 'bg-[#FAFF00]/10 border-2 border-[#FAFF00]'
                                        : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                                }`}
                            >
                                <img 
                                    src={item.url} 
                                    alt={item.originalName || item.filename}
                                    className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold truncate">{item.originalName || item.filename}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] text-gray-400">
                                            {formatFileSize(item.size || item.optimizedSize)}
                                        </span>
                                        <span className="text-[10px] text-gray-300">·</span>
                                        <span className="text-[10px] text-gray-400">
                                            {new Date(item.uploadedAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    {item.tags && item.tags.length > 0 && (
                                        <div className="flex gap-1 mt-2">
                                            {item.tags.map(tag => (
                                                <span 
                                                    key={tag}
                                                    className="text-[8px] font-bold text-gray-500 bg-gray-200 px-1 rounded"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {mode === 'browse' && (
                                    <div className="flex gap-2">
                                        <a
                                            href={item.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="p-2 text-gray-400 hover:text-[#FAFF00] transition-colors"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(item); }}
                                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <AnimatePresence>
                {selectedMedia && mode === 'browse' && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-gray-100 bg-gray-50 overflow-hidden"
                    >
                        <div className="p-4">
                            <div className="flex items-start gap-4">
                                <img 
                                    src={selectedMedia.url} 
                                    alt={selectedMedia.originalName}
                                    className="w-24 h-24 object-cover rounded-xl"
                                />
                                <div className="flex-1">
                                    <h3 className="text-sm font-bold truncate">{selectedMedia.originalName || selectedMedia.filename}</h3>
                                    <p className="text-[10px] text-gray-400 mt-1">
                                        {selectedMedia.dimensions && `${JSON.parse(selectedMedia.dimensions).width}×${JSON.parse(selectedMedia.dimensions).height}`}
                                        {' · '}{formatFileSize(selectedMedia.size || selectedMedia.optimizedSize)}
                                    </p>
                                    
                                    <div className="flex items-center gap-2 mt-3">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Tags:</span>
                                        {(selectedMedia.tags || []).map(tag => (
                                            <span 
                                                key={tag}
                                                onClick={() => handleRemoveTag(selectedMedia.$id, tag)}
                                                className="text-[9px] font-bold text-gray-600 bg-gray-200 px-2 py-0.5 rounded cursor-pointer hover:bg-red-100 hover:text-red-600 transition-colors flex items-center gap-1"
                                            >
                                                {tag}
                                                <X className="w-2 h-2" />
                                            </span>
                                        ))}
                                        {showTagInput ? (
                                            <input
                                                type="text"
                                                value={newTag}
                                                onChange={(e) => setNewTag(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleAddTag(selectedMedia.$id, newTag);
                                                    if (e.key === 'Escape') setShowTagInput(false);
                                                }}
                                                onBlur={() => setShowTagInput(false)}
                                                placeholder="Add tag..."
                                                autoFocus
                                                className="text-[9px] font-bold px-2 py-0.5 border border-gray-200 rounded focus:outline-none focus:border-[#FAFF00]"
                                            />
                                        ) : (
                                            <button
                                                onClick={() => setShowTagInput(true)}
                                                className="text-[9px] font-bold text-gray-400 hover:text-black transition-colors"
                                            >
                                                + Add tag
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedMedia(null)}
                                    className="p-1 text-gray-400 hover:text-black transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {uploading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center"
                    >
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 className="animate-spin w-8 h-8 text-[#FAFF00]" />
                            <p className="text-xs font-bold uppercase tracking-widest">Uploading...</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function formatFileSize(bytes) {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaPicker({ onSelect, onClose }) {
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-4xl h-[80vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-lg font-black uppercase tracking-tighter">Media Library</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-black transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex-1 overflow-hidden">
                    <MediaLibrary 
                        mode="select" 
                        onSelect={(item) => {
                            onSelect(item);
                            onClose();
                        }}
                    />
                </div>
            </motion.div>
        </div>
    );
}
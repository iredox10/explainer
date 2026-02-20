import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, Eye, EyeOff, AlertCircle, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function RevisionDiff({ snapshots, currentContent, onRestore }) {
    const [selectedRevision, setSelectedRevision] = useState(null);
    const [viewMode, setViewMode] = useState('side-by-side');
    const [diffResult, setDiffResult] = useState(null);

    useEffect(() => {
        if (selectedRevision && currentContent) {
            const diff = computeDiff(
                selectedRevision.content || [],
                currentContent
            );
            setDiffResult(diff);
        }
    }, [selectedRevision, currentContent]);

    const computeDiff = (oldContent, newContent) => {
        const oldBlocks = Array.isArray(oldContent) ? oldContent : [];
        const newBlocks = Array.isArray(newContent) ? newContent : [];
        
        const diff = [];
        const maxLen = Math.max(oldBlocks.length, newBlocks.length);
        
        for (let i = 0; i < maxLen; i++) {
            const oldBlock = oldBlocks[i];
            const newBlock = newBlocks[i];
            
            if (!oldBlock && newBlock) {
                diff.push({ type: 'added', newBlock, index: i });
            } else if (oldBlock && !newBlock) {
                diff.push({ type: 'removed', oldBlock, index: i });
            } else if (oldBlock && newBlock) {
                if (JSON.stringify(oldBlock) !== JSON.stringify(newBlock)) {
                    const textDiff = diffText(
                        oldBlock.text || '',
                        newBlock.text || ''
                    );
                    diff.push({ 
                        type: 'modified', 
                        oldBlock, 
                        newBlock, 
                        textDiff,
                        index: i 
                    });
                } else {
                    diff.push({ type: 'unchanged', block: oldBlock, index: i });
                }
            }
        }
        
        return {
            additions: diff.filter(d => d.type === 'added').length,
            removals: diff.filter(d => d.type === 'removed').length,
            modifications: diff.filter(d => d.type === 'modified').length,
            unchanged: diff.filter(d => d.type === 'unchanged').length,
            blocks: diff
        };
    };

    const diffText = (oldText, newText) => {
        const oldWords = oldText.split(/(\s+)/);
        const newWords = newText.split(/(\s+)/);
        
        const result = [];
        const maxLen = Math.max(oldWords.length, newWords.length);
        
        for (let i = 0; i < maxLen; i++) {
            const oldWord = oldWords[i];
            const newWord = newWords[i];
            
            if (oldWord === newWord) {
                result.push({ text: oldWord, type: 'unchanged' });
            } else if (!oldWord) {
                result.push({ text: newWord, type: 'added' });
            } else if (!newWord) {
                result.push({ text: oldWord, type: 'removed' });
            } else {
                result.push({ text: oldWord, type: 'removed' });
                result.push({ text: newWord, type: 'added' });
            }
        }
        
        return result;
    };

    const handleRestore = () => {
        if (selectedRevision && confirm('Restore this revision? Current content will be replaced.')) {
            onRestore?.(selectedRevision);
            setSelectedRevision(null);
        }
    };

    if (!snapshots || snapshots.length === 0) {
        return (
            <div className="p-8 text-center text-gray-400">
                <AlertCircle className="w-8 h-8 mx-auto mb-4 opacity-30" />
                <p className="text-xs font-bold uppercase tracking-widest">No revision history</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black uppercase tracking-tighter">Revision History</h3>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setViewMode(viewMode === 'side-by-side' ? 'inline' : 'side-by-side')}
                            className="px-3 py-1.5 bg-white border border-gray-200 rounded text-[10px] font-black uppercase tracking-widest hover:bg-gray-50"
                        >
                            {viewMode === 'side-by-side' ? 'Inline View' : 'Side by Side'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex">
                <div className="w-1/3 border-r border-gray-100 max-h-[500px] overflow-y-auto">
                    {snapshots.map((snapshot, i) => (
                        <div
                            key={snapshot.$id || snapshot.timestamp || i}
                            onClick={() => setSelectedRevision(snapshot)}
                            className={`p-4 cursor-pointer border-b border-gray-50 transition-all ${
                                selectedRevision === snapshot
                                    ? 'bg-[#FAFF00]/10 border-l-4 border-l-[#FAFF00]'
                                    : 'hover:bg-gray-50'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-bold">
                                    {new Date(snapshot.timestamp || snapshot.savedAt).toLocaleDateString()}
                                </span>
                                <span className="text-[10px] text-gray-400">
                                    {new Date(snapshot.timestamp || snapshot.savedAt).toLocaleTimeString()}
                                </span>
                            </div>
                            <p className="text-[10px] text-gray-400 truncate">
                                {snapshot.savedBy || 'Auto-save'}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="flex-1 p-4">
                    {selectedRevision ? (
                        <>
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className="text-xs font-bold text-gray-900">
                                        Comparing with current version
                                    </p>
                                    <p className="text-[10px] text-gray-400">
                                        {diffResult?.additions || 0} additions, 
                                        {' '}{diffResult?.removals || 0} removals, 
                                        {' '}{diffResult?.modifications || 0} modifications
                                    </p>
                                </div>
                                <button
                                    onClick={handleRestore}
                                    className="px-4 py-2 bg-[#FAFF00] text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-yellow-300 flex items-center gap-2"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                    Restore
                                </button>
                            </div>

                            <div className={`overflow-y-auto max-h-[400px] ${viewMode === 'side-by-side' ? 'grid grid-cols-2 gap-4' : 'space-y-3'}`}>
                                {viewMode === 'side-by-side' ? (
                                    <>
                                        <div>
                                            <div className="sticky top-0 bg-gray-100 p-2 rounded-t-xl text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">
                                                Old Version
                                            </div>
                                            {diffResult?.blocks.map((d, i) => (
                                                d.type !== 'added' && (
                                                    <DiffBlock key={i} diff={d} side="old" />
                                                )
                                            ))}
                                        </div>
                                        <div>
                                            <div className="sticky top-0 bg-gray-100 p-2 rounded-t-xl text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">
                                                Current Version
                                            </div>
                                            {diffResult?.blocks.map((d, i) => (
                                                d.type !== 'removed' && (
                                                    <DiffBlock key={i} diff={d} side="new" />
                                                )
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    diffResult?.blocks.map((d, i) => (
                                        <DiffBlock key={i} diff={d} inline />
                                    ))
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
                            <ChevronLeft className="w-8 h-8 mb-4 opacity-30" />
                            <p className="text-xs font-bold uppercase tracking-widest">Select a revision to compare</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function DiffBlock({ diff, side, inline }) {
    const getBlockStyle = () => {
        if (diff.type === 'added') return 'bg-green-50 border-l-4 border-l-green-500';
        if (diff.type === 'removed') return 'bg-red-50 border-l-4 border-l-red-500';
        if (diff.type === 'modified') return side === 'old' 
            ? 'bg-red-50 border-l-4 border-l-red-400'
            : 'bg-green-50 border-l-4 border-l-green-400';
        return 'bg-white';
    };

    const block = diff.oldBlock || diff.newBlock || diff.block;
    
    if (!block) return null;

    return (
        <div className={`p-3 rounded-lg mb-2 ${getBlockStyle()}`}>
            <div className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1 flex items-center gap-2">
                {block.type}
                {inline && (
                    <span className={`${
                        diff.type === 'added' ? 'text-green-600' :
                        diff.type === 'removed' ? 'text-red-600' :
                        diff.type === 'modified' ? 'text-yellow-600' :
                        'text-gray-400'
                    }`}>
                        ({diff.type})
                    </span>
                )}
            </div>
            
            {diff.type === 'modified' && diff.textDiff ? (
                <p className="text-xs leading-relaxed">
                    {diff.textDiff.map((word, i) => (
                        <span 
                            key={i}
                            className={
                                word.type === 'added' ? 'bg-green-200 text-green-800' :
                                word.type === 'removed' ? 'bg-red-200 text-red-800 line-through' :
                                ''
                            }
                        >
                            {word.text}
                        </span>
                    ))}
                </p>
            ) : (
                <p className="text-xs leading-relaxed line-clamp-3">
                    {block.text || block.heading || `[${block.type} block]`}
                </p>
            )}
        </div>
    );
}
import { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, Info, ChevronDown, ChevronUp, Lightbulb, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { seoService, useSeoChecklist } from '../../lib/seo';

export default function SEOScorecard({ story, onUpdate }) {
    const [expanded, setExpanded] = useState(false);
    const analysis = useSeoChecklist(story);

    if (!analysis) return null;

    const { score, grade, issues, warnings, passes, checklist } = analysis;
    const gradeColor = seoService.getGradeColor(grade);

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
            <div 
                onClick={() => setExpanded(!expanded)}
                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div 
                            className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-black"
                            style={{ backgroundColor: `${gradeColor}20`, color: gradeColor }}
                        >
                            {grade}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-lg font-black text-gray-900">SEO Score</span>
                                <span className="text-sm font-bold text-gray-400">{score}/100</span>
                            </div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                {issues.length} issues · {warnings.length} warnings
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {score >= 80 ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : score >= 60 ? (
                            <AlertTriangle className="w-5 h-5 text-yellow-500" />
                        ) : (
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                        )}
                        {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 pb-4 border-t border-gray-100 pt-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                {checklist.map((item) => (
                                    <div 
                                        key={item.id}
                                        className={`flex items-center gap-3 p-3 rounded-xl ${
                                            item.passed 
                                                ? 'bg-green-50' 
                                                : 'bg-gray-50'
                                        }`}
                                    >
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                                            item.passed 
                                                ? 'bg-green-500' 
                                                : 'bg-gray-300'
                                        }`}>
                                            {item.passed && (
                                                <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-gray-900">{item.label}</p>
                                            <p className="text-[10px] text-gray-400 truncate">{item.message}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {issues.length > 0 && (
                                <div className="mb-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-red-600 mb-2 flex items-center gap-2">
                                        <AlertTriangle className="w-3 h-3" />
                                        Issues ({issues.length})
                                    </h4>
                                    <div className="space-y-2">
                                        {issues.map((issue, i) => (
                                            <div key={i} className="p-3 bg-red-50 rounded-xl">
                                                <p className="text-xs font-bold text-red-700">{issue.message}</p>
                                                {onUpdate && issue.field && (
                                                    <button
                                                        onClick={() => onUpdate(issue.field)}
                                                        className="text-[10px] font-bold text-red-500 underline mt-1"
                                                    >
                                                        Fix now
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {warnings.length > 0 && (
                                <div>
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-yellow-600 mb-2 flex items-center gap-2">
                                        <Info className="w-3 h-3" />
                                        Suggestions ({warnings.length})
                                    </h4>
                                    <div className="space-y-2">
                                        {warnings.map((warning, i) => (
                                            <div key={i} className="p-3 bg-yellow-50 rounded-xl">
                                                <p className="text-xs font-bold text-yellow-700">{warning.message}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {passes.length > 3 && (
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <p className="text-[10px] font-bold text-green-600 flex items-center gap-2">
                                        <Sparkles className="w-3 h-3" />
                                        {passes.length} optimizations applied
                                    </p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export function KeywordSuggestions({ content, onSelect }) {
    const [keywords, setKeywords] = useState([]);

    useEffect(() => {
        if (content) {
            const extracted = seoService.extractKeywords(content);
            setKeywords(extracted);
        }
    }, [content]);

    if (keywords.length === 0) return null;

    return (
        <div className="bg-gray-50 rounded-xl p-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3 flex items-center gap-2">
                <Lightbulb className="w-3 h-3" />
                Suggested Keywords
            </h4>
            <div className="flex flex-wrap gap-2">
                {keywords.map(({ word, count }) => (
                    <button
                        key={word}
                        onClick={() => onSelect?.(word)}
                        className="px-2 py-1 bg-white border border-gray-200 rounded text-[10px] font-bold hover:bg-[#FAFF00] hover:border-black transition-all"
                    >
                        {word} <span className="text-gray-400">({count})</span>
                    </button>
                ))}
            </div>
        </div>
    );
}

export function ReadabilityStats({ content }) {
    const [stats, setStats] = useState(null);

    useEffect(() => {
        if (content) {
            const readTime = seoService.calculateReadTime(content);
            const keywords = seoService.extractKeywords(content);
            
            let totalWords = 0;
            let totalSentences = 0;
            let totalParagraphs = 0;
            
            if (Array.isArray(content)) {
                content.forEach(block => {
                    if (block.text) {
                        const text = block.text;
                        totalWords += text.split(/\s+/).filter(w => w.length > 0).length;
                        totalSentences += (text.match(/[.!?]+/g) || []).length || 1;
                        if (block.type === 'p') totalParagraphs++;
                    }
                });
            }
            
            const avgWordsPerSentence = totalSentences > 0 ? Math.round(totalWords / totalSentences) : 0;
            
            setStats({
                readTime,
                wordCount: totalWords,
                sentenceCount: totalSentences,
                paragraphCount: totalParagraphs,
                avgWordsPerSentence,
                topKeywords: keywords.slice(0, 5)
            });
        }
    }, [content]);

    if (!stats) return null;

    return (
        <div className="bg-white rounded-xl p-4 border border-gray-100">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Readability</h4>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <p className="text-2xl font-black text-gray-900">{stats.readTime}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Min Read</p>
                </div>
                <div>
                    <p className="text-2xl font-black text-gray-900">{stats.wordCount.toLocaleString()}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Words</p>
                </div>
                <div>
                    <p className="text-2xl font-black text-gray-900">{stats.paragraphCount}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Paragraphs</p>
                </div>
                <div>
                    <p className="text-2xl font-black text-gray-900">{stats.avgWordsPerSentence}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Avg Words/Sentence</p>
                </div>
            </div>
            
            {stats.avgWordsPerSentence > 25 && (
                <div className="mt-3 p-2 bg-yellow-50 rounded-lg">
                    <p className="text-[10px] font-bold text-yellow-700">
                        ⚠️ Sentences are long. Aim for 15-20 words per sentence.
                    </p>
                </div>
            )}
        </div>
    );
}
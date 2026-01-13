import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Save, Plus, Trash2, Image as ImageIcon, Type, X, AlertCircle, Loader2, Upload, Send, CheckSquare, Eye, Clock, History, Search, ChevronRight, ExternalLink, BookOpen, Zap, Settings2, Video, Layers } from 'lucide-react';
import { Reorder } from 'framer-motion';
import BlockWrapper from './BlockWrapper';
import { getCurrentUser, ROLES } from '../../lib/authStore';
import { storyService, categoryService } from '../../lib/services';

export default function StoryEditor({ storyId }) {
    const [user, setUser] = useState(null);
    const [story, setStory] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDirty, setIsDirty] = useState(false);
    const [saveStatus, setSaveStatus] = useState('idle');
    const [uploadingField, setUploadingField] = useState(null);
    const [showMeta, setShowMeta] = useState(true);
    const [showGhostPreview, setShowGhostPreview] = useState(false);
    const [focusedStepIndex, setFocusedStepIndex] = useState(null);
    const [activeBlockId, setActiveBlockId] = useState(null);
    const [categories, setCategories] = useState([]);

    const fileInputRef = useRef(null);
    const previewIframeRef = useRef(null);

    useEffect(() => {
        if (showGhostPreview && previewIframeRef.current && story) {
            previewIframeRef.current.contentWindow?.postMessage({
                type: 'GHOST_PREVIEW_UPDATE',
                story,
                activeStepIndex: focusedStepIndex
            }, '*');
        }
    }, [story, showGhostPreview, focusedStepIndex]);

    useEffect(() => {
        const u = getCurrentUser();
        if (!u) {
            window.location.href = '/admin/login';
            return;
        }
        setUser(u);
        loadStory(u);
        fetchCategories();
    }, [storyId]);

    const fetchCategories = async () => {
        try {
            const cats = await categoryService.getCategories();
            const u = getCurrentUser();
            if (u && u.role === ROLES.EDITOR && u.categories?.length > 0) {
                setCategories(cats.filter(c => u.categories.includes(c.name)));
            } else {
                setCategories(cats);
            }
        } catch (e) {
            console.error("Failed to fetch categories", e);
        }
    };

    const loadStory = async (currentUser) => {
        setIsLoading(true);
        if (storyId === 'new-story') {
            const initialCategory = (currentUser.role === ROLES.EDITOR && currentUser.categories?.length > 0) 
                ? currentUser.categories[0] 
                : "Technology";

            setStory({
                headline: "Untitled Story",
                subhead: "",
                category: initialCategory,
                author: currentUser.name,
                author_id: currentUser.id,
                workflow_status: "draft",
                status: "Draft", // Legacy field mapping
                layout: "standard",
                videoUrl: "",
                isFeatured: false,
                content: JSON.stringify([{ id: 1, type: "p", text: "" }]),
                scrollySections: JSON.stringify([]),
                heroImage: "",
                version_log: JSON.stringify([{ action: "Dispatch Created", user: currentUser.name, timestamp: new Date().toISOString() }])
            });
        } else {
            const data = await storyService.getStoryById(storyId);
            if (data) {
                // Check Lock
                if (data.locked_by && data.locked_by !== currentUser.id) {
                    alert("This story is currently being edited by another team member.");
                    window.location.href = '/admin/stories';
                    return;
                }
                
                // Migration: Move legacy scrollySections to a content block
                const legacySections = typeof data.scrollySections === 'string' ? JSON.parse(data.scrollySections || '[]') : (data.scrollySections || []);
                let content = typeof data.content === 'string' ? JSON.parse(data.content) : (data.content || []);
                const hasScrollyGroup = content.some(b => b.type === 'scrolly-group');

                if (legacySections.length > 0 && !hasScrollyGroup) {
                    content.push({
                        id: Date.now(),
                        type: 'scrolly-group',
                        steps: legacySections
                    });
                    data.content = JSON.stringify(content);
                    data.scrollySections = '[]';
                }

                setStory(data);
            }
        }
        setIsLoading(false);
    };

    if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin w-12 h-12 text-[#FAFF00]" /></div>;
    if (!user || !story) return null;

    const isWriter = user.role === ROLES.WRITER;
    const isEditor = user.role === ROLES.EDITOR || user.role === ROLES.ADMIN;

    const canEdit = !isWriter || story.workflow_status === 'draft';
    const isLocked = isWriter && story.workflow_status !== 'draft';

    const content = typeof story.content === 'string' ? JSON.parse(story.content) : (story.content || []);

    const handleChange = (field, value) => {
        if (isLocked) return;
        setStory(prev => ({ ...prev, [field]: value }));
        setIsDirty(true);
        setSaveStatus('idle');
    };

    const updateContent = (newContent) => { handleChange('content', JSON.stringify(newContent)); };

    const handleInsertBlock = (type) => {
        const newId = Date.now() + Math.random();
        let newBlock = { id: newId, type };

        switch (type) {
            case 'p':
                newBlock = { ...newBlock, text: '' };
                break;
            case 'heading':
                newBlock = { ...newBlock, text: '' };
                break;
            case 'image':
                newBlock = { ...newBlock, url: '' };
                break;
            case 'video':
                newBlock = { ...newBlock, url: '', caption: '', autoplay: false };
                break;
            case 'quote':
                newBlock = { ...newBlock, text: '', author: '' };
                break;
            case 'callout':
                newBlock = { ...newBlock, title: 'Context', text: '' };
                break;
            case 'beforeAfter':
                newBlock = { ...newBlock, leftImage: '', rightImage: '', leftLabel: 'Before', rightLabel: 'After', caption: '' };
                break;
            case 'scrolly-group':
                newBlock = { 
                    ...newBlock, 
                    steps: [{ type: 'map', center: [20, 0], zoom: 1, highlight: [], label: 'New Sequence', text: '' }] 
                };
                break;
            default:
                break;
        }

        const currentContent = [...content];
        const activeIndex = activeBlockId ? currentContent.findIndex(b => b.id === activeBlockId) : -1;

        if (activeIndex !== -1) {
            currentContent.splice(activeIndex + 1, 0, newBlock);
        } else {
            currentContent.push(newBlock);
        }

        updateContent(currentContent);
        setActiveBlockId(newId);
    };

    const handleFileUpload = async (e, target) => {
        const file = e.target.files[0];
        if (!file) return;

        const actualTarget = window._currentUploadTarget || target;

        setUploadingField(actualTarget);
        try {
            const url = await storyService.uploadImage(file);
            if (actualTarget === 'hero') handleChange('heroImage', url);
            else if (actualTarget.includes('_left')) {
                const id = actualTarget.split('_')[0];
                updateContent(content.map(b => b.id == id ? { ...b, leftImage: url } : b));
            } else if (actualTarget.includes('_right')) {
                const id = actualTarget.split('_')[0];
                updateContent(content.map(b => b.id == id ? { ...b, rightImage: url } : b));
            }
            else updateContent(content.map(b => b.id === actualTarget ? { ...b, url } : b));
        } catch (err) { alert("Upload failed: " + err.message); }
        finally { setUploadingField(null); window._currentUploadTarget = null; }
    };

    const performSave = async (newStatus) => {
        setSaveStatus('saving');
        try {
            const payload = {
                ...story,
                workflow_status: newStatus,
                status: newStatus === 'published' ? 'Published' : (newStatus === 'pending_review' ? 'Pending Review' : 'Draft'),
                content: typeof story.content === 'string' ? story.content : JSON.stringify(story.content || []),
                scrollySections: typeof story.scrollySections === 'string' ? story.scrollySections : JSON.stringify(story.scrollySections || []),
                version_log: (() => {
                    const currentLogs = JSON.parse(story.version_log || '[]');
                    const newLog = { action: `Status changed to ${newStatus}`, user: user.name, timestamp: new Date().toISOString() };
                    const lastLog = currentLogs[currentLogs.length - 1];
                    if (lastLog && lastLog.action === newLog.action && (Date.now() - new Date(lastLog.timestamp).getTime() < 60000)) {
                        return JSON.stringify(currentLogs);
                    }
                    return JSON.stringify([...currentLogs, newLog].slice(-10));
                })()
            };
            const { $id, $createdAt, $updatedAt, $permissions, $databaseId, $collectionId, ...dataToSave } = payload;

            const result = await storyService.saveStory(storyId, dataToSave);
            setStory(result);
            setIsDirty(false);
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 3000);
            if (storyId === 'new-story') window.location.href = `/admin/edit/${result.$id}`;
            return result;
        } catch (e) {
            setSaveStatus('idle');
            alert("Action failed: " + e.message);
            throw e;
        }
    };

    const handlePreview = async () => {
        let currentId = storyId;
        if (isDirty || storyId === 'new-story') {
            try {
                const saved = await performSave(story.workflow_status);
                currentId = saved.$id;
            } catch (e) {
                return;
            }
        }
        window.open(`/admin/preview/${currentId}`, '_blank');
    };

    return (
        <div className="min-h-screen bg-white font-sans text-gray-900 flex">
            {/* Main Editor Zone */}
            <div className="flex-1 flex flex-col min-w-0">
                <nav className="min-h-20 border-b border-gray-100 flex flex-col md:flex-row items-center justify-between px-4 md:px-8 py-4 md:py-0 bg-white/80 backdrop-blur-md sticky top-0 z-40 gap-4">
                    <div className="flex items-center gap-4 md:gap-6 w-full md:w-auto">
                        <a href="/admin/stories" className="p-2 md:p-3 hover:bg-gray-50 rounded-2xl transition-all border border-transparent hover:border-gray-100 group">
                            <ArrowLeft className="w-5 h-5 text-gray-400 group-hover:text-black" />
                        </a>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 md:gap-3">
                                <span className={`text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] px-1.5 py-0.5 rounded border whitespace-nowrap ${story.workflow_status === 'published' ? 'bg-green-50 text-green-700 border-green-100' :
                                    story.workflow_status === 'pending_review' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-gray-50 text-gray-500 border-gray-100'
                                    }`}>
                                    {story.workflow_status}
                                </span>
                                <h1 className="font-bold text-xs md:text-sm truncate max-w-[150px] md:max-w-[300px] tracking-tight">{story.headline}</h1>
                            </div>
                            <p className="text-[9px] md:text-[10px] text-gray-400 font-medium mt-0.5">Editing as <span className="text-black font-bold uppercase">{user.role}</span></p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto justify-end overflow-x-auto no-scrollbar pb-2 md:pb-0">
                        {saveStatus === 'saved' && (<span className="hidden lg:flex text-xs text-green-600 font-bold items-center gap-1.5 animate-in fade-in slide-in-from-right-2 whitespace-nowrap"><CheckSquare className="w-4 h-4" /> Synced</span>)}

                        <a
                            href="/admin/guide"
                            target="_blank"
                            className="p-2 md:p-3 hover:bg-gray-50 rounded-xl text-gray-400 hover:text-black transition-all border border-gray-100 group flex items-center gap-2 shrink-0"
                            title="Open Editorial Guide"
                        >
                            <BookOpen className="w-4 h-4" />
                        </a>

                        <button
                            onClick={handlePreview}
                            className="bg-gray-100 hover:bg-gray-200 text-black px-4 md:px-6 py-2.5 md:py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 md:gap-3 transition-all shrink-0"
                        >
                            <ExternalLink className="w-4 h-4" /> <span className="hidden sm:inline">Preview</span>
                        </button>

                        <button
                            onClick={() => performSave(story.workflow_status)}
                            disabled={saveStatus === 'saving' || !isDirty || isLocked}
                            className="px-3 md:px-5 py-2.5 md:py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-all disabled:opacity-30 shrink-0"
                        >
                            Save
                        </button>

                        {isWriter && story.workflow_status === 'draft' && (
                            <button onClick={() => performSave('pending_review')} className="bg-black text-white px-4 md:px-6 py-2.5 md:py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 md:gap-3 hover:bg-[#008751] transition-all shadow-xl shrink-0">
                                <Send className="w-4 h-4" /> <span className="hidden sm:inline">Submit</span>
                            </button>
                        )}

                        {isEditor && (
                            <div className="flex items-center gap-2 shrink-0">
                                {story.workflow_status === 'pending_review' && (
                                    <>
                                        <button onClick={() => performSave('draft')} className="bg-red-50 text-red-600 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-red-100 hover:bg-red-100 transition-all">
                                            Kick
                                        </button>
                                        <button onClick={() => performSave('approved')} className="bg-blue-600 text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-700 transition-all shadow-xl">
                                            Approve
                                        </button>
                                    </>
                                )}
                                {(story.workflow_status === 'approved' || story.workflow_status === 'published') && (
                                    <button onClick={() => performSave('published')} className="bg-[#FAFF00] text-black px-4 md:px-6 py-2.5 md:py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 md:gap-3 hover:bg-black hover:text-white transition-all shadow-[0_10px_20px_rgba(250,255,0,0.3)] shrink-0">
                                        <CheckSquare className="w-4 h-4" /> <span className="hidden sm:inline">{story.workflow_status === 'published' ? 'Update' : 'Publish'}</span>
                                    </button>
                                )}
                            </div>
                        )}

                        <button onClick={() => setShowGhostPreview(!showGhostPreview)} className={`p-2 md:p-3 rounded-xl transition-all border flex items-center gap-2 shrink-0 ${showGhostPreview ? 'bg-[#FAFF00] border-[#FAFF00] text-black shadow-lg' : 'bg-white border-gray-100 text-gray-400 hover:text-black'}`}>
                            <Zap className={`w-4 h-4 md:w-5 md:h-5 ${showGhostPreview ? 'fill-black' : ''}`} />
                            <span className="text-[9px] font-black uppercase tracking-widest hidden lg:block">Ghost</span>
                        </button>

                        <button onClick={() => setShowMeta(!showMeta)} className={`p-2 md:p-3 rounded-xl transition-all border shrink-0 ${showMeta ? 'bg-gray-100 border-gray-200 text-black' : 'bg-white border-gray-100 text-gray-400'}`}>
                            <Settings2 className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                    </div>
                </nav>

                <div className="flex-1 flex min-h-0 overflow-hidden relative">
                    <div className={`flex-1 overflow-y-auto px-8 py-12 transition-all duration-500 ${showGhostPreview ? 'border-r border-gray-100' : ''}`}>
                        <div className="max-w-4xl mx-auto space-y-12">
                            <header className="space-y-6">
                                <textarea
                                    className="w-full text-6xl font-black leading-[0.9] outline-none resize-none border-none placeholder:text-gray-300 tracking-tighter bg-transparent"
                                    placeholder="THE HEADLINE GOES HERE..."
                                    rows="2"
                                    value={story.headline}
                                    onChange={(e) => handleChange('headline', e.target.value)}
                                    disabled={isLocked}
                                />
                                <textarea
                                    className="w-full text-2xl font-serif text-gray-500 leading-relaxed outline-none resize-none border-none placeholder:text-gray-300 bg-transparent"
                                    placeholder="And the subhead provides the context..."
                                    rows="2"
                                    value={story.subhead}
                                    onChange={(e) => handleChange('subhead', e.target.value)}
                                    disabled={isLocked}
                                />
                            </header>

                            <div className="space-y-8">
                                <Reorder.Group axis="y" values={content} onReorder={updateContent} className="space-y-8">
                                    {content.map((block) => (
                                        <BlockWrapper
                                            key={block.id}
                                            block={block}
                                            isActive={activeBlockId === block.id}
                                            onActivate={() => setActiveBlockId(block.id)}
                                            onUpdate={(updatedBlock) => updateContent(content.map(b => b.id === block.id ? updatedBlock : b))}
                                            onDelete={() => updateContent(content.filter(b => b.id !== block.id))}
                                            isLocked={isLocked}
                                            uploadingField={uploadingField}
                                            onTriggerUpload={(targetId) => {
                                                window._currentUploadTarget = targetId;
                                                fileInputRef.current?.click();
                                            }}
                                        />
                                    ))}
                                </Reorder.Group>

                                {!isLocked && (
                                    <div className="flex flex-wrap items-center gap-4 pt-12 border-t border-gray-50">
                                        <button onClick={() => handleInsertBlock('scrolly-group')} className="flex items-center gap-3 px-6 py-3 bg-gray-50 hover:bg-black hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all">
                                            <Layers className="w-4 h-4" /> Scrolly Group
                                        </button>
                                        <button onClick={() => handleInsertBlock('p')} className="flex items-center gap-3 px-6 py-3 bg-gray-50 hover:bg-black hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all">
                                            <Type className="w-4 h-4" /> Paragraph
                                        </button>
                                        <button onClick={() => handleInsertBlock('heading')} className="flex items-center gap-3 px-6 py-3 bg-gray-50 hover:bg-black hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all">
                                            <ArrowLeft className="w-4 h-4 rotate-90" /> Heading
                                        </button>
                                        <button onClick={() => handleInsertBlock('image')} className="flex items-center gap-3 px-6 py-3 bg-gray-50 hover:bg-black hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all">
                                            <ImageIcon className="w-4 h-4" /> Image
                                        </button>
                                        <button onClick={() => handleInsertBlock('video')} className="flex items-center gap-3 px-6 py-3 bg-gray-50 hover:bg-black hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all">
                                            <Video className="w-4 h-4" /> Video
                                        </button>
                                        <button onClick={() => handleInsertBlock('quote')} className="flex items-center gap-3 px-6 py-3 bg-gray-50 hover:bg-black hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all">
                                            <History className="w-4 h-4" /> Quote
                                        </button>
                                        <button onClick={() => handleInsertBlock('callout')} className="flex items-center gap-3 px-6 py-3 bg-gray-50 hover:bg-black hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all">
                                            <AlertCircle className="w-4 h-4" /> Callout
                                        </button>
                                        <button onClick={() => handleInsertBlock('beforeAfter')} className="flex items-center gap-3 px-6 py-3 bg-gray-50 hover:bg-black hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all">
                                            <Plus className="w-4 h-4" /> Before/After
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {showGhostPreview && (
                        <div className="flex-1 bg-gray-50 flex flex-col min-h-0 animate-in slide-in-from-right-20 duration-500">
                            <div className="h-10 bg-black flex items-center justify-between px-4 shrink-0">
                                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#FAFF00]">Ghost Link Active</span>
                                <div className="flex gap-1">
                                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                </div>
                            </div>
                            <iframe
                                ref={previewIframeRef}
                                src="/admin/preview/live"
                                className="w-full flex-1 border-none bg-white"
                                title="Ghost Preview"
                            />
                        </div>
                    )}
                </div>
            </div>

            {showMeta && (
                <aside className="fixed inset-y-0 right-0 z-50 w-full md:w-[400px] border-l border-gray-100 bg-white md:bg-white flex flex-col animate-in slide-in-from-right-full duration-300 shadow-2xl">
                    <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50">
                        <h3 className="font-black uppercase tracking-widest text-xs">Story Configuration</h3>
                        <button onClick={() => setShowMeta(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="p-6 md:p-8 space-y-12 overflow-y-auto custom-scrollbar">
                        <section className="space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Editorial Protocol</h3>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => handleChange('layout', 'standard')}
                                    className={`p-4 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${story.layout === 'standard' ? 'bg-black text-white border-black shadow-lg' : 'bg-white text-gray-400 border-gray-100'}`}
                                >
                                    Standard
                                </button>
                                <button
                                    onClick={() => handleChange('layout', 'scrolly')}
                                    className={`p-4 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${story.layout === 'scrolly' ? 'bg-[#FAFF00] text-black border-[#FAFF00] shadow-lg' : 'bg-white text-gray-400 border-gray-100'}`}
                                >
                                    Explainer
                                </button>
                            </div>
                        </section>
                        <section className="space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Distribution Protocol</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Primary Category</label>
                                    <select
                                        value={story.category}
                                        onChange={(e) => handleChange('category', e.target.value)}
                                        className="w-full bg-white border border-gray-100 p-4 rounded-2xl text-xs font-bold appearance-none shadow-sm focus:border-black transition-all"
                                    >
                                        {categories.map(cat => (
                                            <option key={cat.$id} value={cat.name}>{cat.name}</option>
                                        ))}
                                        {categories.length === 0 && (
                                            <>
                                                <option value="Politics">Politics</option>
                                                <option value="Technology">Technology</option>
                                                <option value="Culture">Culture</option>
                                                <option value="Science">Science</option>
                                            </>
                                        )}
                                    </select>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-[#FAFF00] transition-all cursor-pointer" onClick={() => handleChange('isFeatured', !story.isFeatured)}>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-tight text-gray-900">Featured Article</p>
                                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Pin to Hero Position</p>
                                    </div>
                                    <div className={`w-10 h-6 rounded-full p-1 transition-colors ${story.isFeatured ? 'bg-black' : 'bg-gray-200'}`}>
                                        <div className={`w-4 h-4 rounded-full shadow-sm transform transition-transform ${story.isFeatured ? 'translate-x-4 bg-[#FAFF00]' : 'bg-white'}`} />
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Dispatch Status</h3>
                            <div className={`p-6 rounded-3xl border-2 shadow-sm flex items-center justify-between ${story.workflow_status === 'published' ? 'bg-green-50/50 border-green-100 text-green-900' :
                                story.workflow_status === 'pending_review' ? 'bg-blue-50/50 border-blue-100 text-blue-900' : 'bg-white border-gray-100'
                                }`}>
                                <div className="flex items-center gap-4">
                                    <div className={`w-3 h-3 rounded-full animate-pulse ${story.workflow_status === 'published' ? 'bg-green-500' :
                                        story.workflow_status === 'pending_review' ? 'bg-blue-500' : 'bg-gray-300'
                                        }`} />
                                    <span className="text-sm font-black uppercase tracking-tighter">{story.workflow_status}</span>
                                </div>
                                <Clock className="w-4 h-4 opacity-30" />
                            </div>
                        </section>

                        <section className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Public Preview</h3>
                                <Search className="w-4 h-4 text-gray-300" />
                            </div>
                            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xl space-y-3">
                                <p className="text-[#1a0dab] text-lg font-bold hover:underline cursor-pointer leading-tight">{story.headline || 'Your Headline Here'}</p>
                                <p className="text-[#006621] text-xs">explainer.africa › {story.category.toLowerCase()} › {story.slug || '...'}</p>
                                <p className="text-gray-500 text-xs line-clamp-2">{story.subhead || 'No subhead provided. This will default to the first paragraph in search results.'}</p>
                            </div>
                        </section>

                        <section className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Revision History</h3>
                                <History className="w-4 h-4 text-gray-300" />
                            </div>
                            <div className="space-y-3">
                                {JSON.parse(story.version_log || '[]').reverse().map((log, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-white border border-gray-50 rounded-2xl group cursor-pointer hover:border-black transition-all">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-tight text-gray-900">{log.action}</p>
                                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{log.user} • {new Date(log.timestamp).toLocaleTimeString()}</p>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-gray-100 group-hover:text-black transition-colors" />
                                    </div>
                                ))}
                                {(!story.version_log || story.version_log === '[]') && (
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center py-4 italic">No history logged yet.</p>
                                )}
                            </div>
                        </section>

                        <section className="space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Hero Distribution</h3>
                            <div className="aspect-video rounded-3xl overflow-hidden bg-gray-100 border border-gray-100 relative group">
                                {story.heroImage ? (
                                    <img src={story.heroImage} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 text-center p-8">
                                        <ImageIcon className="w-8 h-8 mb-4 opacity-20" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">No Hero Visual</p>
                                    </div>
                                )}
                                {!isLocked && (
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button onClick={() => fileInputRef.current?.click()} className="bg-[#FAFF00] text-black px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                            <Upload className="w-4 h-4" /> {story.layout === 'scrolly' ? 'Upload Video' : 'Replace Image'}
                                        </button>
                                    </div>
                                )}
                            </div>
                            {story.layout === 'scrolly' && (
                                <input
                                    className="w-full bg-white border border-gray-100 p-4 rounded-2xl text-[10px] font-bold"
                                    placeholder="External Video URL (Optional)"
                                    value={story.videoUrl}
                                    onChange={(e) => handleChange('videoUrl', e.target.value)}
                                />
                            )}
                        </section>
                    </div>

                    <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={(e) => {
                        const target = window._currentUploadTarget || 'hero';
                        handleFileUpload(e, target);
                    }} />
                </aside>
            )}
        </div>
    );
}

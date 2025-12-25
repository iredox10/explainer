import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Save, Plus, Trash2, Image as ImageIcon, Type, X, AlertCircle, Loader2, Upload, Send, CheckSquare, Eye, Clock, History, Search, ChevronRight, ExternalLink, BookOpen } from 'lucide-react';
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
    const [categories, setCategories] = useState([]);

    const fileInputRef = useRef(null);

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
            setCategories(cats);
        } catch (e) {
            console.error("Failed to fetch categories", e);
        }
    };

    const loadStory = async (currentUser) => {
        setIsLoading(true);
        if (storyId === 'new-story') {
            setStory({
                headline: "Untitled Story",
                subhead: "",
                category: "Technology",
                author: currentUser.name,
                author_id: currentUser.id,
                workflow_status: "draft",
                status: "Draft", // Legacy field mapping
                layout: "standard",
                videoUrl: "",
                isFeatured: false,
                content: JSON.stringify([{ id: 1, type: "p", text: "" }]),
                scrollySections: JSON.stringify([
                    { type: 'map', center: [20, 0], zoom: 1, highlight: '', label: 'The African Continent', text: 'The story begins here.' }
                ]),
                heroImage: ""
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
                // Acquire Lock (Optional side effect)
                setStory(data);
            }
        }
        setIsLoading(false);
    };

    if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin w-12 h-12 text-[#FAFF00]" /></div>;
    if (!user || !story) return null;

    const isWriter = user.role === ROLES.WRITER;
    const isEditor = user.role === ROLES.EDITOR || user.role === ROLES.ADMIN;

    // Rules Engine
    const canPublish = isEditor;
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

    const handleFileUpload = async (e, target) => {
        const file = e.target.files[0];
        if (!file) return;

        // Special handling for data-upload-target attributes if triggered via a button that doesn't use the 'target' param directly
        const actualTarget = e.currentTarget.dataset?.uploadTarget || target;

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
        finally { setUploadingField(null); }
    };

    const performSave = async (newStatus) => {
        setSaveStatus('saving');
        try {
            const payload = {
                ...story,
                workflow_status: newStatus,
                status: newStatus === 'published' ? 'Published' : (newStatus === 'pending_review' ? 'Pending Review' : 'Draft'),
                layout: story.layout,
                videoUrl: story.videoUrl,
                content: typeof story.content === 'string' ? story.content : JSON.stringify(story.content || []),
                scrollySections: typeof story.scrollySections === 'string' ? story.scrollySections : JSON.stringify(story.scrollySections || [])
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
                return; // Don't open if save failed
            }
        }
        window.open(`/admin/preview/${currentId}`, '_blank');
    };

    return (
        <div className="min-h-screen bg-white font-sans text-gray-900 flex">
            {/* Main Editor Zone */}
            <div className="flex-1 flex flex-col min-w-0">
                <nav className="h-20 border-b border-gray-100 flex items-center justify-between px-8 bg-white/80 backdrop-blur-md sticky top-0 z-40">
                    <div className="flex items-center gap-6">
                        <a href="/admin/stories" className="p-3 hover:bg-gray-50 rounded-2xl transition-all border border-transparent hover:border-gray-100 group">
                            <ArrowLeft className="w-5 h-5 text-gray-400 group-hover:text-black" />
                        </a>
                        <div>
                            <div className="flex items-center gap-3">
                                <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded border ${story.workflow_status === 'published' ? 'bg-green-50 text-green-700 border-green-100' :
                                    story.workflow_status === 'pending_review' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-gray-50 text-gray-500 border-gray-100'
                                    }`}>
                                    {story.workflow_status}
                                </span>
                                <h1 className="font-bold text-sm truncate max-w-[300px] tracking-tight">{story.headline}</h1>
                            </div>
                            <p className="text-[10px] text-gray-400 font-medium mt-0.5">Editing as <span className="text-black font-bold uppercase">{user.role}</span></p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {saveStatus === 'saved' && (<span className="text-xs text-green-600 font-bold flex items-center gap-1.5 animate-in fade-in slide-in-from-right-2"><CheckSquare className="w-4 h-4" /> Changes Synced</span>)}

                        <a
                            href="/admin/guide"
                            target="_blank"
                            className="p-3 hover:bg-gray-50 rounded-xl text-gray-400 hover:text-black transition-all border border-gray-100 group flex items-center gap-2"
                            title="Open Editorial Guide"
                        >
                            <BookOpen className="w-4 h-4" />
                        </a>

                        <button
                            onClick={handlePreview}
                            className="bg-gray-100 hover:bg-gray-200 text-black px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-3 transition-all"
                        >
                            <ExternalLink className="w-4 h-4" /> Live Preview
                        </button>

                        <button
                            onClick={() => performSave(story.workflow_status)}
                            disabled={saveStatus === 'saving' || !isDirty || isLocked}
                            className="px-5 py-3 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-black transition-all disabled:opacity-30"
                        >
                            Save Progress
                        </button>

                        {isWriter && story.workflow_status === 'draft' && (
                            <button onClick={() => performSave('pending_review')} className="bg-black text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-3 hover:bg-[#008751] transition-all shadow-xl">
                                <Send className="w-4 h-4" /> Submit to Editor
                            </button>
                        )}

                        {isEditor && (
                            <div className="flex items-center gap-2">
                                {story.workflow_status === 'pending_review' && (
                                    <button onClick={() => performSave('draft')} className="bg-red-50 text-red-600 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-3 border border-red-100 hover:bg-red-100 transition-all">
                                        <AlertCircle className="w-4 h-4" /> Kick Back
                                    </button>
                                )}
                                <button onClick={() => performSave('published')} className="bg-[#FAFF00] text-black px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-3 hover:bg-black hover:text-white transition-all shadow-[0_10px_20px_rgba(250,255,0,0.3)]">
                                    <CheckSquare className="w-4 h-4" /> {story.workflow_status === 'published' ? 'Update Live' : 'Go Live'}
                                </button>
                            </div>
                        )}

                        <button onClick={() => setShowMeta(!showMeta)} className={`p-3 rounded-xl transition-all border ${showMeta ? 'bg-gray-100 border-gray-200 text-black' : 'bg-white border-gray-100 text-gray-400'}`}>
                            <Eye className="w-5 h-5" />
                        </button>
                    </div>
                </nav>

                <div className="flex-1 overflow-y-auto px-8 py-12">
                    <div className="max-w-4xl mx-auto space-y-12">
                        {/* Headline Section */}
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

                        {/* Content Block System */}
                        <div className="space-y-8">
                            {content.map((block) => (
                                <div key={block.id} className="relative group min-h-[50px]">
                                    {block.type === 'beforeAfter' && (
                                        <div className="bg-gray-50 p-8 rounded-[2rem] border border-gray-100 space-y-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Visual Comparison Protocol</h4>
                                                <div className="flex gap-2">
                                                    <input
                                                        className="bg-white border border-gray-100 p-2 rounded-lg text-[9px] font-black uppercase w-20 text-center"
                                                        value={block.leftLabel}
                                                        placeholder="Left"
                                                        onChange={(e) => updateContent(content.map(b => b.id === block.id ? { ...b, leftLabel: e.target.value } : b))}
                                                    />
                                                    <input
                                                        className="bg-white border border-gray-100 p-2 rounded-lg text-[9px] font-black uppercase w-20 text-center"
                                                        value={block.rightLabel}
                                                        placeholder="Right"
                                                        onChange={(e) => updateContent(content.map(b => b.id === block.id ? { ...b, rightLabel: e.target.value } : b))}
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
                                                                window._currentUploadTarget = `${block.id}_left`;
                                                                fileInputRef.current?.click();
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
                                                                window._currentUploadTarget = `${block.id}_right`;
                                                                fileInputRef.current?.click();
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
                                                onChange={(e) => updateContent(content.map(b => b.id === block.id ? { ...b, caption: e.target.value } : b))}
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
                                                const updated = content.map(b => b.id === block.id ? { ...b, text: e.target.value } : b);
                                                updateContent(updated);
                                            }}
                                            disabled={isLocked}
                                        />
                                    )}
                                    {block.type === 'heading' && (
                                        <input
                                            className="w-full text-4xl font-black outline-none border-none placeholder:text-gray-100 tracking-tighter bg-transparent"
                                            placeholder="Section Subheading..."
                                            value={block.text}
                                            onChange={(e) => {
                                                const updated = content.map(b => b.id === block.id ? { ...b, text: e.target.value } : b);
                                                updateContent(updated);
                                            }}
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
                                                onChange={(e) => {
                                                    const updated = content.map(b => b.id === block.id ? { ...b, text: e.target.value } : b);
                                                    updateContent(updated);
                                                }}
                                                disabled={isLocked}
                                            />
                                            <input
                                                className="w-full text-xs font-black uppercase tracking-widest outline-none border-none text-gray-400 bg-transparent"
                                                placeholder="— Source Attribution"
                                                value={block.author}
                                                onChange={(e) => {
                                                    const updated = content.map(b => b.id === block.id ? { ...b, author: e.target.value } : b);
                                                    updateContent(updated);
                                                }}
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
                                                onChange={(e) => {
                                                    const updated = content.map(b => b.id === block.id ? { ...b, title: e.target.value } : b);
                                                    updateContent(updated);
                                                }}
                                                disabled={isLocked}
                                            />
                                            <textarea
                                                className="w-full text-lg font-bold outline-none resize-none border-none placeholder:text-gray-200 bg-transparent"
                                                placeholder="Factual highlight or insight..."
                                                rows="1"
                                                value={block.text}
                                                onChange={(e) => {
                                                    const updated = content.map(b => b.id === block.id ? { ...b, text: e.target.value } : b);
                                                    updateContent(updated);
                                                }}
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
                                                        <button onClick={() => updateContent(content.map(b => b.id === block.id ? { ...b, url: '' } : b))} className="absolute top-4 right-4 bg-black/50 text-white p-3 rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity">
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => !isLocked && fileInputRef.current?.click()}
                                                    className="w-full aspect-video rounded-3xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center gap-4 text-gray-300 hover:border-black hover:text-black transition-all"
                                                >
                                                    {uploadingField === block.id ? <Loader2 className="animate-spin" /> : <Upload className="w-8 h-8" />}
                                                    <span className="text-xs font-black uppercase tracking-widest">Upload Visual Content</span>
                                                </button>
                                            )}
                                        </div>
                                    )}
                                    {!isLocked && (
                                        <button onClick={() => updateContent(content.filter(b => b.id !== block.id))} className="absolute -left-12 top-0 p-2 text-gray-100 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}

                            {/* Scrolly Logic UI */}
                            {story.layout === 'scrolly' && (
                                <div className="mt-20 p-12 bg-black text-white rounded-[3rem] space-y-12">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h2 className="text-3xl font-black uppercase tracking-tighter text-[#FAFF00]">Scrollytelling Protocol</h2>
                                            <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mt-2">Sequential Visual Discovery</p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                const current = JSON.parse(story.scrollySections || '[]');
                                                handleChange('scrollySections', JSON.stringify([...current, { type: 'map', viewBox: '0 0 800 600', highlight: '', label: 'New Step', text: 'Detail explanation here.' }]));
                                            }}
                                            className="bg-[#FAFF00] text-black px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform"
                                        >
                                            Add Step
                                        </button>
                                    </div>

                                    <div className="space-y-6">
                                        {JSON.parse(story.scrollySections || '[]').map((step, idx) => (
                                            <div key={idx} className="bg-white/5 border border-white/10 p-6 rounded-2xl flex items-start gap-6 group hover:border-[#FAFF00]/50 transition-colors">
                                                <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center font-black text-[#FAFF00] shrink-0">{idx + 1}</div>
                                                <div class="grid grid-cols-2 gap-4 flex-1">
                                                    <div className="space-y-4">
                                                        <select
                                                            className="bg-black border border-white/20 text-white p-3 rounded-lg w-full text-xs font-black uppercase tracking-widest"
                                                            value={step.type}
                                                            onChange={(e) => {
                                                                const s = JSON.parse(story.scrollySections);
                                                                s[idx].type = e.target.value;
                                                                handleChange('scrollySections', JSON.stringify(s));
                                                            }}
                                                        >
                                                            <option value="map">Map Coordinate</option>
                                                            <option value="chart">Data Visualization</option>
                                                            <option value="text">Narrative Break (Full Width)</option>
                                                        </select>
                                                        {step.type === 'map' && (
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <input
                                                                    className="bg-black border border-white/20 text-white p-3 rounded-lg w-full text-xs font-mono"
                                                                    placeholder="Center (Lon, Lat)"
                                                                    value={step.center ? step.center.join(',') : ''}
                                                                    onChange={(e) => {
                                                                        const s = JSON.parse(story.scrollySections);
                                                                        s[idx].center = e.target.value.split(',').map(Number);
                                                                        handleChange('scrollySections', JSON.stringify(s));
                                                                    }}
                                                                />
                                                                <input
                                                                    className="bg-black border border-white/20 text-white p-3 rounded-lg w-full text-xs font-mono"
                                                                    placeholder="Zoom (e.g. 8)"
                                                                    value={step.zoom || ''}
                                                                    onChange={(e) => {
                                                                        const s = JSON.parse(story.scrollySections);
                                                                        s[idx].zoom = Number(e.target.value);
                                                                        handleChange('scrollySections', JSON.stringify(s));
                                                                    }}
                                                                />
                                                            </div>
                                                        )}
                                                        {step.type === 'chart' && (
                                                            <>
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    <select
                                                                        className="bg-black border border-white/20 text-white p-3 rounded-lg w-full text-xs font-black uppercase tracking-widest"
                                                                        value={step.chartType || 'line'}
                                                                        onChange={(e) => {
                                                                            const s = JSON.parse(story.scrollySections);
                                                                            s[idx].chartType = e.target.value;
                                                                            handleChange('scrollySections', JSON.stringify(s));
                                                                        }}
                                                                    >
                                                                        <option value="line">Line Graph</option>
                                                                        <option value="bar">Bar Chart</option>
                                                                        <option value="pie">Pie Chart</option>
                                                                    </select>
                                                                    <input
                                                                        className="bg-black border border-white/20 text-white p-3 rounded-lg w-full text-xs font-mono"
                                                                        placeholder="Chart Data (e.g. 10,20,35,50)"
                                                                        value={step.chartData ? step.chartData.join(',') : ''}
                                                                        onChange={(e) => {
                                                                            const s = JSON.parse(story.scrollySections);
                                                                            s[idx].chartData = e.target.value.split(',').map(Number);
                                                                            handleChange('scrollySections', JSON.stringify(s));
                                                                        }}
                                                                    />
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <div
                                                                        className="w-10 h-10 rounded-lg border border-white/20 cursor-pointer overflow-hidden shrink-0"
                                                                        style={{ backgroundColor: step.accentColor || '#FAFF00' }}
                                                                    >
                                                                        <input
                                                                            type="color"
                                                                            className="opacity-0 w-full h-full cursor-pointer"
                                                                            value={step.accentColor || '#FAFF00'}
                                                                            onChange={(e) => {
                                                                                const s = JSON.parse(story.scrollySections);
                                                                                s[idx].accentColor = e.target.value;
                                                                                handleChange('scrollySections', JSON.stringify(s));
                                                                            }}
                                                                        />
                                                                    </div>
                                                                    <input
                                                                        className="bg-black border border-white/20 text-white p-3 rounded-lg w-full text-xs font-mono"
                                                                        placeholder="#FAFF00"
                                                                        value={step.accentColor || ''}
                                                                        onChange={(e) => {
                                                                            const s = JSON.parse(story.scrollySections);
                                                                            s[idx].accentColor = e.target.value;
                                                                            handleChange('scrollySections', JSON.stringify(s));
                                                                        }}
                                                                    />
                                                                </div>

                                                                {/* Per-Segment Editor */}
                                                                <div className="space-y-3 pt-4 border-t border-white/5">
                                                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#FAFF00]">Segmentation Protocol</p>
                                                                    <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                                                        {(step.chartData || []).map((val, dIdx) => (
                                                                            <div key={dIdx} className="flex items-center gap-2 p-2 bg-white/5 rounded-lg border border-white/10 group/seg">
                                                                                <div
                                                                                    className="w-6 h-6 rounded border border-white/20 cursor-pointer overflow-hidden shrink-0"
                                                                                    style={{ backgroundColor: (step.chartColors && step.chartColors[dIdx]) || step.accentColor || '#FAFF00' }}
                                                                                >
                                                                                    <input
                                                                                        type="color"
                                                                                        className="opacity-0 w-full h-full cursor-pointer"
                                                                                        value={(step.chartColors && step.chartColors[dIdx]) || step.accentColor || '#FAFF00'}
                                                                                        onChange={(e) => {
                                                                                            const s = JSON.parse(story.scrollySections);
                                                                                            if (!s[idx].chartColors) s[idx].chartColors = [];
                                                                                            s[idx].chartColors[dIdx] = e.target.value;
                                                                                            handleChange('scrollySections', JSON.stringify(s));
                                                                                        }}
                                                                                    />
                                                                                </div>
                                                                                <input
                                                                                    className="bg-transparent border-none text-white p-1 rounded w-full text-[10px] font-bold focus:ring-0 placeholder:text-gray-600"
                                                                                    placeholder={`Point ${dIdx + 1} Label`}
                                                                                    value={(step.chartLabels && step.chartLabels[dIdx]) || ''}
                                                                                    onChange={(e) => {
                                                                                        const s = JSON.parse(story.scrollySections);
                                                                                        if (!s[idx].chartLabels) s[idx].chartLabels = [];
                                                                                        s[idx].chartLabels[dIdx] = e.target.value;
                                                                                        handleChange('scrollySections', JSON.stringify(s));
                                                                                    }}
                                                                                />
                                                                                <span className="text-[10px] font-mono text-gray-500 bg-black/50 px-2 py-1 rounded shrink-0">{val}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                    {(!step.chartData || step.chartData.length === 0) && (
                                                                        <p className="text-[10px] text-gray-500 italic">Enter comma-separated data above to start segmenting.</p>
                                                                    )}
                                                                </div>
                                                            </>
                                                        )}
                                                        {step.type !== 'text' && (
                                                            <input
                                                                className="bg-black border border-white/20 text-white p-3 rounded-lg w-full text-xs"
                                                                placeholder={step.type === 'map' ? "Highlight ID (e.g. nigeria)" : "Label/Source"}
                                                                value={step.highlight || step.label}
                                                                onChange={(e) => {
                                                                    const s = JSON.parse(story.scrollySections);
                                                                    if (step.type === 'map') s[idx].highlight = e.target.value;
                                                                    s[idx].label = e.target.value;
                                                                    handleChange('scrollySections', JSON.stringify(s));
                                                                }}
                                                            />
                                                        )}
                                                    </div>
                                                    <textarea
                                                        className="bg-black border border-white/20 text-white p-3 rounded-lg w-full text-xs h-full"
                                                        placeholder="Narrative text for this step..."
                                                        value={step.text}
                                                        onChange={(e) => {
                                                            const s = JSON.parse(story.scrollySections);
                                                            s[idx].text = e.target.value;
                                                            handleChange('scrollySections', JSON.stringify(s));
                                                        }}
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        const s = JSON.parse(story.scrollySections);
                                                        handleChange('scrollySections', JSON.stringify(s.filter((_, i) => i !== idx)));
                                                    }}
                                                    className="opacity-0 group-hover:opacity-100 p-2 text-red-500 transition-opacity"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {!isLocked && (
                                <div className="flex flex-wrap items-center gap-4 pt-12 border-t border-gray-50">
                                    <button onClick={() => updateContent([...content, { id: Date.now(), type: 'p', text: '' }])} className="flex items-center gap-3 px-6 py-3 bg-gray-50 hover:bg-black hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all">
                                        <Type className="w-4 h-4" /> Paragraph
                                    </button>
                                    <button onClick={() => updateContent([...content, { id: Date.now(), type: 'heading', text: '' }])} className="flex items-center gap-3 px-6 py-3 bg-gray-50 hover:bg-black hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all">
                                        <ArrowLeft className="w-4 h-4 rotate-90" /> Heading
                                    </button>
                                    <button onClick={() => updateContent([...content, { id: Date.now(), type: 'image', url: '' }])} className="flex items-center gap-3 px-6 py-3 bg-gray-50 hover:bg-black hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all">
                                        <ImageIcon className="w-4 h-4" /> Image
                                    </button>
                                    <button onClick={() => updateContent([...content, { id: Date.now(), type: 'quote', text: '', author: '' }])} className="flex items-center gap-3 px-6 py-3 bg-gray-50 hover:bg-black hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all">
                                        <History className="w-4 h-4" /> Quote
                                    </button>
                                    <button onClick={() => updateContent([...content, { id: Date.now(), type: 'callout', title: 'Context', text: '' }])} className="flex items-center gap-3 px-6 py-3 bg-gray-50 hover:bg-black hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all">
                                        <AlertCircle className="w-4 h-4" /> Callout
                                    </button>
                                    <button onClick={() => updateContent([...content, { id: Date.now(), type: 'beforeAfter', leftImage: '', rightImage: '', leftLabel: 'Before', rightLabel: 'After', caption: '' }])} className="flex items-center gap-3 px-6 py-3 bg-gray-50 hover:bg-black hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all">
                                        <Plus className="w-4 h-4" /> Before/After
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* newsroom OS Meta Sidebar (Step 4.B) */}
            {showMeta && (
                <aside className="w-[400px] border-l border-gray-100 bg-gray-50/30 flex flex-col animate-in slide-in-from-right-full duration-300">
                    <div className="p-8 space-y-12 overflow-y-auto">
                        {/* Live Status Container */}
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

                        {/* SEO & Distribution */}
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

                        {/* History & Logs */}
                        <section className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Revision History</h3>
                                <History className="w-4 h-4 text-gray-300" />
                            </div>
                            <div className="space-y-3">
                                {[
                                    { action: 'Created', user: story.author, time: 'Initial Version' },
                                    { action: 'Status Change', user: 'System', time: story.workflow_status }
                                ].map((log, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-white border border-gray-50 rounded-2xl group cursor-pointer hover:border-black transition-all">
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-tight text-gray-900">{log.action}</p>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{log.user}</p>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-gray-100 group-hover:text-black transition-colors" />
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Media Management */}
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

                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
                        // Check if we have a pending target override from a clicked button
                        const target = window._currentUploadTarget || 'hero';
                        handleFileUpload(e, target);
                    }} />
                </aside>
            )}
        </div>
    );
}
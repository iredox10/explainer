import { useState, useEffect } from 'react';
import { Plus, Search, Filter, MoreVertical, FileText, CheckCircle, Clock, AlertCircle, Loader2, Send, Trash2, Edit3, MoreHorizontal, ChevronDown, Archive, Check, X, User, Copy, Star, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminSidebar from './AdminSidebar';
import { getCurrentUser, ROLES } from '../../lib/authStore';
import { storyService, activityService } from '../../lib/services';

export default function StoriesPage() {
    const [user, setUser] = useState(null);
    const [stories, setStories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStories, setSelectedStories] = useState([]);
    const [showBulkActions, setShowBulkActions] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(null);
    const [bulkLoading, setBulkLoading] = useState(false);

    useEffect(() => {
        const u = getCurrentUser();
        if (!u) {
            window.location.href = '/admin/login';
        } else {
            setUser(u);
            loadStories(u);
        }
    }, []);

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            setSelectedStories([]);
            setDropdownOpen(null);
        }
    };

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    const loadStories = async (currentUser) => {
        setIsLoading(true);
        try {
            const data = await storyService.getAllStories();
            
            if (currentUser.role === ROLES.ADMIN) {
                setStories(data);
            } else if (currentUser.role === ROLES.EDITOR) {
                const assigned = currentUser.categories || [];
                if (assigned.length > 0) {
                    setStories(data.filter(s => assigned.includes(s.category)));
                } else {
                    setStories([]);
                }
            } else if (currentUser.role === ROLES.WRITER) {
                setStories(data.filter(s => s.author_id === currentUser.id));
            } else {
                setStories(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (confirm("Permanently delete this dispatch?")) {
            await storyService.deleteStory(id);
            setStories(stories.filter(s => s.$id !== id));
            await activityService?.logStoryEvent?.('story_deleted', id, user.id, user.name);
        }
    };

    const handleSelectStory = (id, e) => {
        if (e && e.shiftKey && selectedStories.length > 0) {
            const lastSelected = selectedStories[selectedStories.length - 1];
            const lastIndex = filteredStories.findIndex(s => s.$id === lastSelected);
            const currentIndex = filteredStories.findIndex(s => s.$id === id);
            
            const start = Math.min(lastIndex, currentIndex);
            const end = Math.max(lastIndex, currentIndex);
            
            const toSelect = filteredStories.slice(start, end + 1).map(s => s.$id);
            setSelectedStories([...new Set([...selectedStories, ...toSelect])]);
        } else {
            setSelectedStories(
                selectedStories.includes(id)
                    ? selectedStories.filter(sid => sid !== id)
                    : [...selectedStories, id]
            );
        }
    };

    const handleSelectAll = () => {
        if (selectedStories.length === filteredStories.length) {
            setSelectedStories([]);
        } else {
            setSelectedStories(filteredStories.map(s => s.$id));
        }
    };

    const handleBulkAction = async (action) => {
        if (selectedStories.length === 0) return;
        
        const confirmMessage = {
            delete: `Delete ${selectedStories.length} stories permanently?`,
            publish: `Publish ${selectedStories.length} stories?`,
            archive: `Archive ${selectedStories.length} stories?`,
            unpublish: `Unpublish ${selectedStories.length} stories?`
        };

        if (!confirm(confirmMessage[action])) return;

        setBulkLoading(true);
        try {
            for (const storyId of selectedStories) {
                const story = stories.find(s => s.$id === storyId);
                if (!story) continue;

                switch (action) {
                    case 'delete':
                        await storyService.deleteStory(storyId);
                        break;
                    case 'publish':
                        await storyService.saveStory(storyId, {
                            ...story,
                            status: 'Published',
                            workflow_status: 'published',
                            publishedAt: new Date().toISOString()
                        });
                        break;
                    case 'unpublish':
                        await storyService.saveStory(storyId, {
                            ...story,
                            status: 'Draft',
                            workflow_status: 'draft'
                        });
                        break;
                    case 'archive':
                        await storyService.saveStory(storyId, {
                            ...story,
                            status: 'Archived'
                        });
                        break;
                }
                
                await activityService?.logStoryEvent?.(
                    action === 'delete' ? 'story_deleted' : `story_${action}ed`,
                    storyId,
                    user.id,
                    user.name
                );
            }

            await loadStories(user);
            setSelectedStories([]);
            setShowBulkActions(false);
        } catch (e) {
            console.error('Bulk action error:', e);
        } finally {
            setBulkLoading(false);
        }
    };

    const handleStoryAction = async (storyId, action) => {
        const story = stories.find(s => s.$id === storyId);
        if (!story) return;

        setDropdownOpen(null);

        switch (action) {
            case 'delete':
                await handleDelete(storyId);
                break;
            case 'duplicate':
                const { $id, $createdAt, $updatedAt, ...storyData } = story;
                const newStory = await storyService.saveStory('new-story', {
                    ...storyData,
                    headline: `${story.headline} (Copy)`,
                    slug: `${story.slug}-copy-${Date.now()}`,
                    status: 'Draft',
                    workflow_status: 'draft'
                });
                if (newStory) {
                    window.location.href = `/admin/edit/${newStory.$id}`;
                }
                break;
            case 'publish':
                await storyService.saveStory(storyId, {
                    ...story,
                    status: 'Published',
                    workflow_status: 'published',
                    publishedAt: new Date().toISOString()
                });
                await loadStories(user);
                break;
            case 'unpublish':
                await storyService.saveStory(storyId, {
                    ...story,
                    status: 'Draft',
                    workflow_status: 'draft'
                });
                await loadStories(user);
                break;
            case 'feature':
                await storyService.saveStory(storyId, {
                    ...story,
                    featured: !story.featured
                });
                await loadStories(user);
                break;
            case 'preview':
                window.open(`/admin/preview/${storyId}`, '_blank');
                break;
        }
    };

    const filteredStories = stories.filter(story => {
        const matchesTab = activeTab === 'all' ? true :
            activeTab === 'draft' ? story.workflow_status === 'draft' :
                activeTab === 'pending' ? story.workflow_status === 'pending_review' :
                    activeTab === 'approved' ? story.workflow_status === 'approved' :
                        activeTab === 'published' ? story.workflow_status === 'published' : true;

        const matchesSearch = (story.headline || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (story.author || '').toLowerCase().includes(searchQuery.toLowerCase());

        return matchesTab && matchesSearch;
    });

    if (!user) return null;

    return (
        <div className="min-h-screen bg-transparent flex font-sans text-gray-900">
            <AdminSidebar activePage="stories" />

            <main className="lg:ml-64 flex-1 p-4 md:p-8 pt-24 lg:pt-8 bg-gray-50/50">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-black p-2 rounded-lg">
                                <FileText className="w-5 h-5 text-[#FAFF00]" />
                            </div>
                            <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Article Desk</h1>
                        </div>
                        <p className="text-gray-500 text-sm font-medium">Manage the lifecycle of visual journalism.</p>
                    </div>
                    <button
                        onClick={() => window.location.href = '/admin/edit/new-story'}
                        className="w-full md:w-auto bg-black text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-[#008751] transition-all shadow-xl"
                    >
                        <Plus className="w-5 h-5" />
                        New Dispatch
                    </button>
                </header>

                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8">
                    <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-gray-100 overflow-x-auto w-full xl:w-fit shadow-sm no-scrollbar">
                        {['all', 'draft', 'pending', 'approved', 'published'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 md:px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab ? 'bg-black text-[#FAFF00]' : 'text-gray-400 hover:bg-gray-50 hover:text-black'
                                    }`}
                            >
                                {tab === 'pending' ? 'Review' : tab === 'approved' ? 'Approved' : tab}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-4 w-full xl:w-auto">
                        <div className="relative group flex-1 xl:min-w-[400px]">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-black transition-colors" />
                            <input
                                type="text"
                                placeholder="Filter by headline or author..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white border border-gray-100 rounded-2xl py-3.5 pl-12 pr-4 text-xs font-bold uppercase tracking-tight focus:outline-none focus:border-black focus:ring-4 focus:ring-black/5 transition-all"
                            />
                        </div>
                    </div>
                </div>

                <AnimatePresence>
                    {selectedStories.length > 0 && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden mb-4"
                        >
                            <div className="bg-[#FAFF00] p-4 rounded-2xl flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={handleSelectAll}
                                        className="flex items-center gap-2 text-black text-[10px] font-black uppercase tracking-widest"
                                    >
                                        <div className={`w-5 h-5 rounded border-2 border-black flex items-center justify-center ${selectedStories.length === filteredStories.length ? 'bg-black' : ''}`}>
                                            {selectedStories.length === filteredStories.length && <Check className="w-3 h-3 text-[#FAFF00]" />}
                                        </div>
                                        {selectedStories.length} selected
                                    </button>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleBulkAction('publish')}
                                        disabled={bulkLoading}
                                        className="px-4 py-2 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-900 transition-all disabled:opacity-50"
                                    >
                                        Publish
                                    </button>
                                    <button
                                        onClick={() => handleBulkAction('archive')}
                                        disabled={bulkLoading}
                                        className="px-4 py-2 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all disabled:opacity-50"
                                    >
                                        Archive
                                    </button>
                                    <button
                                        onClick={() => handleBulkAction('delete')}
                                        disabled={bulkLoading}
                                        className="px-4 py-2 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all disabled:opacity-50"
                                    >
                                        Delete
                                    </button>
                                    <button
                                        onClick={() => setSelectedStories([])}
                                        className="p-2 text-black hover:bg-black/10 rounded-lg transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {isLoading ? (
                    <div className="flex justify-center py-20"><Loader2 className="animate-spin w-12 h-12 text-[#FAFF00]" /></div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {filteredStories.map((story) => (
                            <div key={story.$id} className="bg-white p-4 md:p-6 rounded-3xl border border-gray-100 shadow-xl hover:shadow-2xl hover:border-[#FAFF00]/30 transition-all duration-300 group flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="flex items-center gap-4 md:gap-8 flex-1 min-w-0">
                                    <div
                                        onClick={(e) => handleSelectStory(story.$id, e)}
                                        className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center cursor-pointer transition-colors ${
                                            selectedStories.includes(story.$id)
                                                ? 'bg-[#FAFF00] border-black'
                                                : 'border-gray-300 hover:border-gray-400'
                                        }`}
                                    >
                                        {selectedStories.includes(story.$id) && <Check className="w-3 h-3 text-black" />}
                                    </div>

                                    <div className="w-16 h-16 md:w-24 md:h-24 rounded-2xl overflow-hidden bg-gray-50 flex-shrink-0 relative">
                                        {story.heroImage ? (
                                            <img src={story.heroImage} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-200"><FileText className="w-6 h-6 md:w-8 md:h-8 opacity-20" /></div>
                                        )}
                                        <div className={`absolute inset-0 border-2 rounded-2xl z-10 ${story.workflow_status === 'published' ? 'border-green-500/20' :
                                            story.workflow_status === 'pending_review' ? 'border-blue-500/20' : 'border-gray-200/20'
                                            }`} />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-3 md:gap-4 mb-2">
                                            <span className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest px-2 py-0.5 md:px-2.5 md:py-1 rounded-full border flex items-center gap-1.5 md:gap-2 ${story.workflow_status === 'published' ? 'bg-green-50 text-green-700 border-green-100' :
                                                story.workflow_status === 'approved' ? 'bg-blue-600 text-white border-blue-400' :
                                                    story.workflow_status === 'pending_review' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-gray-50 text-gray-500 border-gray-100'
                                                }`}>
                                                <div className={`w-1 md:w-1.5 h-1 md:h-1.5 rounded-full ${story.workflow_status === 'published' ? 'bg-green-600' :
                                                    story.workflow_status === 'approved' ? 'bg-white' :
                                                        story.workflow_status === 'pending_review' ? 'bg-blue-600' : 'bg-gray-400'
                                                    }`} />
                                                {story.workflow_status}
                                            </span>
                                            <span className="text-[8px] md:text-[10px] text-gray-400 font-black uppercase tracking-widest truncate">{story.category}</span>
                                            {story.featured && (
                                                <Star className="w-3 h-3 text-[#FAFF00] fill-[#FAFF00]" />
                                            )}
                                        </div>
                                        <h3 className="text-base md:text-xl font-black text-gray-900 uppercase tracking-tighter truncate group-hover:text-black transition-colors">{story.headline || 'Untitled Dispatch'}</h3>
                                        <p className="text-[10px] md:text-xs text-gray-400 font-medium truncate mt-1">Author: <span className="text-gray-700 font-bold uppercase">{story.author}</span> · {new Date(story.$updatedAt).toLocaleDateString()}</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between md:justify-end gap-4 md:ml-8 border-t md:border-t-0 pt-4 md:pt-0">
                                    <div className="flex h-10 md:h-12 gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity md:translate-x-4 md:group-hover:translate-x-0">
                                        <a
                                            href={`/admin/edit/${story.$id}`}
                                            className="h-10 w-10 md:h-12 md:w-12 flex items-center justify-center rounded-xl md:rounded-2xl bg-gray-50 text-gray-400 hover:bg-black hover:text-[#FAFF00] transition-all"
                                            title="Edit Dispatch"
                                        >
                                            <Edit3 className="w-4 h-4 md:w-5 md:h-5" />
                                        </a>
                                        <button
                                            onClick={() => handleDelete(story.$id)}
                                            className="h-10 w-10 md:h-12 md:w-12 flex items-center justify-center rounded-xl md:rounded-2xl bg-gray-50 text-gray-400 hover:bg-red-500 hover:text-white transition-all"
                                            title="Purge Discovery"
                                        >
                                            <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                                        </button>
                                    </div>
                                    
                                    <div className="relative">
                                        <button
                                            onClick={() => setDropdownOpen(dropdownOpen === story.$id ? null : story.$id)}
                                            className="h-10 w-10 md:h-12 md:w-12 flex items-center justify-center rounded-xl md:rounded-2xl bg-white border border-gray-100 text-gray-300 hover:border-black transition-all"
                                        >
                                            <MoreHorizontal className="w-4 h-4 md:w-5 md:h-5" />
                                        </button>

                                        <AnimatePresence>
                                            {dropdownOpen === story.$id && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50"
                                                >
                                                    <button
                                                        onClick={() => handleStoryAction(story.$id, 'duplicate')}
                                                        className="w-full px-4 py-2 text-left text-xs font-bold flex items-center gap-2 hover:bg-gray-50 transition-colors"
                                                    >
                                                        <Copy className="w-4 h-4 text-gray-400" />
                                                        Duplicate
                                                    </button>
                                                    
                                                    {story.workflow_status === 'published' ? (
                                                        <button
                                                            onClick={() => handleStoryAction(story.$id, 'unpublish')}
                                                            className="w-full px-4 py-2 text-left text-xs font-bold flex items-center gap-2 hover:bg-gray-50 transition-colors"
                                                        >
                                                            <Archive className="w-4 h-4 text-gray-400" />
                                                            Unpublish
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleStoryAction(story.$id, 'publish')}
                                                            className="w-full px-4 py-2 text-left text-xs font-bold flex items-center gap-2 hover:bg-gray-50 transition-colors"
                                                        >
                                                            <CheckCircle className="w-4 h-4 text-gray-400" />
                                                            Publish
                                                        </button>
                                                    )}
                                                    
                                                    <button
                                                        onClick={() => handleStoryAction(story.$id, 'feature')}
                                                        className="w-full px-4 py-2 text-left text-xs font-bold flex items-center gap-2 hover:bg-gray-50 transition-colors"
                                                    >
                                                        <Star className="w-4 h-4 text-gray-400" />
                                                        {story.featured ? 'Unfeature' : 'Feature'}
                                                    </button>
                                                    
                                                    <button
                                                        onClick={() => handleStoryAction(story.$id, 'preview')}
                                                        className="w-full px-4 py-2 text-left text-xs font-bold flex items-center gap-2 hover:bg-gray-50 transition-colors"
                                                    >
                                                        <ExternalLink className="w-4 h-4 text-gray-400" />
                                                        Preview
                                                    </button>
                                                    
                                                    <hr className="my-2 border-gray-100" />
                                                    
                                                    <button
                                                        onClick={() => handleStoryAction(story.$id, 'delete')}
                                                        className="w-full px-4 py-2 text-left text-xs font-bold text-red-600 flex items-center gap-2 hover:bg-red-50 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                        Delete
                                                    </button>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {!isLoading && filteredStories.length === 0 && (
                            <div className="py-20 text-center space-y-4">
                                <div className="p-6 inline-block bg-gray-50 rounded-3xl border border-gray-100">
                                    <Search className="w-10 h-10 text-gray-200" />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-gray-900 uppercase tracking-widest">No matching dispatches</p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">The newsroom is currently quiet for this filter.</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
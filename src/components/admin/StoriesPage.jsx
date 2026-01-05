import { useState, useEffect } from 'react';
import { Plus, Search, Filter, MoreVertical, FileText, CheckCircle, Clock, AlertCircle, Loader2, Send, Trash2, Edit3, MoreHorizontal } from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import { getCurrentUser, ROLES } from '../../lib/authStore';
import { storyService } from '../../lib/services';

export default function StoriesPage() {
  const [user, setUser] = useState(null);
  const [stories, setStories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // all, draft, pending, published
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const u = getCurrentUser();
    if (!u) {
      window.location.href = '/admin/login';
    } else {
      setUser(u);
      loadStories(u);
    }
  }, []);

  const loadStories = async (currentUser) => {
    setIsLoading(true);
    try {
      const data = await storyService.getAllStories();
      
      // Step 4.A: Role-based filtering
      if (currentUser.role === ROLES.ADMIN) {
        // Admins see everything
        setStories(data);
      } else if (currentUser.role === ROLES.EDITOR) {
        // Section Editors only see their assigned categories
        const assigned = currentUser.categories || [];
        if (assigned.length > 0) {
          setStories(data.filter(s => assigned.includes(s.category)));
        } else {
          // If no categories assigned, fallback to none or everything? 
          // Safety: show none if specifically assigned to 'editor' but no sections
          setStories([]);
        }
      } else if (currentUser.role === ROLES.WRITER) {
        // Writers only see their own work
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

        {/* Workflow Tabs & Search (Step 3) */}
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

          <div className="relative group w-full xl:min-w-[400px]">
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

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin w-12 h-12 text-[#FAFF00]" /></div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredStories.map((story) => (
              <div key={story.$id} className="bg-white p-4 md:p-6 rounded-3xl border border-gray-100 shadow-xl hover:shadow-2xl hover:border-[#FAFF00]/30 transition-all duration-300 group flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4 md:gap-8 flex-1 min-w-0">
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
                    </div>
                    <h3 className="text-base md:text-xl font-black text-gray-900 uppercase tracking-tighter truncate group-hover:text-black transition-colors">{story.headline || 'Untitled Dispatch'}</h3>
                    <p className="text-[10px] md:text-xs text-gray-400 font-medium truncate mt-1">Author: <span className="text-gray-700 font-bold uppercase">{story.author}</span> • {new Date(story.$updatedAt).toLocaleDateString()}</p>
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
                  <button className="h-10 w-10 md:h-12 md:w-12 flex items-center justify-center rounded-xl md:rounded-2xl bg-white border border-gray-100 text-gray-300">
                    <MoreHorizontal className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
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
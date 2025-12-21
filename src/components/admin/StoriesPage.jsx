import React, { useState, useEffect } from 'react';
import { Plus, Search, MoreVertical, Trash2, Edit2, CheckCircle, ShieldAlert, Loader2 } from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import { getCurrentUser, ROLES } from '../../lib/authStore';
import { storyService } from '../../lib/services';

export default function StoriesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [stories, setStories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    const u = getCurrentUser();
    if (u) {
        setUser(u);
        loadStories();
    }
  }, []);

  const loadStories = async () => {
    setIsLoading(true);
    const data = await storyService.getAllStories();
    setStories(data);
    setIsLoading(false);
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this story?")) {
      const success = await storyService.deleteStory(id);
      if (success) setStories(prev => prev.filter(s => s.$id !== id));
    }
  };

  if (!user) return null;

  const isContributor = user.role === ROLES.CONTRIBUTOR;
  const isEditor = user.role === ROLES.EDITOR;
  const isAdmin = user.role === ROLES.ADMIN;

  const filteredStories = stories.filter(story => {
    const matchesSearch = story.headline.toLowerCase().includes(searchTerm.toLowerCase());
    if (isContributor) return matchesSearch && story.author === user.name;
    if (isEditor) {
        if (activeTab === 'my_stories') return matchesSearch && story.author === user.name;
        return matchesSearch && (user.categories || []).includes(story.category);
    }
    return matchesSearch;
  });

  const getStatusColor = (status) => {
      switch(status) {
          case 'Published': return 'bg-green-50 text-[#008751] border-green-100';
          case 'Pending Review': return 'bg-orange-50 text-orange-700 border-orange-100';
          case 'Draft': return 'bg-gray-100 text-gray-500 border-gray-200';
          default: return 'bg-gray-100 text-gray-500';
      }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
      <AdminSidebar activePage="stories" />

      <main className="ml-64 flex-1 p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Stories</h1>
            <p className="text-gray-500 text-sm mt-1">{isContributor ? "Your submissions" : "Editorial content"}</p>
          </div>
          <a href="/admin/edit/new-story" className="bg-black text-white px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors hover:bg-[#008751]">
            <Plus className="w-4 h-4" /> New Story
          </a>
        </header>

        {!isContributor && (
            <div className="flex gap-6 border-b border-gray-200 mb-6">
                <button onClick={() => setActiveTab('all')} className={`pb-3 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'all' ? 'border-b-2 border-[#008751] text-[#008751]' : 'text-gray-400 hover:text-gray-600'}`}>All Content</button>
                <button onClick={() => setActiveTab('my_stories')} className={`pb-3 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'my_stories' ? 'border-b-2 border-[#008751] text-[#008751]' : 'text-gray-400 hover:text-gray-600'}`}>My Articles</button>
            </div>
        )}

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-8">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Filter by title..." className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:bg-white transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-[10px] uppercase tracking-[0.2em] text-gray-400 font-black">
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4">Author</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                  <tr><td colSpan="5" className="px-6 py-12 text-center"><Loader2 className="animate-spin w-8 h-8 text-gray-200 mx-auto" /></td></tr>
              ) : filteredStories.length > 0 ? (
                  filteredStories.map((story) => (
                    <tr key={story.$id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <a href={`/admin/edit/${story.$id}`} className="block">
                          <div className="font-bold text-gray-900 group-hover:text-[#008751] transition-colors line-clamp-1">{story.headline}</div>
                          <div className="text-[10px] text-gray-400 mt-1 uppercase font-bold">Edited {new Date(story.$updatedAt).toLocaleDateString()}</div>
                        </a>
                      </td>
                      <td className="px-6 py-4"><span className="text-sm font-bold text-gray-600">{story.author}</span></td>
                      <td className="px-6 py-4"><span className="px-2 py-0.5 rounded-sm text-[10px] font-black uppercase tracking-widest bg-gray-100 text-gray-500 border border-gray-200">{story.category}</span></td>
                      <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest border ${getStatusColor(story.status)}`}>{story.status}</span></td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                            <a href={`/admin/edit/${story.$id}`} className="p-2 text-gray-400 hover:text-black hover:bg-white rounded border border-transparent hover:border-gray-200 transition-all"><Edit2 className="w-4 h-4" /></a>
                            {(isAdmin || (story.author === user.name && story.status === 'Draft')) && (
                                <button onClick={() => handleDelete(story.$id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-white rounded border border-transparent hover:border-gray-200 transition-all"><Trash2 className="w-4 h-4" /></button>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))
              ) : (
                  <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-400 text-sm font-medium">No stories found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
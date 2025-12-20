import React, { useState } from 'react';
import { Plus, Search, MoreVertical, Trash2, Edit2, CheckCircle, ShieldAlert } from 'lucide-react';
import AdminSidebar from './AdminSidebar';

const INITIAL_STORIES = [
  {
    id: "giant-wakes",
    headline: "The Giant Wakes: How Nigeria is Reshaping the Global Economy",
    author: "Chioma Okafor",
    status: "Published",
    date: "Nov 29, 2025",
    category: "Super Feature"
  },
  {
    id: "fiber-optic",
    headline: "The hidden fiber optic cables connecting Lagos to the world",
    author: "Chioma Okereke",
    status: "Published",
    date: "Nov 29, 2025",
    category: "Technology"
  },
  {
    id: "draft-1",
    headline: "Untitled Draft: The Future of Nollywood",
    author: "Admin",
    status: "Draft",
    date: "Just now",
    category: "Culture"
  }
];

// Mock User Roles for Simulation
const USER_ROLES = [
    { id: 1, name: "Super Admin", role: "Super Admin", categories: [] }, // Access All
    { id: 2, name: "Tech Editor", role: "Editor", categories: ["Technology", "Super Feature"] }, // Access Only Tech + Super Feature
    { id: 3, name: "Culture Contributor", role: "Contributor", categories: ["Culture"] }, // Access Only Culture
];

export default function StoriesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [stories, setStories] = useState(INITIAL_STORIES);
  const [currentUser, setCurrentUser] = useState(USER_ROLES[0]); // Default to Super Admin

  const handleDelete = (id) => {
    if (confirm("Are you sure you want to delete this story?")) {
      setStories(prev => prev.filter(s => s.id !== id));
    }
  };

  // Permission Logic
  const canAccessStory = (story) => {
    if (currentUser.role === 'Super Admin') return true;
    return currentUser.categories.includes(story.category);
  };

  const filteredStories = stories.filter(story => {
    const matchesSearch = story.headline.toLowerCase().includes(searchTerm.toLowerCase());
    const hasPermission = canAccessStory(story);
    return matchesSearch && hasPermission;
  });

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
      <AdminSidebar activePage="stories" />

      <main className="ml-64 flex-1 p-8">
        
        {/* Role Simulator (For Demo Purposes) */}
        <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
                <ShieldAlert className="w-5 h-5 text-yellow-600" />
                <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-yellow-700 block">Simulate Role</span>
                    <span className="text-sm font-medium text-gray-700">Viewing as: <strong>{currentUser.name}</strong> ({currentUser.role})</span>
                </div>
            </div>
            <select 
                className="bg-white border border-yellow-300 text-sm rounded px-3 py-1 outline-none"
                value={currentUser.id}
                onChange={(e) => setCurrentUser(USER_ROLES.find(u => u.id === Number(e.target.value)))}
            >
                {USER_ROLES.map(role => (
                    <option key={role.id} value={role.id}>{role.name} ({role.role})</option>
                ))}
            </select>
        </div>

        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Stories</h1>
            <p className="text-gray-500 text-sm mt-1">Manage your explainer articles</p>
          </div>
          <a href="/admin/edit/new-story" className="bg-[#121212] hover:bg-[#008751] text-white px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-sm">
            <Plus className="w-4 h-4" />
            New Story
          </a>
        </header>

        {/* Filters */}
        <div className="bg-white p-4 rounded-t-xl border border-gray-200 border-b-0 flex justify-between items-center">
          <div className="relative w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search stories..." 
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#008751] focus:bg-white transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:border-[#008751]">
              <option>All Categories</option>
              <option>Technology</option>
              <option>Culture</option>
            </select>
            <select className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:border-[#008751]">
              <option>Newest First</option>
              <option>Oldest First</option>
            </select>
          </div>
        </div>

        {/* List */}
        <div className="bg-white border border-gray-200 rounded-b-xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-bold">
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4">Author</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStories.length > 0 ? (
                  filteredStories.map((story) => (
                    <tr key={story.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-4">
                        <a href={`/admin/edit/${story.id}`} className="block">
                          <div className="font-bold text-gray-900 group-hover:text-[#008751] transition-colors">{story.headline}</div>
                          <div className="text-xs text-gray-400 mt-1">Last edited {story.date}</div>
                        </a>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden">
                             <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${story.author}`} alt="avatar" />
                          </div>
                          <span className="text-sm font-medium text-gray-700">{story.author}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">
                          {story.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center w-fit gap-1.5 ${
                          story.status === 'Published' 
                            ? 'bg-green-50 text-[#008751] border border-green-100' 
                            : 'bg-yellow-50 text-yellow-700 border border-yellow-100'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${story.status === 'Published' ? 'bg-[#008751]' : 'bg-yellow-500'}`}></span>
                          {story.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                            <a href={`/admin/edit/${story.id}`} className="p-2 text-gray-400 hover:text-[#008751] hover:bg-gray-100 rounded-lg transition-colors">
                                <Edit2 className="w-4 h-4" />
                            </a>
                            <button onClick={() => handleDelete(story.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                      </td>
                    </tr>
                  ))
              ) : (
                  <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                          <p className="font-medium">No stories found.</p>
                          <p className="text-sm mt-1">Either none match your search, or you don't have permission to view them.</p>
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>

      </main>
    </div>
  );
}

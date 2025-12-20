import React, { useState, useEffect } from 'react';
import { Plus, MoreVertical, Mail, X, Check, Edit2, Trash2 } from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import { getCurrentUser, ROLES } from '../../lib/authStore';

export default function AuthorsPage() {
  const [user, setUser] = useState(null);
  const [authors, setAuthors] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState(null);

  useEffect(() => {
    const u = getCurrentUser();
    if (!u) {
      window.location.href = '/admin/login';
    } else {
      setUser(u);
      setAuthors([
        { id: 1, name: "Chioma Okafor", role: "Senior Economics Reporter", email: "chioma@vox.africa" },
        { id: 2, name: "Chioma Okereke", role: "Senior Tech Correspondent", email: "c.okereke@vox.africa" },
        { id: 3, name: "Tunde Alabi", role: "Network Architect", email: "guest@vox.africa" },
      ]);
    }
  }, []);

  const openAddModal = () => {
    setEditingAuthor({ name: "", role: "", email: "" });
    setIsModalOpen(true);
  };
  
  const openEditModal = (author) => {
    setEditingAuthor(author);
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (confirm("Are you sure?")) {
      setAuthors(prev => prev.filter(a => a.id !== id));
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (editingAuthor.id) {
      setAuthors(prev => prev.map(a => a.id === editingAuthor.id ? editingAuthor : a));
    } else {
      setAuthors([...authors, { id: Date.now(), ...editingAuthor }]);
    }
    setIsModalOpen(false);
    setEditingAuthor(null);
  };
  
  const handleModalChange = (field, value) => {
    setEditingAuthor(prev => ({...prev, [field]: value}));
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
      <AdminSidebar activePage="authors" />

      <main className="ml-64 flex-1 p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Authors</h1>
            <p className="text-gray-500 text-sm mt-1">Manage team and contributors</p>
          </div>
          <button onClick={openAddModal} className="bg-[#121212] hover:bg-[#008751] text-white px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm">
            <Plus className="w-4 h-4" /> Add Author
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {authors.map((author) => (
            <div key={author.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:border-[#008751] transition-colors group">
              <div className="flex justify-between items-start mb-4">
                <div className="w-16 h-16 rounded-full bg-gray-100 overflow-hidden border-2 border-white shadow-sm">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${author.name}`} alt={author.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex gap-1">
                   <button onClick={() => openEditModal(author)} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"><Edit2 className="w-4 h-4" /></button>
                   <button onClick={() => handleDelete(author.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <h3 className="font-bold text-lg text-gray-900 group-hover:text-[#008751] transition-colors">{author.name}</h3>
              <p className="text-sm text-[#008751] font-medium mb-4">{author.role || "Contributor"}</p>
              <div className="flex items-center gap-2 text-sm text-gray-500 border-t border-gray-100 pt-4"><Mail className="w-4 h-4" />{author.email}</div>
            </div>
          ))}
        </div>

        {isModalOpen && editingAuthor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="font-bold text-lg text-gray-900">{editingAuthor.id ? 'Edit Author' : 'Add New Author'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div><label className="block text-xs font-bold text-gray-500 mb-1">Full Name</label><input type="text" className="w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm" value={editingAuthor.name} onChange={e => handleModalChange('name', e.target.value)} required /></div>
                <div><label className="block text-xs font-bold text-gray-500 mb-1">Role / Title</label><input type="text" className="w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm" value={editingAuthor.role} onChange={e => handleModalChange('role', e.target.value)} /></div>
                <div><label className="block text-xs font-bold text-gray-500 mb-1">Email Address</label><input type="email" className="w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm" value={editingAuthor.email} onChange={e => handleModalChange('email', e.target.value)} required /></div>
                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors">Cancel</button>
                  <button type="submit" className="bg-[#008751] text-white px-6 py-2 rounded-lg text-sm font-bold shadow-sm flex items-center gap-2"><Check className="w-4 h-4" />{editingAuthor.id ? 'Save Changes' : 'Create Profile'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
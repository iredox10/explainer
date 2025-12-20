import React, { useState, useEffect } from 'react';
import { Plus, Search, MoreVertical, Tag, Edit2, Trash2, X, Check } from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import { getCurrentUser, ROLES } from '../../lib/authStore';

export default function CategoriesPage() {
  const [user, setUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  useEffect(() => {
    const u = getCurrentUser();
    if (!u) {
      window.location.href = '/admin/login';
    } else if (u.role === ROLES.CONTRIBUTOR) {
      window.location.href = '/admin';
    } else {
      setUser(u);
      setCategories([
        { id: 1, name: "Technology", slug: "technology", color: "#3b82f6", count: 45 },
        { id: 2, name: "Culture", slug: "culture", color: "#ec4899", count: 32 },
        { id: 3, name: "Politics", slug: "politics", color: "#ef4444", count: 28 },
        { id: 4, name: "Science", slug: "science", color: "#22c55e", count: 19 },
        { id: 5, name: "Economy", slug: "economy", color: "#eab308", count: 56 },
      ]);
    }
  }, []);

  const openAddModal = () => {
    setEditingCategory({ name: "", slug: "", color: "#000000" });
    setIsModalOpen(true);
  };
  
  const openEditModal = (category) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (confirm("Are you sure?")) {
      setCategories(prev => prev.filter(c => c.id !== id));
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (editingCategory.id) {
      setCategories(prev => prev.map(c => c.id === editingCategory.id ? editingCategory : c));
    } else {
      setCategories([...categories, { id: Date.now(), ...editingCategory, count: 0 }]);
    }
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const handleModalChange = (field, value) => {
    setEditingCategory(prev => ({...prev, [field]: value}));
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
      <AdminSidebar activePage="categories" />

      <main className="ml-64 flex-1 p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Categories</h1>
            <p className="text-gray-500 text-sm mt-1">Manage content topics and tags</p>
          </div>
          <button 
            onClick={openAddModal}
            className="bg-[#121212] hover:bg-[#008751] text-white px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Category
          </button>
        </header>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-bold">
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Slug</th>
                <th className="px-6 py-4">Color</th>
                <th className="px-6 py-4">Stories</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4"><span className="font-bold text-gray-900">{cat.name}</span></td>
                  <td className="px-6 py-4"><code className="text-xs bg-gray-100 px-2 py-1 rounded border border-gray-200 text-gray-600">{cat.slug}</code></td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full border border-gray-200 shadow-sm" style={{ backgroundColor: cat.color }}></div>
                      <span className="text-xs text-gray-400 font-mono uppercase">{cat.color}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4"><span className="text-sm font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-full">{cat.count}</span></td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                        <button onClick={() => openEditModal(cat)} className="p-2 text-gray-400 hover:text-[#008751] hover:bg-gray-100 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(cat.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {isModalOpen && editingCategory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="font-bold text-lg text-gray-900">{editingCategory.id ? 'Edit Category' : 'Add New Category'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div><label className="block text-xs font-bold text-gray-500 mb-1">Category Name</label><input type="text" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#008751]" value={editingCategory.name} onChange={e => handleModalChange('name', e.target.value)} required /></div>
                <div><label className="block text-xs font-bold text-gray-500 mb-1">Slug</label><input type="text" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#008751]" value={editingCategory.slug} onChange={e => handleModalChange('slug', e.target.value)} required /></div>
                <div><label className="block text-xs font-bold text-gray-500 mb-1">Accent Color</label><div className="flex items-center gap-2"><input type="color" className="w-10 h-10 rounded border-0 cursor-pointer" value={editingCategory.color} onChange={e => handleModalChange('color', e.target.value)} /><span className="text-sm font-mono text-gray-600">{editingCategory.color}</span></div></div>
                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors">Cancel</button>
                  <button type="submit" className="bg-[#008751] text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-[#006b3f] transition-colors shadow-sm flex items-center gap-2"><Check className="w-4 h-4" />{editingCategory.id ? 'Save Changes' : 'Create Category'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

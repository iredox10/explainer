import { useState, useEffect, useRef } from 'react';
import { Plus, MoreVertical, Mail, X, Check, Edit2, Trash2, Loader2, Camera, Upload } from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import { getCurrentUser, ROLES } from '../../lib/authStore';
import { authorService, storyService } from '../../lib/services';

export default function AuthorsPage() {
  const [user, setUser] = useState(null);
  const [authors, setAuthors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const u = getCurrentUser();
    if (!u) {
      window.location.href = '/admin/login';
    } else {
      setUser(u);
      loadAuthors();
    }
  }, []);

  const loadAuthors = async () => {
    setIsLoading(true);
    const data = await authorService.getAuthors();
    setAuthors(data);
    setIsLoading(false);
  };

  const openAddModal = () => {
    setEditingAuthor({ name: "", role: "", email: "", bio: "", imageUrl: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (author) => {
    setEditingAuthor(author);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure?")) {
      const success = await authorService.deleteAuthor(id);
      if (success) setAuthors(prev => prev.filter(a => a.$id !== id));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const id = editingAuthor.$id;
      const { $id, $createdAt, $updatedAt, $permissions, $databaseId, $collectionId, ...dataToSave } = editingAuthor;
      const result = await authorService.saveAuthor(id, dataToSave);

      if (id) {
        setAuthors(prev => prev.map(a => a.$id === id ? result : a));
      } else {
        setAuthors([...authors, result]);
      }
      setIsModalOpen(false);
      setEditingAuthor(null);
    } catch (error) {
      alert("Error saving author: " + error.message);
    }
  };

  const handleModalChange = (field, value) => {
    setEditingAuthor(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await storyService.uploadImage(file);
      handleModalChange('imageUrl', url);
    } catch (error) {
      alert("Upload failed: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
      <AdminSidebar activePage="authors" />

      <main className="lg:ml-64 flex-1 p-4 md:p-8 pt-24 lg:pt-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div>
            <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Authors</h1>
            <p className="text-gray-500 text-sm mt-1 font-medium">Manage team and contributors</p>
          </div>
          <button onClick={openAddModal} className="w-full md:w-auto bg-[#121212] hover:bg-[#008751] text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl transition-all">
            <Plus className="w-4 h-4" /> Add Author
          </button>
        </header>

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin w-10 h-10 text-gray-200" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {authors.map((author) => (
              <div key={author.$id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:border-[#008751] transition-colors group">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-16 h-16 rounded-full bg-gray-100 overflow-hidden border-2 border-white shadow-sm flex items-center justify-center">
                    {author.imageUrl ? (
                      <img src={author.imageUrl} alt={author.name} className="w-full h-full object-cover" />
                    ) : (
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${author.name}`} alt={author.name} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEditModal(author)} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(author.$id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <h3 className="font-bold text-lg text-gray-900 group-hover:text-[#008751] transition-colors">{author.name}</h3>
                <p className="text-sm text-[#008751] font-medium mb-4">{author.role || "Contributor"}</p>
                <div className="flex items-center gap-2 text-sm text-gray-500 border-t border-gray-100 pt-4"><Mail className="w-4 h-4" />{author.email}</div>
              </div>
            ))}
          </div>
        )}

        {isModalOpen && editingAuthor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="font-bold text-lg text-gray-900">{editingAuthor.$id ? 'Edit Author' : 'Add New Author'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div className="flex flex-col items-center mb-6">
                  <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <div className="w-24 h-24 rounded-full bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden">
                      {uploading ? (
                        <Loader2 className="animate-spin text-[#008751]" />
                      ) : editingAuthor.imageUrl ? (
                        <img src={editingAuthor.imageUrl} className="w-full h-full object-cover" />
                      ) : (
                        <Camera className="w-8 h-8 text-gray-300" />
                      )}
                    </div>
                    <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Upload className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-2">Author Headshot</p>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </div>

                <div><label className="block text-xs font-bold text-gray-500 mb-1">Full Name</label><input type="text" className="w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm" value={editingAuthor.name} onChange={e => handleModalChange('name', e.target.value)} required /></div>
                <div><label className="block text-xs font-bold text-gray-500 mb-1">Role / Title</label><input type="text" className="w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm" value={editingAuthor.role} onChange={e => handleModalChange('role', e.target.value)} /></div>
                <div><label className="block text-xs font-bold text-gray-500 mb-1">Email Address</label><input type="email" className="w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm" value={editingAuthor.email} onChange={e => handleModalChange('email', e.target.value)} required /></div>
                <div><label className="block text-xs font-bold text-gray-500 mb-1">Bio</label><textarea className="w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm h-24" value={editingAuthor.bio} onChange={e => handleModalChange('bio', e.target.value)} /></div>
                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors">Cancel</button>
                  <button type="submit" disabled={uploading} className="bg-[#008751] text-white px-6 py-2 rounded-lg text-sm font-bold shadow-sm flex items-center gap-2"><Check className="w-4 h-4" />{editingAuthor.$id ? 'Save Changes' : 'Create Profile'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Save, Plus, Trash2, Image as ImageIcon, Type, Quote, MessageSquare, Move, Map, BarChart, Video, CheckCircle, Send, CheckSquare, AlertCircle, Loader2, Upload } from 'lucide-react';
import { getCurrentUser, ROLES } from '../../lib/authStore';
import { storyService } from '../../lib/services';

export default function StoryEditor({ storyId }) {
  const [user, setUser] = useState(null);
  const [story, setStory] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle');
  const [uploadingField, setUploadingField] = useState(null); // 'hero' or block id

  const fileInputRef = useRef(null);

  useEffect(() => {
    const u = getCurrentUser();
    if (!u) {
      window.location.href = '/admin/login';
      return;
    }
    setUser(u);
    loadStory(u);
  }, [storyId]);

  const loadStory = async (currentUser) => {
    setIsLoading(true);
    if (storyId === 'new-story') {
        setStory({
            headline: "Untitled Story",
            subhead: "",
            category: "Technology",
            author: currentUser.name,
            status: "Draft",
            layout: "standard",
            content: JSON.stringify([{ id: 1, type: "p", text: "" }]),
            scrollySections: JSON.stringify([]),
            heroImage: ""
        });
    } else {
        const data = await storyService.getStoryById(storyId);
        if (data) setStory(data);
    }
    setIsLoading(false);
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin w-12 h-12 text-[#008751]" /></div>;
  if (!user || !story) return null;

  const isContributor = user.role === ROLES.CONTRIBUTOR;
  const isEditor = user.role === ROLES.EDITOR;
  const isAdmin = user.role === ROLES.ADMIN;
  const canPublish = isAdmin || (isEditor && ((user.categories || []).includes(story.category) || story.author === user.name));
  const isLocked = isContributor && story.status === 'Published'; 

  const content = typeof story.content === 'string' ? JSON.parse(story.content) : (story.content || []);
  
  const handleChange = (field, value) => { setStory(prev => ({ ...prev, [field]: value })); setIsDirty(true); setSaveStatus('idle'); };
  const updateContent = (newContent) => { handleChange('content', JSON.stringify(newContent)); };

  const handleFileUpload = async (e, target) => {
      const file = e.target.files[0];
      if (!file) return;

      setUploadingField(target);
      try {
          const url = await storyService.uploadImage(file);
          if (target === 'hero') {
              handleChange('heroImage', url);
          } else {
              const updated = content.map(b => b.id === target ? { ...b, url } : b);
              updateContent(updated);
          }
      } catch (err) {
          alert("Upload failed: " + err.message);
      } finally {
          setUploadingField(null);
      }
  };

  const addBlock = (type) => {
      const newBlock = { id: Date.now(), type, text: "", ...(type === 'image' && { url: "", caption: "" }) };
      updateContent([...content, newBlock]);
  };

  const removeBlock = (id) => {
      updateContent(content.filter(b => b.id !== id));
  };

  const handleContentChange = (id, field, value) => {
      updateContent(content.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const performSave = async (newStatus) => {
    setSaveStatus('saving');
    try {
        const payload = { 
            ...story, 
            status: newStatus,
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
    } catch (e) {
        setSaveStatus('idle');
        alert("Save failed: " + e.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-20">
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 shadow-sm">
        <div className="flex items-center gap-4">
          <a href="/admin/stories" className="p-2 hover:bg-gray-100 rounded-full text-gray-500"><ArrowLeft className="w-5 h-5" /></a>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded border ${
                story.status === 'Published' ? 'bg-green-50 text-green-700 border-green-100' : 
                story.status === 'Pending Review' ? 'bg-orange-50 text-orange-700 border-orange-100' : 'bg-gray-100 text-gray-500 border-gray-200'
            }`}>{story.status}</span>
            <span className="font-bold text-sm truncate max-w-[200px]">{story.headline}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {saveStatus === 'saved' && (<span className="text-xs text-green-600 font-bold flex items-center gap-1.5"><CheckCircle className="w-4 h-4" />Saved</span>)}
          <button onClick={() => performSave(story.status)} disabled={saveStatus === 'saving' || !isDirty} className="text-gray-500 hover:text-black px-4 py-2 text-sm font-bold">Save Draft</button>
          {isContributor && story.status === 'Draft' && (
              <button onClick={() => performSave('Pending Review')} className="bg-black text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-[#008751] transition-colors"><Send className="w-4 h-4" /> Submit for Review</button>
          )}
          {canPublish && (
              <>
                {story.status === 'Pending Review' && (<button onClick={() => performSave('Draft')} className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-red-100 border border-red-200"><AlertCircle className="w-4 h-4" /> Reject</button>)}
                <button onClick={() => performSave('Published')} className="bg-[#008751] text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-black transition-all"><CheckSquare className="w-4 h-4" /> {story.status === 'Published' ? 'Update Live' : 'Publish Story'}</button>
              </>
          )}
        </div>
      </nav>

      <div className="max-w-6xl mx-auto mt-8 grid grid-cols-12 gap-8 px-6">
        <div className="col-span-8 space-y-6">
            <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm space-y-6">
                <div><label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Headline</label><textarea className="w-full text-3xl font-black leading-tight outline-none resize-none border-b border-transparent focus:border-yellow-400" rows="2" value={story.headline} onChange={(e) => handleChange('headline', e.target.value)} /></div>
                <div><label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Subhead</label><textarea className="w-full text-xl font-serif text-gray-600 leading-relaxed outline-none resize-none border-b border-transparent focus:border-yellow-400" rows="2" value={story.subhead} onChange={(e) => handleChange('subhead', e.target.value)} /></div>
            </div>
            
            <div className="space-y-4">
                {content.map((block) => (
                    <div key={block.id} className="bg-white p-6 rounded-xl border border-gray-200 relative group transition-all hover:border-gray-300">
                        <button onClick={() => removeBlock(block.id)} className="absolute top-2 right-2 p-2 text-gray-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button>
                        
                        {block.type === 'p' && <textarea className="w-full text-lg font-serif outline-none resize-none leading-relaxed" rows="3" value={block.text} onChange={(e) => handleContentChange(block.id, 'text', e.target.value)} />}
                        
                        {block.type === 'image' && (
                            <div className="space-y-4">
                                {block.url ? (
                                    <div className="relative aspect-video rounded-lg overflow-hidden border border-gray-100">
                                        <img src={block.url} className="w-full h-full object-cover" />
                                        <button onClick={() => handleContentChange(block.id, 'url', '')} className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full hover:bg-red-500 transition-colors"><X className="w-4 h-4" /></button>
                                    </div>
                                ) : (
                                    <div className="aspect-video bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center relative">
                                        {uploadingField === block.id ? <Loader2 className="animate-spin text-gray-400" /> : (
                                            <>
                                                <Upload className="w-8 h-8 text-gray-300 mb-2" />
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Upload Content Image</p>
                                                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(e, block.id)} />
                                            </>
                                        )}
                                    </div>
                                )}
                                <input type="text" placeholder="Caption..." className="w-full text-sm font-medium text-gray-500 outline-none border-b border-transparent focus:border-gray-200 pb-1" value={block.caption || ""} onChange={(e) => handleContentChange(block.id, 'caption', e.target.value)} />
                            </div>
                        )}
                    </div>
                ))}
                
                <div className="flex justify-center gap-3 py-8 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                    <button onClick={() => addBlock('p')} className="flex items-center gap-2 px-6 py-2 bg-white border border-gray-200 rounded-full text-xs font-black uppercase tracking-widest text-gray-500 hover:text-black hover:border-black transition-all shadow-sm"><Type className="w-4 h-4" /> Add Text</button>
                    <button onClick={() => addBlock('image')} className="flex items-center gap-2 px-6 py-2 bg-white border border-gray-200 rounded-full text-xs font-black uppercase tracking-widest text-gray-500 hover:text-black hover:border-black transition-all shadow-sm"><ImageIcon className="w-4 h-4" /> Add Image</button>
                </div>
            </div>
        </div>

        <div className="col-span-4 space-y-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm sticky top-24">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6 pb-2 border-b border-gray-50">Story Meta</h3>
                <div className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Author</label>
                        <div className="font-bold text-sm bg-gray-50 px-3 py-2 rounded border border-gray-100 text-gray-600">{story.author}</div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Category</label>
                        <select className="w-full px-3 py-2 bg-white border border-gray-200 text-sm font-bold rounded-lg outline-none focus:ring-2 focus:ring-yellow-400" value={story.category} onChange={(e) => handleChange('category', e.target.value)}>
                            <option>Technology</option>
                            <option>Culture</option>
                            <option>Politics</option>
                            <option>Economy</option>
                        </select>
                    </div>
                    {canPublish && (
                        <div className="pt-2">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className="relative inline-block w-10 h-5 transition duration-200 ease-in-out">
                                    <input 
                                        type="checkbox" 
                                        className="opacity-0 w-0 h-0 peer" 
                                        checked={story.isFeatured || false}
                                        onChange={(e) => handleChange('isFeatured', e.target.checked)}
                                    />
                                    <span className="absolute inset-0 rounded-full bg-gray-200 peer-checked:bg-[#008751] transition-colors"></span>
                                    <span className="absolute left-1 top-1 w-3 h-3 rounded-full bg-white transition-transform peer-checked:translate-x-5"></span>
                                </div>
                                <span className="text-xs font-black uppercase tracking-widest text-gray-500 group-hover:text-black transition-colors">Feature on Homepage</span>
                            </label>
                        </div>
                    )}
                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-3">Hero Image</label>
                        <div className="aspect-video w-full rounded-lg bg-gray-50 border-2 border-dashed border-gray-200 overflow-hidden relative group">
                            {story.heroImage ? (
                                <>
                                    <img src={story.heroImage} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button className="bg-white text-black p-2 rounded-full shadow-lg" onClick={() => fileInputRef.current?.click()}><Upload className="w-4 h-4" /></button>
                                    </div>
                                </>
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                    {uploadingField === 'hero' ? <Loader2 className="animate-spin text-[#008751]" /> : (
                                        <>
                                            <Upload className="w-6 h-6 text-gray-300 mb-2" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Click to Upload Hero</span>
                                        </>
                                    )}
                                </div>
                            )}
                            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'hero')} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
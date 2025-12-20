import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Plus, Trash2, Image as ImageIcon, Type, Quote, MessageSquare, Move, Map, BarChart, Video, CheckCircle, Send, CheckSquare, AlertCircle } from 'lucide-react';
import { getCurrentUser, ROLES } from '../../lib/authStore';

const MOCK_DATA = {
  "giant-wakes": {
    layout: "scrolly",
    headline: "Lagos Is Rewriting Africa's Future",
    subhead: "Tech, culture, and policy shifts are converging to make Lagos the continent's most influential megacity.",
    category: "Super Feature",
    author: "Chioma Okafor",
    status: "Published",
    heroImage: "https://images.unsplash.com/photo-1569163139599-0f4517e36f51?w=1600&q=80",
    videoUrl: "https://storage.googleapis.com/coverr-main/mp4/Mt_Baker.mp4",
    scrollySections: [
      { id: 1, type: "map", text: "Africa's commercial pulse is shifting steadily toward West Africa.", label: "West Africa", viewBox: "0 0 600 600", highlight: "nigeria" },
      { id: 2, type: "chart", text: "Nigeria's GDP now outpaces growth in many emerging economies.", label: "GDP projections", chartData: [2, 4, 5, 6, 7, 9, 11], accentColor: "#fbbf24" }
    ],
    content: []
  },
  "fiber-optic": {
    layout: "standard",
    headline: "The hidden fiber optic cables connecting Lagos to the world",
    subhead: "How a new generation of subsea cables is dropping latency and driving the startup boom.",
    category: "Technology",
    author: "Chioma Okereke",
    status: "Pending Review",
    heroImage: "https://images.unsplash.com/photo-1544197150-b99a580bbcbf?w=2000&auto=format&fit=crop",
    content: [
      { id: 1, type: "p", text: "Thirty feet beneath the Atlantic Ocean, a cable no thicker than a garden hose is pulsing with light. This light carries the hopes of a continent." },
      { id: 2, type: "quote", text: "This isn't just about Netflix streaming faster. This is about a surgeon in London guiding a robot in Lagos in real-time.", author: "Dr. Tunde Alabi" }
    ],
    scrollySections: []
  },
  "default": {
    layout: "standard",
    headline: "Untitled Story",
    subhead: "A great story starts with a great subhead.",
    category: "Technology",
    author: "", 
    status: "Draft",
    heroImage: "https://images.unsplash.com/photo-1487017159836-4e23ece2e4cf?w=1600&q=80",
    content: [ { id: 1, type: "p", text: "Start writing your story here..." } ],
    scrollySections: []
  }
};

const getInitialData = (storyId, currentUser) => {
  try {
    const savedData = localStorage.getItem(`story_${storyId}`);
    if (savedData) return JSON.parse(savedData);
  } catch (e) { console.error(e); }
  const initial = MOCK_DATA[storyId] || MOCK_DATA.default;
  if (storyId === 'new-story' || !initial.author) initial.author = currentUser?.name || "Admin";
  return JSON.parse(JSON.stringify(initial));
};

export default function StoryEditor({ storyId }) {
  const [user, setUser] = useState(null);
  const [story, setStory] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle');

  useEffect(() => {
    const u = getCurrentUser();
    if (!u) {
      window.location.href = '/admin/login';
    } else {
      setUser(u);
      setStory(getInitialData(storyId, u));
    }
  }, [storyId]);

  if (!user || !story) return null;

  const isContributor = user.role === ROLES.CONTRIBUTOR;
  const isEditor = user.role === ROLES.EDITOR;
  const isAdmin = user.role === ROLES.ADMIN;
  const canPublish = isAdmin || (isEditor && (user.categories?.includes(story.category) || story.author === user.name));
  const isLocked = isContributor && story.status === 'Published'; 

  const handleChange = (field, value) => { setStory(prev => ({ ...prev, [field]: value })); setIsDirty(true); setSaveStatus('idle'); };
  const handleContentChange = (id, field, value) => { setStory(prev => ({ ...prev, content: prev.content.map(b => b.id === id ? { ...b, [field]: value } : b) })); setIsDirty(true); };
  const addBlock = (type) => { setStory(prev => ({ ...prev, content: [...(prev.content||[]), { id: Date.now(), type, text: "" }] })); setIsDirty(true); };
  const removeBlock = (id) => { setStory(prev => ({ ...prev, content: prev.content.filter(b => b.id !== id) })); setIsDirty(true); };

  const performSave = (newStatus) => {
    setSaveStatus('saving');
    const updatedStory = { ...story, status: newStatus };
    setStory(updatedStory);
    setTimeout(() => {
      try { localStorage.setItem(`story_${storyId}`, JSON.stringify(updatedStory)); } catch (e) { console.error(e); }
      setIsDirty(false); setSaveStatus('saved'); setTimeout(() => setSaveStatus('idle'), 3000);
    }, 1000);
  };

  if (isLocked) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans text-center">
              <div className="bg-white p-8 rounded-xl shadow-lg max-w-md">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h2 className="text-xl font-black mb-2 uppercase tracking-tight">Story is Live!</h2>
                  <p className="text-gray-600 mb-6">As a contributor, you cannot edit published stories. Please reach out to your section editor for updates.</p>
                  <a href="/admin/stories" className="bg-black text-white px-6 py-3 rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-[#FAFF00] hover:text-black transition-all inline-block">Return to Dashboard</a>
              </div>
          </div>
      );
  }

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
          <button onClick={() => performSave(story.status)} disabled={saveStatus === 'saving' || !isDirty} className="text-gray-500 hover:text-black px-4 py-2 text-sm font-bold disabled:opacity-30">Save Draft</button>
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
                {(story.content || []).map((block) => (
                    <div key={block.id} className="bg-white p-6 rounded-xl border border-gray-200 relative group transition-all hover:border-gray-300">
                        <button onClick={() => removeBlock(block.id)} className="absolute top-2 right-2 p-2 text-gray-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button>
                        {block.type === 'p' && <textarea className="w-full text-lg font-serif outline-none resize-none leading-relaxed" rows="3" value={block.text} onChange={(e) => handleContentChange(block.id, 'text', e.target.value)} />}
                    </div>
                ))}
                <div className="flex justify-center py-8 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50"><button onClick={() => addBlock('p')} className="flex items-center gap-2 px-6 py-2 bg-white border border-gray-200 rounded-full text-xs font-black uppercase tracking-widest text-gray-500 hover:text-black hover:border-black transition-all shadow-sm"><Plus className="w-4 h-4" /> Add Section</button></div>
            </div>
        </div>
        <div className="col-span-4 space-y-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm sticky top-24">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6 pb-2 border-b border-gray-50">Story Meta</h3>
                <div className="space-y-6">
                    <div><label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Author</label><div className="font-bold text-sm flex items-center gap-2 bg-gray-50 px-3 py-2 rounded border border-gray-100 text-gray-600">{story.author}</div></div>
                    <div><label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Category</label><select className="w-full px-3 py-2 bg-white border border-gray-200 text-sm font-bold rounded-lg outline-none focus:ring-2 focus:ring-yellow-400" value={story.category} onChange={(e) => handleChange('category', e.target.value)}><option>Technology</option><option>Culture</option><option>Super Feature</option></select></div>
                    <div><label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Hero Image</label><div className="aspect-video w-full rounded-lg bg-gray-100 overflow-hidden border border-gray-200"><img src={story.heroImage} className="w-full h-full object-cover" /></div></div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
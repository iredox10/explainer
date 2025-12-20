import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Plus, Trash2, Image as ImageIcon, Type, Quote, MessageSquare, Move, Map, BarChart, Video, CheckCircle } from 'lucide-react';

const MOCK_DATA = {
  "giant-wakes": {
    layout: "scrolly",
    headline: "Lagos Is Rewriting Africa's Future",
    subhead: "Tech, culture, and policy shifts are converging to make Lagos the continent's most influential megacity.",
    category: "Super Feature",
    author: "Chioma Okafor",
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
    author: "Admin",
    heroImage: "https://images.unsplash.com/photo-1487017159836-4e23ece2e4cf?w=1600&q=80",
    content: [ { id: 1, type: "p", text: "Start writing your story here. Use the buttons below to add different content blocks like images, quotes, and callouts." } ],
    scrollySections: []
  }
};

const getInitialData = (storyId) => {
  try {
    const savedData = localStorage.getItem(`story_${storyId}`);
    if (savedData) {
      console.log(`Loaded story '${storyId}' from localStorage.`);
      return JSON.parse(savedData);
    }
  } catch (e) {
    console.error("Failed to load from localStorage", e);
  }
  // Deep copy to prevent state mutation issues
  const initial = MOCK_DATA[storyId] || MOCK_DATA.default;
  return JSON.parse(JSON.stringify(initial));
};


export default function StoryEditor({ storyId }) {
  const [story, setStory] = useState(() => getInitialData(storyId));
  const [isDirty, setIsDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle'); // idle, saving, saved

  useEffect(() => {
    setStory(getInitialData(storyId));
    setIsDirty(false);
    setSaveStatus('idle');
  }, [storyId]);

  const handleChange = (field, value) => {
    setStory(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
    setSaveStatus('idle');
  };

  const handleContentChange = (id, field, value) => {
    setStory(prev => ({
      ...prev,
      content: prev.content.map(block => block.id === id ? { ...block, [field]: value } : block)
    }));
    setIsDirty(true);
    setSaveStatus('idle');
  };
  
  const handleScrollyChange = (id, field, value) => {
     setStory(prev => ({
      ...prev,
      scrollySections: prev.scrollySections.map(section => section.id === id ? { ...section, [field]: value } : section)
    }));
    setIsDirty(true);
    setSaveStatus('idle');
  };
  
  const handleChartDataChange = (id, value) => {
      const numArr = value.split(',').map(n => parseFloat(n.trim())).filter(n => !isNaN(n));
      handleScrollyChange(id, 'chartData', numArr);
  };

  const addBlock = (type) => {
    const newBlock = { 
        id: Date.now(), type, text: "",
        ...(type === 'quote' && { author: "" }), 
        ...(type === 'callout' && { title: "Key Insight" }),
        ...(type === 'image' && { url: "", caption: "" })
    };
    setStory(prev => ({ ...prev, content: [...(prev.content || []), newBlock] }));
    setIsDirty(true);
  };
  
  const addScrollySection = (type) => {
    const newSection = { 
        id: Date.now(), type, text: "", label: "New Section",
        ...(type === 'map' && { viewBox: "0 0 600 600", highlight: "nigeria" }),
        ...(type === 'chart' && { chartData: [1, 2, 3], accentColor: "#fbbf24" })
    };
    setStory(prev => ({ ...prev, scrollySections: [...(prev.scrollySections || []), newSection] }));
    setIsDirty(true);
  };

  const removeBlock = (id) => {
    setStory(prev => ({ ...prev, content: prev.content.filter(b => b.id !== id) }));
    setIsDirty(true);
  };

  const removeScrollySection = (id) => {
    setStory(prev => ({ ...prev, scrollySections: prev.scrollySections.filter(s => s.id !== id) }));
    setIsDirty(true);
  };

  const handleSave = () => {
    if (!isDirty) return;
    setSaveStatus('saving');
    setTimeout(() => {
      console.log("Saving story:", story);
      try {
        localStorage.setItem(`story_${storyId}`, JSON.stringify(story));
      } catch (e) {
        console.error("Failed to save to localStorage", e);
      }
      setIsDirty(false);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }, 1500);
  };

  const renderContentBlocks = () => (
    <div className="space-y-4">
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Story Content</label>
        {(story.content || []).map((block) => (
          <div key={block.id} className="group relative bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:border-gray-300 transition-colors">
            <div className="absolute -left-12 top-1/2 -translate-y-1/2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
               <button onClick={() => removeBlock(block.id)} className="p-2 bg-white border border-gray-200 rounded-lg text-gray-400 hover:text-red-500 shadow-sm">
                 <Trash2 className="w-4 h-4" />
               </button>
            </div>
            {/* RENDERERS FOR EACH BLOCK TYPE */}
            {block.type === 'p' && <textarea className="w-full text-lg font-serif leading-relaxed outline-none resize-none" rows="3" placeholder="Paragraph text..." value={block.text} onChange={(e) => handleContentChange(block.id, 'text', e.target.value)} />}
            {block.type === 'quote' && (
                <div className="space-y-2"><textarea className="w-full text-xl font-bold italic bg-transparent outline-none resize-none" rows="2" placeholder="Quote..." value={block.text} onChange={(e) => handleContentChange(block.id, 'text', e.target.value)} /><input type="text" className="w-full text-sm font-bold uppercase tracking-wider bg-transparent outline-none text-gray-500 placeholder-gray-400" placeholder="Author" value={block.author} onChange={(e) => handleContentChange(block.id, 'author', e.target.value)} /></div>
            )}
            {block.type === 'image' && (
                <div className="space-y-2"><input type="text" className="w-full p-2 bg-gray-50 border border-gray-200 rounded text-sm" placeholder="Image URL" value={block.url} onChange={(e) => handleContentChange(block.id, 'url', e.target.value)} /><input type="text" className="w-full text-xs bg-transparent outline-none text-gray-500 placeholder-gray-400" placeholder="Caption" value={block.caption} onChange={(e) => handleContentChange(block.id, 'caption', e.target.value)} /></div>
            )}
          </div>
        ))}
        <div className="flex justify-center gap-3 py-8 border-2 border-dashed border-gray-200 rounded-xl">
          <button onClick={() => addBlock('p')} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:text-[#008751] hover:border-[#008751] transition-all shadow-sm"><Type className="w-4 h-4" /> Paragraph</button>
          <button onClick={() => addBlock('image')} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:text-[#008751] hover:border-[#008751] transition-all shadow-sm"><ImageIcon className="w-4 h-4" /> Image</button>
          <button onClick={() => addBlock('quote')} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:text-[#008751] hover:border-[#008751] transition-all shadow-sm"><Quote className="w-4 h-4" /> Quote</button>
        </div>
    </div>
  );
  
  const renderScrollySections = () => (
     <div className="space-y-6">
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Scrollytelling Sections</label>
        {(story.scrollySections || []).map((section) => (
            <div key={section.id} className="group relative bg-white p-6 rounded-xl border-2 border-gray-100 shadow-sm hover:border-gray-300">
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-100"><span className="font-bold text-sm uppercase text-gray-600">{section.type} Section</span><button onClick={() => removeScrollySection(section.id)}><Trash2 className="w-4 h-4" /></button></div>
                <div className="grid grid-cols-2 gap-6">
                    <div><label className="block text-xs font-bold text-gray-400 mb-1">Narrative Text</label><textarea className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm font-serif" rows="5" value={section.text} onChange={(e) => handleScrollyChange(section.id, 'text', e.target.value)} /></div>
                    <div className="space-y-3"><div><label className="block text-xs font-bold text-gray-400 mb-1">Label</label><input type="text" className="w-full p-2 bg-gray-50 rounded border border-gray-200 text-sm" value={section.label} onChange={(e) => handleScrollyChange(section.id, 'label', e.target.value)} /></div>{section.type === 'chart' && (<div><label className="block text-xs font-bold text-gray-400 mb-1">Data (comma separated)</label><input type="text" className="w-full p-2 bg-gray-50 rounded border border-gray-200 font-mono text-sm" defaultValue={section.chartData?.join(', ')} onBlur={(e) => handleChartDataChange(section.id, e.target.value)} /></div>)}</div>
                </div>
            </div>
        ))}
        <div className="flex justify-center gap-3 py-8 border-2 border-dashed border-gray-200 rounded-xl"><button onClick={() => addScrollySection('map')} className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg text-sm font-bold text-gray-600 hover:text-[#008751] hover:border-[#008751]"><Map className="w-4 h-4" /> Add Map</button><button onClick={() => addScrollySection('chart')} className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg text-sm font-bold text-gray-600 hover:text-[#008751] hover:border-[#008751]"><BarChart className="w-4 h-4" /> Add Chart</button></div>
     </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-20">
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 shadow-sm">
        <div className="flex items-center gap-4"><a href="/admin/stories" className="p-2 hover:bg-gray-100 rounded-full text-gray-500"><ArrowLeft className="w-5 h-5" /></a><span className="text-gray-300">/</span><div className="flex items-center gap-2"><span className="text-xs font-bold uppercase tracking-wider bg-gray-100 text-gray-500 px-2 py-1 rounded-md">{isDirty ? 'Unsaved' : 'Saved'}</span><span className="font-bold text-sm truncate max-w-[200px]">{story.headline || "Untitled Story"}</span></div></div>
        <div className="flex items-center gap-3">{saveStatus === 'saved' && (<span className="text-xs text-green-600 font-bold flex items-center gap-1.5 animate-in fade-in"><CheckCircle className="w-4 h-4" />Saved!</span>)}<button onClick={handleSave} disabled={!isDirty || saveStatus === 'saving'} className="bg-[#008751] text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-sm disabled:opacity-50 hover:bg-[#006b3f]">{saveStatus === 'saving' ? (<div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>) : (<Save className="w-4 h-4" />)}{saveStatus === 'saving' ? 'Saving...' : 'Save Changes'}</button></div>
      </nav>

      <div className="max-w-6xl mx-auto mt-8 grid grid-cols-12 gap-8 px-6">
        <div className="col-span-8">
            <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm space-y-6 mb-8"><div><label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Headline</label><textarea className="w-full text-3xl font-black leading-tight outline-none resize-none" rows="2" value={story.headline} onChange={(e) => handleChange('headline', e.target.value)} /></div><div><label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Subhead</label><textarea className="w-full text-xl font-serif text-gray-600 leading-relaxed outline-none resize-none" rows="2" value={story.subhead} onChange={(e) => handleChange('subhead', e.target.value)} /></div></div>
            {story.layout === 'scrolly' ? renderScrollySections() : renderContentBlocks()}
        </div>

        <div className="col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">Story Settings</h3>
            <div className="space-y-4">
              <div><label className="block text-xs font-medium text-gray-500 mb-1">Layout</label><select className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" value={story.layout} onChange={(e) => handleChange('layout', e.target.value)}><option value="standard">Standard Article</option><option value="scrolly">Explainer (Scrolly)</option></select></div>
              {story.layout === 'scrolly' && (<div><label className="block text-xs font-medium text-gray-500 mb-1">Video Loop URL</label><div className="flex gap-2"><input type="text" className="w-full px-3 py-2 bg-gray-50 border text-xs" value={story.videoUrl || ""} onChange={(e) => handleChange('videoUrl', e.target.value)} /><div className="w-10 h-10 shrink-0 bg-black rounded-lg flex items-center justify-center"><Video className="w-4 h-4 text-white" /></div></div></div>)}
              <div><label className="block text-xs font-medium text-gray-500 mb-1">Author</label><input type="text" className="w-full px-3 py-2 bg-gray-50 border text-sm" value={story.author} onChange={(e) => handleChange('author', e.target.value)} /></div>
              <div><label className="block text-xs font-medium text-gray-500 mb-1">Category</label><select className="w-full px-3 py-2 bg-gray-50 border text-sm" value={story.category} onChange={(e) => handleChange('category', e.target.value)}><option>Super Feature</option><option>Technology</option><option>Culture</option></select></div>
              <div><label className="block text-xs font-medium text-gray-500 mb-1">Hero Image URL</label><div className="flex gap-2"><input type="text" className="w-full px-3 py-2 bg-gray-50 border text-xs" value={story.heroImage} onChange={(e) => handleChange('heroImage', e.target.value)} /><div className="w-10 h-10 shrink-0 bg-gray-100 rounded-lg overflow-hidden border"><img src={story.heroImage} className="w-full h-full object-cover" /></div></div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
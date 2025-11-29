import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Plus, Trash2, Image as ImageIcon, Type, Quote, MessageSquare, Move, Map, BarChart, Video } from 'lucide-react';

// Updated Mock Data including Scrollytelling structure for giant-wakes
const MOCK_DATA = {
  "giant-wakes": {
    layout: "scrolly",
    headline: "Lagos Is Rewriting Africa's Future",
    subhead: "Tech, culture, and policy shifts are converging to make Lagos the continent's most influential megacity.",
    category: "Super Feature",
    author: "Chioma Okafor",
    videoUrl: "https://storage.googleapis.com/coverr-main/mp4/Mt_Baker.mp4",
    scrollySections: [
      {
        id: 1,
        type: "map",
        text: "Africa's commercial pulse is shifting steadily toward West Africa.",
        label: "West Africa",
        viewBox: "0 0 600 600",
        highlight: "nigeria"
      },
      {
        id: 2,
        type: "chart",
        text: "Nigeria's GDP now outpaces growth in many emerging economies.",
        label: "GDP projections",
        chartData: [2, 4, 5, 6, 7, 9, 11],
        accentColor: "#fbbf24"
      }
    ],
    content: [], // Scrolly stories might not have standard content blocks
    heroImage: "https://images.unsplash.com/photo-1569163139599-0f4517e36f51?w=1600&q=80"
  },
  "default": {
    layout: "standard",
    headline: "Untitled Story",
    subhead: "Enter subhead...",
    category: "Technology",
    author: "Admin",
    heroImage: "https://images.unsplash.com/photo-1569163139599-0f4517e36f51?w=1600&q=80",
    content: [
      { id: 1, type: "p", text: "Start typing your story here..." }
    ],
    scrollySections: []
  }
};

export default function StoryEditor({ storyId }) {
  // Load specific story or default
  const initialData = MOCK_DATA[storyId] || MOCK_DATA.default;
  const [story, setStory] = useState(initialData);
  const [isDirty, setIsDirty] = useState(false);
  const [showJson, setShowJson] = useState(false);

  const handleChange = (field, value) => {
    setStory(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleContentChange = (id, field, value) => {
    setStory(prev => ({
      ...prev,
      content: prev.content.map(block => block.id === id ? { ...block, [field]: value } : block)
    }));
    setIsDirty(true);
  };

  const handleScrollyChange = (id, field, value) => {
     setStory(prev => ({
      ...prev,
      scrollySections: prev.scrollySections.map(section => section.id === id ? { ...section, [field]: value } : section)
    }));
    setIsDirty(true);
  };
  
  // Special handler for chart data (comma separated string -> array of numbers)
  const handleChartDataChange = (id, value) => {
      const numArr = value.split(',').map(n => parseFloat(n.trim())).filter(n => !isNaN(n));
      setStory(prev => ({
        ...prev,
        scrollySections: prev.scrollySections.map(section => section.id === id ? { ...section, chartData: numArr } : section)
      }));
      setIsDirty(true);
  };

  const addBlock = (type) => {
    const newBlock = { 
        id: Date.now(), 
        type, 
        ...(type === 'p' ? { text: "" } : {}),
        ...(type === 'quote' ? { text: "", author: "" } : {}), 
        ...(type === 'callout' ? { text: "", title: "" } : {}),
        ...(type === 'image' ? { url: "", caption: "" } : {})
    };
    setStory(prev => ({ ...prev, content: [...prev.content, newBlock] }));
  };
  
  const addScrollySection = (type) => {
    const newSection = { 
        id: Date.now(), 
        type, 
        text: "", 
        label: "New Section",
        ...(type === 'map' ? { viewBox: "0 0 600 600", highlight: "nigeria" } : {}),
        ...(type === 'chart' ? { chartData: [1, 2, 3], accentColor: "#fbbf24" } : {})
    };
    setStory(prev => ({ ...prev, scrollySections: [...prev.scrollySections, newSection] }));
  };

  const removeBlock = (id) => {
    setStory(prev => ({ ...prev, content: prev.content.filter(b => b.id !== id) }));
  };

  const removeScrollySection = (id) => {
    setStory(prev => ({ ...prev, scrollySections: prev.scrollySections.filter(s => s.id !== id) }));
  };

  const handleSave = () => {
    setShowJson(true);
    setIsDirty(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-20">
      {/* Top Bar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 shadow-sm">
        <div className="flex items-center gap-4">
          <a href="/admin" className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </a>
          <span className="text-gray-300">/</span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider bg-gray-100 text-gray-500 px-2 py-1 rounded-md">Draft</span>
            <span className="font-bold text-sm truncate max-w-[200px]">{story.headline || "Untitled Story"}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 font-medium mr-2">{isDirty ? "Unsaved changes" : "All changes saved"}</span>
          <button 
            onClick={handleSave}
            className="bg-[#008751] hover:bg-[#006b3f] text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-sm"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto mt-8 grid grid-cols-12 gap-8 px-6">
        
        {/* Main Editor Column */}
        <div className="col-span-8 space-y-6">
          
          {/* Metadata Card */}
          <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Headline</label>
              <textarea 
                className="w-full text-3xl font-black leading-tight outline-none placeholder-gray-300 resize-none"
                placeholder="Enter story headline..."
                rows="2"
                value={story.headline}
                onChange={(e) => handleChange('headline', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Subhead</label>
              <textarea 
                className="w-full text-xl font-serif text-gray-600 leading-relaxed outline-none placeholder-gray-300 resize-none"
                placeholder="Enter subhead..."
                rows="2"
                value={story.subhead}
                onChange={(e) => handleChange('subhead', e.target.value)}
              />
            </div>
          </div>

          {/* Conditional Editor based on Layout */}
          {story.layout === 'scrolly' ? (
            <div className="space-y-6">
               <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Scrollytelling Sections</label>
               </div>
               
               {story.scrollySections?.map((section) => (
                 <div key={section.id} className="group relative bg-white p-6 rounded-xl border-2 border-gray-100 shadow-sm hover:border-gray-300 transition-colors">
                    {/* Section Header */}
                    <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                            {section.type === 'map' ? <Map className="w-5 h-5 text-blue-500"/> : <BarChart className="w-5 h-5 text-orange-500"/>}
                            <span className="font-bold text-sm uppercase text-gray-600">{section.type} Section</span>
                        </div>
                        <button onClick={() => removeScrollySection(section.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        {/* Left: Narrative Text */}
                        <div className="col-span-1">
                            <label className="block text-xs font-bold text-gray-400 mb-1">Narrative Text</label>
                            <textarea 
                                className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm font-serif leading-relaxed focus:outline-none focus:border-[#008751]"
                                rows="5"
                                placeholder="The text the user reads while scrolling..."
                                value={section.text}
                                onChange={(e) => handleScrollyChange(section.id, 'text', e.target.value)}
                            />
                        </div>

                        {/* Right: Configuration */}
                        <div className="col-span-1 space-y-3">
                             <div>
                                <label className="block text-xs font-bold text-gray-400 mb-1">Label</label>
                                <input 
                                    type="text" 
                                    className="w-full p-2 bg-gray-50 rounded border border-gray-200 text-sm focus:outline-none focus:border-[#008751]"
                                    value={section.label}
                                    onChange={(e) => handleScrollyChange(section.id, 'label', e.target.value)}
                                />
                             </div>
                             
                             {section.type === 'map' && (
                                 <>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 mb-1">Highlight Region</label>
                                        <select 
                                            className="w-full p-2 bg-gray-50 rounded border border-gray-200 text-sm focus:outline-none focus:border-[#008751]"
                                            value={section.highlight}
                                            onChange={(e) => handleScrollyChange(section.id, 'highlight', e.target.value)}
                                        >
                                            <option value="global">Global</option>
                                            <option value="nigeria">Nigeria</option>
                                            <option value="west-africa">West Africa</option>
                                        </select>
                                    </div>
                                 </>
                             )}

                             {section.type === 'chart' && (
                                 <>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 mb-1">Data (comma separated)</label>
                                        <input 
                                            type="text" 
                                            className="w-full p-2 bg-gray-50 rounded border border-gray-200 text-sm font-mono focus:outline-none focus:border-[#008751]"
                                            placeholder="10, 20, 30, 40..."
                                            defaultValue={section.chartData?.join(', ')}
                                            onBlur={(e) => handleChartDataChange(section.id, e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 mb-1">Accent Color</label>
                                        <div className="flex items-center gap-2">
                                            <input 
                                                type="color" 
                                                className="w-8 h-8 rounded cursor-pointer border-none"
                                                value={section.accentColor}
                                                onChange={(e) => handleScrollyChange(section.id, 'accentColor', e.target.value)}
                                            />
                                            <span className="text-xs text-gray-500 font-mono">{section.accentColor}</span>
                                        </div>
                                    </div>
                                 </>
                             )}
                        </div>
                    </div>
                 </div>
               ))}

               {/* Add Section Buttons */}
               <div className="flex justify-center gap-3 py-8 border-2 border-dashed border-gray-200 rounded-xl hover:border-gray-300 transition-colors bg-gray-50/50">
                  <button onClick={() => addScrollySection('map')} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:text-[#008751] hover:border-[#008751] transition-all shadow-sm">
                    <Map className="w-4 h-4" /> Add Map Section
                  </button>
                  <button onClick={() => addScrollySection('chart')} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:text-[#008751] hover:border-[#008751] transition-all shadow-sm">
                    <BarChart className="w-4 h-4" /> Add Chart Section
                  </button>
                </div>
            </div>
          ) : (
            /* Standard Editor Content (Paragraphs, etc) */
            <div className="space-y-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Story Content</label>
                {story.content.map((block, index) => (
                  <div key={block.id} className="group relative bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:border-gray-300 transition-colors">
                    <div className="absolute -left-12 top-1/2 -translate-y-1/2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button className="p-2 bg-white border border-gray-200 rounded-lg text-gray-400 hover:text-[#008751] shadow-sm cursor-move">
                         <Move className="w-4 h-4" />
                       </button>
                       <button onClick={() => removeBlock(block.id)} className="p-2 bg-white border border-gray-200 rounded-lg text-gray-400 hover:text-red-500 shadow-sm">
                         <Trash2 className="w-4 h-4" />
                       </button>
                    </div>

                    {block.type === 'p' && (
                      <div className="flex gap-4">
                        <Type className="w-5 h-5 text-gray-300 shrink-0 mt-1" />
                        <textarea 
                          className="w-full text-lg font-serif leading-relaxed outline-none resize-none"
                          rows="3"
                          placeholder="Type paragraph text..."
                          value={block.text}
                          onChange={(e) => handleContentChange(block.id, 'text', e.target.value)}
                        />
                      </div>
                    )}

                    {block.type === 'quote' && (
                      <div className="flex gap-4 bg-gray-50 p-4 rounded-lg border-l-4 border-[#008751]">
                        <Quote className="w-5 h-5 text-[#008751] shrink-0 mt-1" />
                        <div className="w-full space-y-3">
                          <textarea 
                            className="w-full text-xl font-bold italic bg-transparent outline-none resize-none placeholder-gray-400"
                            rows="2"
                            placeholder="Quote text..."
                            value={block.text}
                            onChange={(e) => handleContentChange(block.id, 'text', e.target.value)}
                          />
                          <input 
                            type="text" 
                            className="w-full text-sm font-bold uppercase tracking-wider bg-transparent outline-none text-gray-500 placeholder-gray-400"
                            placeholder="AUTHOR NAME"
                            value={block.author}
                            onChange={(e) => handleContentChange(block.id, 'author', e.target.value)}
                          />
                        </div>
                      </div>
                    )}

                     {block.type === 'callout' && (
                      <div className="flex gap-4 bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <MessageSquare className="w-5 h-5 text-blue-500 shrink-0 mt-1" />
                        <div className="w-full space-y-2">
                          <input 
                            type="text" 
                            className="w-full text-xs font-bold uppercase tracking-wider bg-transparent outline-none text-blue-600 placeholder-blue-300"
                            placeholder="CALLOUT TITLE"
                            value={block.title}
                            onChange={(e) => handleContentChange(block.id, 'title', e.target.value)}
                          />
                          <textarea 
                            className="w-full text-lg font-bold bg-transparent outline-none resize-none text-gray-900"
                            rows="2"
                            placeholder="Callout text..."
                            value={block.text}
                            onChange={(e) => handleContentChange(block.id, 'text', e.target.value)}
                          />
                        </div>
                      </div>
                    )}

                    {block.type === 'image' && (
                      <div className="flex gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <ImageIcon className="w-5 h-5 text-gray-400 shrink-0 mt-1" />
                        <div className="w-full space-y-2">
                          <input 
                            type="text" 
                            className="w-full p-2 bg-white border border-gray-200 rounded text-sm focus:outline-none focus:border-[#008751]"
                            placeholder="Image URL (https://...)"
                            value={block.url}
                            onChange={(e) => handleContentChange(block.id, 'url', e.target.value)}
                          />
                          <input 
                            type="text" 
                            className="w-full text-xs bg-transparent outline-none text-gray-500 placeholder-gray-400"
                            placeholder="Optional Caption"
                            value={block.caption}
                            onChange={(e) => handleContentChange(block.id, 'caption', e.target.value)}
                          />
                          {block.url && (
                            <div className="mt-2 rounded-md overflow-hidden border border-gray-200 max-h-40 w-fit">
                              <img src={block.url} alt="preview" className="h-full object-contain" />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                <div className="flex justify-center gap-3 py-8 border-2 border-dashed border-gray-200 rounded-xl hover:border-gray-300 transition-colors bg-gray-50/50">
                  <button onClick={() => addBlock('p')} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:text-[#008751] hover:border-[#008751] transition-all shadow-sm">
                    <Type className="w-4 h-4" /> Paragraph
                  </button>
                  <button onClick={() => addBlock('image')} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:text-[#008751] hover:border-[#008751] transition-all shadow-sm">
                    <ImageIcon className="w-4 h-4" /> Image
                  </button>
                  <button onClick={() => addBlock('quote')} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:text-[#008751] hover:border-[#008751] transition-all shadow-sm">
                    <Quote className="w-4 h-4" /> Quote
                  </button>
                  <button onClick={() => addBlock('callout')} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:text-[#008751] hover:border-[#008751] transition-all shadow-sm">
                    <MessageSquare className="w-4 h-4" /> Callout
                  </button>
                </div>
            </div>
          )}

        </div>

        {/* Sidebar Settings */}
        <div className="col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">Story Settings</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Layout</label>
                <select 
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#008751]"
                  value={story.layout}
                  onChange={(e) => handleChange('layout', e.target.value)}
                >
                  <option value="standard">Standard Article</option>
                  <option value="scrolly">Explainer (Scrolly)</option>
                </select>
              </div>
              
              {story.layout === 'scrolly' && (
                 <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Video Loop URL</label>
                    <div className="flex gap-2">
                        <input 
                          type="text" 
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono focus:outline-none focus:border-[#008751]"
                          value={story.videoUrl || ""}
                          onChange={(e) => handleChange('videoUrl', e.target.value)}
                          placeholder="https://..."
                        />
                        <div className="w-10 h-10 shrink-0 bg-black rounded-lg flex items-center justify-center">
                            <Video className="w-4 h-4 text-white" />
                        </div>
                    </div>
                  </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Author</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#008751]"
                  value={story.author}
                  onChange={(e) => handleChange('author', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
                <select 
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#008751]"
                  value={story.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                >
                  <option>Super Feature</option>
                  <option>Technology</option>
                  <option>Culture</option>
                  <option>Economy</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Hero Image URL</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono focus:outline-none focus:border-[#008751]"
                    value={story.heroImage}
                    onChange={(e) => handleChange('heroImage', e.target.value)}
                  />
                  <div className="w-10 h-10 shrink-0 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                    <img src={story.heroImage} className="w-full h-full object-cover" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* JSON Modal */}
      {showJson && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-gray-900">Generated JSON</h3>
              <button onClick={() => setShowJson(false)} className="text-gray-400 hover:text-gray-900">Close</button>
            </div>
            <div className="p-0">
              <div className="bg-[#1a1a1a] text-gray-300 p-6 overflow-auto max-h-[500px] font-mono text-sm leading-relaxed">
                <pre>{JSON.stringify(story, null, 2)}</pre>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end">
               <button 
                 onClick={() => { navigator.clipboard.writeText(JSON.stringify(story, null, 2)); setShowJson(false); }}
                 className="bg-[#008751] text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-[#006b3f] transition-colors"
               >
                 Copy to Clipboard
               </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
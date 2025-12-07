import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, FileText, Hash, ArrowRight, X } from 'lucide-react';

// Mock Data for search
const SECTIONS = [
  { id: 's1', title: 'Politics', type: 'section', url: '/topic/politics' },
  { id: 's2', title: 'Technology', type: 'section', url: '/topic/technology' },
  { id: 's3', title: 'Culture', type: 'section', url: '/topic/culture' },
  { id: 's4', title: 'Science', type: 'section', url: '/topic/science' },
  { id: 's5', title: 'Video', type: 'section', url: '/#video' },
];

const ARTICLES = [
  { id: 'a1', title: 'The hidden fiber optic cables connecting Lagos', type: 'article', url: '/article/fiber-optic-lagos' },
  { id: 'a2', title: 'The Giant Wakes: Nigeria\'s Economy', type: 'article', url: '/article/giant-wakes' },
  { id: 'a3', title: 'Why your rent is so high', type: 'article', url: '#' },
  { id: 'a4', title: 'How AI is rewriting the internet', type: 'article', url: '#' },
];

export default function CommandMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  // Filter Items
  const filteredSections = SECTIONS.filter(item => item.title.toLowerCase().includes(query.toLowerCase()));
  const filteredArticles = ARTICLES.filter(item => item.title.toLowerCase().includes(query.toLowerCase()));
  
  const allItems = [...filteredSections, ...filteredArticles];

  // Handle Open/Close with Keyboard
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Reset selection when query changes or opened
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, isOpen]);

  // Focus input on open
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 10);
    }
  }, [isOpen]);

  // Handle Navigation
  const handleNavigation = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % allItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + allItems.length) % allItems.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selectedItem = allItems[selectedIndex];
      if (selectedItem) {
        window.location.href = selectedItem.url;
        setIsOpen(false);
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-2xl bg-white shadow-2xl rounded-xl overflow-hidden z-[201] border border-gray-200 font-sans"
          >
            {/* Search Input */}
            <div className="flex items-center border-b border-gray-100 px-4 py-4">
              <Search className="w-5 h-5 text-gray-400 mr-3" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search articles, topics, or sections..."
                className="flex-1 text-lg outline-none placeholder:text-gray-400 bg-transparent text-black"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleNavigation}
              />
              <div className="flex items-center gap-2">
                 <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded border border-gray-200">ESC</span>
              </div>
            </div>

            {/* Results List */}
            <div className="max-h-[60vh] overflow-y-auto py-2">
              
              {allItems.length === 0 ? (
                <div className="px-6 py-12 text-center text-gray-500">
                  <p>No results found for "{query}"</p>
                </div>
              ) : (
                <>
                  {/* Sections Group */}
                  {filteredSections.length > 0 && (
                    <div className="mb-2">
                      <div className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Sections
                      </div>
                      {filteredSections.map((item, index) => {
                        const isSelected = index === selectedIndex;
                        return (
                          <div
                            key={item.id}
                            onClick={() => {
                                window.location.href = item.url;
                                setIsOpen(false);
                            }}
                            className={`px-4 py-3 flex items-center justify-between cursor-pointer transition-colors ${isSelected ? 'bg-[#FAFF00] text-black' : 'hover:bg-gray-50 text-gray-700'}`}
                          >
                            <div className="flex items-center gap-3">
                              <Hash className={`w-4 h-4 ${isSelected ? 'text-black' : 'text-gray-400'}`} />
                              <span className="font-bold">{item.title}</span>
                            </div>
                            {isSelected && <ArrowRight className="w-4 h-4" />}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Articles Group */}
                  {filteredArticles.length > 0 && (
                    <div>
                      <div className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400 border-t border-gray-100 mt-2 pt-4">
                        Articles
                      </div>
                      {filteredArticles.map((item, index) => {
                        const globalIndex = index + filteredSections.length;
                        const isSelected = globalIndex === selectedIndex;
                        return (
                          <div
                            key={item.id}
                            onClick={() => {
                                window.location.href = item.url;
                                setIsOpen(false);
                            }}
                            className={`px-4 py-3 flex items-center justify-between cursor-pointer transition-colors ${isSelected ? 'bg-[#FAFF00] text-black' : 'hover:bg-gray-50 text-gray-700'}`}
                          >
                            <div className="flex items-center gap-3">
                              <FileText className={`w-4 h-4 ${isSelected ? 'text-black' : 'text-gray-400'}`} />
                              <span className="font-medium">{item.title}</span>
                            </div>
                            {isSelected && <ArrowRight className="w-4 h-4" />}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-4 py-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-mono">
               <div className="flex items-center gap-4">
                 <span><strong className="font-bold">↑↓</strong> to navigate</span>
                 <span><strong className="font-bold">↵</strong> to select</span>
               </div>
               <span>Explainer Search</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

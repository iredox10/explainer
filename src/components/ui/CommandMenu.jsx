import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, FileText, Hash, ArrowRight, Loader2, Plus, Users, Settings as SettingsIcon, LogOut } from 'lucide-react';
import { storyService, categoryService } from '../../lib/services';

export default function CommandMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [sections, setSections] = useState([]);
  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setIsAdmin(window.location.pathname.startsWith('/admin'));
  }, []);

  // Initial fetch for sections
  useEffect(() => {
    async function fetchInitialData() {
      const cats = await categoryService.getCategories();
      setSections(cats.map(c => ({
        id: c.$id,
        title: c.name,
        type: 'section',
        url: isAdmin ? `/admin/categories` : `/topic/${c.slug || c.name.toLowerCase()}`
      })));
    }
    fetchInitialData();
  }, [isAdmin]);

  // Live search for articles
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length > 2) {
        setIsLoading(true);
        const results = isAdmin
          ? await storyService.searchAllStories(query)
          : await storyService.searchStories(query);

        setArticles(results.map(r => ({
          id: r.$id,
          title: r.headline,
          type: 'article',
          url: isAdmin ? `/admin/edit/${r.$id}` : `/article/${r.slug}`
        })));
        setIsLoading(false);
      } else if (query.length === 0) {
        setArticles([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, isAdmin]);

  const adminShortcuts = isAdmin ? [
    { id: 'new-story', title: 'Create New Dispatch', url: '/admin/edit/new-story', icon: Plus },
    { id: 'manage-authors', title: 'Author Directory', url: '/admin/authors', icon: Users },
    { id: 'system-settings', title: 'Global Protocols', url: '/admin/settings', icon: SettingsIcon },
  ] : [];

  const filteredShortcuts = adminShortcuts.filter(s => s.title.toLowerCase().includes(query.toLowerCase()));
  const filteredSections = sections.filter(item => item.title.toLowerCase().includes(query.toLowerCase()));
  const allItems = [...filteredShortcuts, ...filteredSections, ...articles];

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => { setSelectedIndex(0); }, [query, isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 10);
    }
  }, [isOpen]);

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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200]"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-2xl bg-white shadow-2xl rounded-xl overflow-hidden z-[201] border border-gray-200 font-sans"
          >
            <div className="flex items-center border-b border-gray-100 px-4 py-4">
              <Search className="w-5 h-5 text-gray-400 mr-3" />
              <input
                ref={inputRef}
                type="text"
                placeholder={isAdmin ? "Execute admin command..." : "Search articles, topics, or sections..."}
                className="flex-1 text-lg outline-none placeholder:text-gray-400 bg-transparent text-black"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleNavigation}
              />
              {isLoading && <Loader2 className="w-4 h-4 animate-spin text-[#FAFF00]" />}
            </div>

            <div className="max-h-[60vh] overflow-y-auto py-2">
              {isLoading ? (
                <div className="px-6 py-16 flex flex-col items-center justify-center text-black gap-4 my-2 mx-4 rounded-xl pattern-dots pattern-gray-100 pattern-size-4">
                  <Loader2 className="w-8 h-8 animate-spin text-[#FAFF00]" />
                  <p className="text-[10px] uppercase font-black tracking-widest italic animate-pulse text-gray-400">Synchronizing Intel...</p>
                </div>
              ) : allItems.length === 0 ? (
                <div className="px-6 py-16 text-center text-gray-400 border border-dashed border-gray-100 m-4 rounded-xl flex items-center justify-center">
                  <p className="text-[10px] uppercase font-black tracking-widest italic">No surveillance matches found</p>
                </div>
              ) : (
                <>
                  {filteredShortcuts.length > 0 && (
                    <div className="mb-2">
                      <div className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400">Quick Actions</div>
                      {filteredShortcuts.map((item, index) => {
                        const isSelected = index === selectedIndex;
                        const Icon = item.icon;
                        return (
                          <div
                            key={item.id}
                            onClick={() => { window.location.href = item.url; setIsOpen(false); }}
                            className={`px-4 py-3 flex items-center justify-between cursor-pointer transition-colors ${isSelected ? 'bg-[#FAFF00] text-black' : 'hover:bg-gray-50 text-gray-700'}`}
                          >
                            <div className="flex items-center gap-3">
                              <Icon className={`w-4 h-4 ${isSelected ? 'text-black' : 'text-[#FAFF00]'}`} />
                              <span className="font-bold">{item.title}</span>
                            </div>
                            {isSelected && <ArrowRight className="w-4 h-4" />}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {filteredSections.length > 0 && (
                    <div className="mb-2">
                      <div className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400">{isAdmin ? 'Vertical Management' : 'Verticals'}</div>
                      {filteredSections.map((item, index) => {
                        const globalIndex = index + filteredShortcuts.length;
                        const isSelected = globalIndex === selectedIndex;
                        return (
                          <div
                            key={item.id}
                            onClick={() => { window.location.href = item.url; setIsOpen(false); }}
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

                  {articles.length > 0 && (
                    <div>
                      <div className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400 border-t border-gray-100 mt-2 pt-4">{isAdmin ? 'Drafts & Published' : 'Published Dispatches'}</div>
                      {articles.map((item, index) => {
                        const globalIndex = index + filteredShortcuts.length + filteredSections.length;
                        const isSelected = globalIndex === selectedIndex;
                        return (
                          <div
                            key={item.id}
                            onClick={() => { window.location.href = item.url; setIsOpen(false); }}
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



            <div className="bg-gray-50 px-4 py-2 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-400 font-mono font-bold uppercase tracking-widest">
              <div className="flex items-center gap-4">
                <span>↑↓ Navigate</span>
                <span>↵ Select</span>
              </div>
              <span>Explainer Live Intelligence</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

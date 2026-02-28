import { useState, useEffect } from 'react';

const ProgressBar = ({ title, author }) => {
  const [scroll, setScroll] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const top = document.documentElement.scrollTop;
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = top / windowHeight;
      setScroll(Number(scrolled));

      // Show sticky header after scrolling past 600px
      if (top > 600) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    }

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <div
        className={`fixed top-0 left-0 w-full bg-white border-b border-gray-200 z-[60] flex items-center justify-between px-6 py-3 transition-transform duration-300 ease-out ${isVisible ? 'translate-y-0 shadow-md' : '-translate-y-full'}`}
      >
        <div className="flex-1 truncate pr-8">
          <h3 className="font-serif-display font-black text-sm md:text-base text-black truncate tracking-tight">{title}</h3>
          {author && <p className="text-[10px] font-sans font-bold uppercase tracking-widest text-gray-400 mt-0.5">By {author}</p>}
        </div>

        <div className="flex items-center gap-4 flex-shrink-0">
          {/* Mobile share icons could go here */}
          <button className="hidden md:flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-[#FAFF00] text-black px-4 py-2 rounded-full shadow-sm hover:scale-105 transition-transform">
            Subscribe
          </button>
        </div>

        {/* The actual progress line attached to bottom of this header */}
        <div className="absolute bottom-0 left-0 w-full h-[3px] bg-gray-100">
          <div
            className="h-full bg-black transition-all duration-150 ease-out"
            style={{ width: `${scroll * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Fallback progress bar at very top for when header isn't visible, if desired. We'll just hide it to make it clean. */}
    </>
  );
};

export default ProgressBar;

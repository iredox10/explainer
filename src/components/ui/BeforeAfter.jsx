import { useState, useRef, useEffect } from 'react';
import { Move } from 'lucide-react';

const BeforeAfter = ({ leftImage, rightImage, leftLabel = "Before", rightLabel = "After", caption }) => {
  const [sliderPos, setSliderPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  const isVideo = (url) => {
    if (!url) return false;
    const ext = url.split('.').pop().toLowerCase();
    return ['mp4', 'webm', 'mov', 'ogg'].includes(ext);
  };

  const renderMedia = (src, alt) => {
    if (isVideo(src)) {
      return (
        <video 
          src={src} 
          className="w-full h-full object-cover" 
          autoPlay 
          muted 
          loop 
          playsInline 
        />
      );
    }
    return <img src={src} alt={alt} className="w-full h-full object-cover" />;
  };

  const handleMove = (clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = (x / rect.width) * 100;
    setSliderPos(percent);
  };
  
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  const handleMouseMove = (e) => {
    if (isDragging) {
      handleMove(e.clientX);
    }
  };
  
  const handleTouchMove = (e) => {
    if(isDragging) {
      handleMove(e.touches[0].clientX);
    }
  };

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchend', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove);
    
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isDragging]);

  return (
    <figure className="my-16 -mx-6 md:-mx-12 lg:-mx-24 group">
        <div ref={containerRef} className="relative w-full aspect-[16/9] overflow-hidden select-none cursor-ew-resize border border-gray-200 shadow-sm">
            {/* Right Image (Bottom Layer) */}
            <div className="absolute inset-0 w-full h-full">
                {renderMedia(rightImage, "After")}
                <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 text-white text-[10px] font-bold uppercase tracking-wider rounded-sm">{rightLabel}</div>
            </div>

            {/* Left Image (Top Layer, Clipped) */}
            <div 
                className="absolute inset-0 w-full h-full overflow-hidden" 
                style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
            >
                {renderMedia(leftImage, "Before")}
                <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 text-white text-[10px] font-bold uppercase tracking-wider rounded-sm">{leftLabel}</div>
            </div>
            
            {/* Slider Handle */}
            <div 
                className="absolute top-0 bottom-0 w-1 bg-white cursor-pointer opacity-75 group-hover:opacity-100 transition-opacity"
                style={{ left: `calc(${sliderPos}% - 2px)` }}
            >
                <div 
                    className="absolute top-1/2 -translate-y-1/2 -ml-5 h-10 w-10 bg-white rounded-full shadow-lg border-2 border-gray-300 flex items-center justify-center"
                    onMouseDown={handleMouseDown}
                    onTouchStart={handleMouseDown}
                >
                    <Move className="w-4 h-4 text-gray-600" />
                </div>
            </div>
        </div>
        {caption && (
            <figcaption className="mt-3 px-6 md:px-0 text-xs text-gray-500 font-mono font-medium text-center uppercase tracking-wider">
                {caption}
            </figcaption>
        )}
    </figure>
  );
};

export default BeforeAfter;
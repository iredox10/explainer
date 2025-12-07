import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronsLeftRight } from 'lucide-react';

export default function BeforeAfter({ leftImage, rightImage, leftLabel = "Before", rightLabel = "After", caption }) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  const handleMouseMove = (event) => {
    if (!containerRef.current) return;
    const { left, width } = containerRef.current.getBoundingClientRect();
    const position = ((event.clientX - left) / width) * 100;
    setSliderPosition(Math.min(100, Math.max(0, position)));
  };

  const handleTouchMove = (event) => {
    if (!containerRef.current) return;
    const { left, width } = containerRef.current.getBoundingClientRect();
    const position = ((event.touches[0].clientX - left) / width) * 100;
    setSliderPosition(Math.min(100, Math.max(0, position)));
  };

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    }
    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging]);

  // Allow clicking on the track to jump
  const handleClick = (event) => {
      if (!containerRef.current) return;
      const { left, width } = containerRef.current.getBoundingClientRect();
      const position = ((event.clientX - left) / width) * 100;
      setSliderPosition(Math.min(100, Math.max(0, position)));
  }

  return (
    <figure className="my-16 -mx-6 md:-mx-12 lg:-mx-24 select-none group">
      <div 
        ref={containerRef}
        className="relative w-full aspect-[3/2] md:aspect-[21/9] overflow-hidden cursor-col-resize"
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
        onClick={handleClick}
      >
        {/* Right Image (Background - "After") */}
        <img
          src={rightImage}
          alt="After"
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
        <div className="absolute top-4 right-4 bg-black/50 backdrop-blur text-white text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-sm pointer-events-none">
            {rightLabel}
        </div>

        {/* Left Image (Foreground - "Before") - Clipped */}
        <div
          className="absolute inset-0 w-full h-full overflow-hidden"
          style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}
        >
          <img
            src={leftImage}
            alt="Before"
            className="absolute inset-0 w-full h-full object-cover"
            draggable={false}
          />
           <div className="absolute top-4 left-4 bg-black/50 backdrop-blur text-white text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-sm pointer-events-none">
                {leftLabel}
           </div>
        </div>

        {/* Slider Handle */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-yellow-400 cursor-col-resize z-10 shadow-[0_0_10px_rgba(0,0,0,0.5)]"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center shadow-xl transform transition-transform hover:scale-110 active:scale-95">
            <ChevronsLeftRight className="w-5 h-5 text-black" />
          </div>
        </div>
      </div>

      {caption && (
        <figcaption className="mt-4 text-xs text-gray-500 font-mono font-medium text-center uppercase tracking-wider flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></span>
            {caption}
        </figcaption>
      )}
    </figure>
  );
}

import React, { useState, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PersistentAudioPlayer() {
  const [isVisible, setIsVisible] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(35); // Mock progress
  const audioRef = useRef(null);

  const togglePlay = () => setIsPlaying(!isPlaying);
  const toggleMute = () => setIsMuted(!isMuted);
  const closePlayer = () => setIsVisible(false);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="fixed bottom-0 left-0 right-0 z-[100] border-t border-gray-200 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.1)] px-4 py-3 md:px-6 md:py-4"
      >
        <div className="mx-auto max-w-7xl flex items-center justify-between gap-4 md:gap-8">
          
          {/* Track Info */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-sm overflow-hidden bg-gray-900 shrink-0 group cursor-pointer">
               <div className={`absolute inset-0 flex items-center justify-center bg-black/40 ${isPlaying ? 'opacity-0' : 'opacity-100'} group-hover:opacity-100 transition-opacity`}>
                  <Play className="w-4 h-4 text-white fill-current" />
               </div>
               {/* Animated bars when playing */}
               <div className={`absolute inset-0 flex items-end justify-center gap-0.5 pb-2 ${isPlaying ? 'opacity-100' : 'opacity-0'} transition-opacity`}>
                  <div className="w-1 bg-[#FAFF00] animate-[bounce_1s_infinite] h-3"></div>
                  <div className="w-1 bg-[#FAFF00] animate-[bounce_1.2s_infinite] h-5"></div>
                  <div className="w-1 bg-[#FAFF00] animate-[bounce_0.8s_infinite] h-2"></div>
               </div>
               <img src="https://images.unsplash.com/photo-1544197150-b99a580bbcbf?w=100" className="w-full h-full object-cover" alt="Cover" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-black uppercase tracking-widest text-yellow-600 mb-0.5">Now Listening</div>
              <h4 className="font-bold text-sm text-black truncate leading-tight">The Invisible Network That Runs Lagos</h4>
              <p className="text-xs text-gray-500 truncate hidden sm:block">Narrated by Chioma Okereke • 12 min</p>
            </div>
          </div>

          {/* Controls (Desktop) */}
          <div className="hidden md:flex items-center gap-6 flex-1 justify-center">
             <button className="text-gray-400 hover:text-black transition-colors"><SkipBack className="w-5 h-5" /></button>
             <button 
               onClick={togglePlay}
               className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center hover:scale-105 hover:bg-[#FAFF00] hover:text-black transition-all shadow-lg"
             >
               {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current pl-0.5" />}
             </button>
             <button className="text-gray-400 hover:text-black transition-colors"><SkipForward className="w-5 h-5" /></button>
          </div>

          {/* Progress & Volume & Close */}
          <div className="flex items-center gap-4 md:gap-6 flex-1 justify-end">
             {/* Progress Bar (Visual Only for prototype) */}
             <div className="hidden md:flex items-center gap-3 w-full max-w-[200px]">
                <span className="text-[10px] font-mono text-gray-400 tabular-nums">04:12</span>
                <div className="h-1 bg-gray-200 rounded-full flex-1 overflow-hidden relative group cursor-pointer">
                   <div className="absolute inset-0 bg-gray-300 w-full h-full"></div>
                   <div style={{ width: `${progress}%` }} className="absolute top-0 left-0 h-full bg-black group-hover:bg-[#FAFF00]"></div>
                </div>
                <span className="text-[10px] font-mono text-gray-400 tabular-nums">12:00</span>
             </div>

             <button onClick={toggleMute} className="text-gray-400 hover:text-black transition-colors hidden sm:block">
               {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
             </button>
             
             <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>
             
             <button onClick={closePlayer} className="text-gray-400 hover:text-red-500 transition-colors">
               <X className="w-5 h-5" />
             </button>
          </div>

        </div>
        
        {/* Mobile Progress Bar (Bottom) */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-100 md:hidden">
           <div style={{ width: `${progress}%` }} className="h-full bg-[#FAFF00]"></div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

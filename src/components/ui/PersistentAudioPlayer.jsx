import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, X, ChevronDown, Settings2, Headphones } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PersistentAudioPlayer({ text, title }) {
  const [isVisible, setIsVisible] = useState(true);
  const [isMinimized, setIsMinimized] = useState(true); // Default to minimized
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSettings, setShowSettings] = useState(false);

  const utteranceRef = useRef(null);
  const [isActuallyPaused, setIsActuallyPaused] = useState(false);
  const [lastCharIndex, setLastCharIndex] = useState(0);

  useEffect(() => {
    const synth = window.speechSynthesis;
    return () => {
      synth.cancel();
    };
  }, []);

  const togglePlay = () => {
    if (!text) return;

    if (isPlaying) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
      setIsActuallyPaused(true);
    } else {
      if (isActuallyPaused && utteranceRef.current) {
        window.speechSynthesis.resume();
        setIsActuallyPaused(false);
        setIsPlaying(true);
      } else {
        playNarration(lastCharIndex);
      }
    }
  };

  const playNarration = (startIndex = 0) => {
    window.speechSynthesis.cancel();

    const cleanText = text.replace(/\[.*?\]/g, '');
    const remainingText = cleanText.substring(startIndex);
    const utterance = new SpeechSynthesisUtterance(remainingText);

    const allVoices = window.speechSynthesis.getVoices();
    const voice = allVoices.find(v => v.lang.startsWith('en-US') && v.name.includes('Google')) || allVoices.find(v => v.lang.startsWith('en'));

    if (voice) utterance.voice = voice;
    utterance.rate = playbackSpeed;

    utterance.onboundary = (event) => {
      const charIndex = startIndex + event.charIndex;
      const totalChars = cleanText.length;
      setLastCharIndex(charIndex);
      setProgress((charIndex / totalChars) * 100);
    };

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsActuallyPaused(false);
    };

    utterance.onend = () => {
      if (!isActuallyPaused) {
        setIsPlaying(false);
        setIsActuallyPaused(false);
        setProgress(100);
        setLastCharIndex(0);
        setTimeout(() => setProgress(0), 1000);
      }
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const closePlayer = () => {
    window.speechSynthesis.cancel();
    setIsVisible(false);
  };

  if (!isVisible || !text) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] pointer-events-none px-4 pb-4 md:px-8 md:pb-8">
      <div className="max-w-7xl mx-auto flex justify-end items-end flex-col gap-3">
        
        {/* Floating Mini Player / Trigger */}
        <AnimatePresence>
          {isMinimized && (
            <motion.button
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={() => setIsMinimized(false)}
              className="pointer-events-auto bg-black text-[#FAFF00] w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center shadow-2xl border border-white/10 hover:scale-110 transition-transform relative group"
            >
              <Headphones className="w-5 h-5 md:w-6 md:h-6" />
              {isPlaying && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#FAFF00] rounded-full border-2 border-black animate-pulse" />
              )}
              {/* Progress Ring */}
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="50%" cy="50%" r="45%"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray="283"
                  strokeDashoffset={283 - (283 * progress) / 100}
                  className="text-[#FAFF00] opacity-40"
                />
              </svg>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Expanded Minimal Player */}
        <AnimatePresence>
          {!isMinimized && (
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="pointer-events-auto w-full max-w-sm bg-black text-white rounded-2xl md:rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden"
            >
              {/* Progress Bar (Top) */}
              <div className="h-1 bg-white/10 w-full overflow-hidden relative">
                <motion.div 
                  style={{ width: `${progress}%` }} 
                  className="absolute top-0 left-0 h-full bg-[#FAFF00] shadow-[0_0_10px_#FAFF00]"
                />
              </div>

              <div className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#FAFF00] mb-1 block">Listen to Discovery</span>
                    <h4 className="text-sm font-bold truncate tracking-tight">{title}</h4>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setIsMinimized(true)} className="p-2 text-gray-400 hover:text-white transition-colors">
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button onClick={closePlayer} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => playNarration(0)}
                      className="p-2 text-gray-400 hover:text-[#FAFF00] transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={togglePlay}
                      className="w-12 h-12 rounded-full bg-[#FAFF00] text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
                    >
                      {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                    </button>

                    <div className="relative">
                      <button 
                        onClick={() => setShowSettings(!showSettings)}
                        className={`p-2 rounded-lg transition-colors ${showSettings ? 'bg-white/10 text-[#FAFF00]' : 'text-gray-400 hover:text-white'}`}
                      >
                        <Settings2 className="w-4 h-4" />
                      </button>
                      
                      {showSettings && (
                        <div className="absolute bottom-full left-0 mb-4 bg-gray-900 border border-white/10 rounded-xl p-3 w-40 shadow-2xl z-10">
                          <span className="text-[8px] font-black uppercase tracking-widest text-gray-500 block mb-2">Speed</span>
                          <div className="grid grid-cols-3 gap-1">
                            {[1, 1.25, 1.5].map(s => (
                              <button
                                key={s}
                                onClick={() => { setPlaybackSpeed(s); if(isPlaying) playNarration(lastCharIndex); }}
                                className={`py-1.5 text-[10px] font-bold rounded ${playbackSpeed === s ? 'bg-[#FAFF00] text-black' : 'bg-white/5 text-white'}`}
                              >
                                {s}x
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-[10px] font-mono text-[#FAFF00]/60 font-bold">
                    {Math.round(progress)}%
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

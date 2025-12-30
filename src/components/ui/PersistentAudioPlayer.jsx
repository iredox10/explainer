import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, RotateCcw, X, ChevronUp, ChevronDown, Gauge, Music, Settings2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PersistentAudioPlayer({ text, title }) {
  const [isVisible, setIsVisible] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  const utteranceRef = useRef(null);
  const [isActuallyPaused, setIsActuallyPaused] = useState(false);
  const [lastCharIndex, setLastCharIndex] = useState(0);

  useEffect(() => {
    const synth = window.speechSynthesis;
    const loadVoices = () => {
      const availableVoices = synth.getVoices();
      setVoices(availableVoices.filter(v => v.lang.startsWith('en')));

      const preferredVoice = availableVoices.find(v => v.lang === 'en-US' && (v.name.includes('Google') || v.name.includes('Premium')))
        || availableVoices.find(v => v.lang.startsWith('en'));

      if (preferredVoice) setSelectedVoice(preferredVoice.name);
    };

    if (synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = loadVoices;
    }
    loadVoices();

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
    const voice = allVoices.find(v => v.name === selectedVoice) || allVoices.find(v => v.lang.startsWith('en'));

    if (voice) utterance.voice = voice;
    utterance.rate = playbackSpeed;
    utterance.pitch = pitch;

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

  const updateSpeed = (speed) => {
    setPlaybackSpeed(speed);
    if (isPlaying) {
      playNarration(lastCharIndex); // Restart with new speed from current index
    }
  };

  const reset = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsActuallyPaused(false);
    setProgress(0);
    setLastCharIndex(0);
  };

  const closePlayer = () => {
    window.speechSynthesis.cancel();
    setIsVisible(false);
  };

  if (!isVisible || !text) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100]">
      {/* Toggle Badge */}
      <div className="max-w-7xl mx-auto px-6 flex justify-end">
        <motion.button
          initial={{ y: 20 }}
          animate={{ y: isMinimized ? 0 : 20 }}
          onClick={() => setIsMinimized(!isMinimized)}
          className="bg-black text-[#FAFF00] px-4 py-2 rounded-t-lg flex items-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-2xl border-x border-t border-white/10 z-10"
        >
          {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {isPlaying ? 'Now Playing' : 'Discovery Audio'}
        </motion.button>
      </div>

      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="border-t border-gray-200 bg-white/98 backdrop-blur-xl shadow-[0_-10px_40px_rgba(0,0,0,0.15)] px-4 py-3 md:px-8 md:py-6"
          >
            <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-6">

              {/* Left Side: Track Info */}
              <div className="flex items-center gap-5 flex-1 min-w-0">
                <div className="relative w-12 h-12 md:w-16 md:h-16 rounded-sm overflow-hidden bg-black shrink-0 group cursor-pointer shadow-xl" onClick={togglePlay}>
                  <div className={`absolute inset-0 flex items-center justify-center bg-black/40 ${isPlaying ? 'opacity-0' : 'opacity-100'} group-hover:opacity-100 transition-opacity z-10`}>
                    <Play className="w-5 h-5 text-white fill-current" />
                  </div>
                  <div className={`absolute inset-0 flex items-end justify-center gap-1 pb-3 ${isPlaying ? 'opacity-100' : 'opacity-0'} transition-opacity z-20`}>
                    <div className="w-1 bg-[#FAFF00] animate-[bounce_1s_infinite] h-4"></div>
                    <div className="w-1 bg-[#FAFF00] animate-[bounce_1.2s_infinite] h-8"></div>
                    <div className="w-1 bg-[#FAFF00] animate-[bounce_0.8s_infinite] h-3"></div>
                  </div>
                  <img src="https://api.dicebear.com/7.x/shapes/svg?seed=explainer-audio" className="w-full h-full object-cover opacity-60" alt="Cover" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#FAFF00] bg-black px-2 py-0.5 rounded shadow-sm">
                      {isPlaying ? 'Surveillance Active' : 'Standby'}
                    </span>
                    {playbackSpeed !== 1 && (
                      <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 rounded">{playbackSpeed}x Speed</span>
                    )}
                  </div>
                  <h4 className="font-serif-display font-black text-lg text-black truncate leading-none tracking-tight mb-1">{title}</h4>
                  <p className="text-[10px] text-gray-500 truncate font-bold uppercase tracking-tighter opacity-70">Resemble AI Chatterbox Turbo • Investigative Feed</p>
                </div>
              </div>

              {/* Center: Playback & Speed Controls */}
              <div className="flex flex-col items-center gap-4 flex-1">
                <div className="flex items-center gap-8">
                  <button onClick={reset} className="text-gray-300 hover:text-black transition-colors" title="Restart Dispatch">
                    <RotateCcw className="w-5 h-5" />
                  </button>

                  <button
                    onClick={togglePlay}
                    className="w-14 h-14 rounded-full bg-black text-white flex items-center justify-center hover:scale-110 hover:bg-[#FAFF00] hover:text-black transition-all shadow-2xl active:scale-95"
                  >
                    {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current pl-1" />}
                  </button>

                  <div className="relative group">
                    <button
                      className={`p-2 rounded-full transition-colors ${showSettings ? 'bg-gray-100 text-black' : 'text-gray-300 hover:text-black'}`}
                      onClick={() => setShowSettings(!showSettings)}
                    >
                      <Settings2 className="w-5 h-5" />
                    </button>

                    {showSettings && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 bg-white border border-gray-100 shadow-2xl rounded-xl p-4 w-64 z-[110]">
                        <h5 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 border-b pb-2">Audio Engineering</h5>

                        <div className="space-y-6">
                          {/* Speed Controller */}
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <Gauge className="w-3.5 h-3.5 text-black" />
                              <span className="text-[10px] font-black uppercase tracking-widest">Rate: {playbackSpeed}x</span>
                            </div>
                            <div className="flex gap-2">
                              {[0.75, 1, 1.25, 1.5, 2].map(s => (
                                <button
                                  key={s}
                                  onClick={() => updateSpeed(s)}
                                  className={`flex-1 py-1 text-[10px] font-bold rounded transition-all ${playbackSpeed === s ? 'bg-black text-[#FAFF00]' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                                >
                                  {s}x
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Pitch Controller */}
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <Music className="w-3.5 h-3.5 text-black" />
                              <span className="text-[10px] font-black uppercase tracking-widest">Pitch: {pitch === 1 ? 'Natural' : pitch > 1 ? 'High' : 'Deep'}</span>
                            </div>
                            <input
                              type="range" min="0.5" max="2" step="0.1"
                              value={pitch}
                              onChange={(e) => {
                                setPitch(parseFloat(e.target.value));
                                if (isPlaying) playNarration(lastCharIndex);
                              }}
                              className="w-full accent-black"
                            />
                          </div>

                          {/* Voice Selector */}
                          {voices.length > 0 && (
                            <div>
                              <span className="text-[10px] font-black uppercase tracking-widest mb-2 block">Surveillance Voice</span>
                              <select
                                value={selectedVoice}
                                onChange={(e) => {
                                  setSelectedVoice(e.target.value);
                                  if (isPlaying) playNarration(lastCharIndex);
                                }}
                                className="w-full text-xs font-bold border-none bg-gray-50 rounded p-1.5 focus:ring-0"
                              >
                                {voices.slice(0, 5).map(v => (
                                  <option key={v.name} value={v.name}>{v.name.split(' - ')[0]}</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tracking Progress */}
                <div className="w-full flex items-center gap-3">
                  <span className="text-[10px] font-mono text-gray-400 tabular-nums">0%</span>
                  <div className="h-1 bg-gray-100 rounded-full flex-1 overflow-hidden relative group cursor-pointer" onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const percentage = x / rect.width;
                    const newIndex = Math.floor(text.length * percentage);
                    playNarration(newIndex);
                  }}>
                    <div style={{ width: `${progress}%` }} className="absolute top-0 left-0 h-full bg-black shadow-[0_0_10px_rgba(0,0,0,0.35)]"></div>
                  </div>
                  <span className="text-[10px] font-mono text-gray-400 tabular-nums">{Math.round(progress)}%</span>
                </div>
              </div>

              {/* Right Side: Special Features & Exit */}
              <div className="flex items-center gap-6 flex-1 justify-end">

                <div className="h-10 w-px bg-gray-100 hidden md:block"></div>

                <button onClick={closePlayer} className="text-gray-300 hover:text-red-500 transition-colors p-2" title="Terminate Feed">
                  <X className="w-6 h-6" />
                </button>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

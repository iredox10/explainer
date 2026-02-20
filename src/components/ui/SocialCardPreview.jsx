import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Share2, Download, ArrowRight, Check, Loader2, Sparkles, Zap, ShieldCheck } from 'lucide-react';
import { toPng } from 'html-to-image';
import { analytics } from '../../lib/telemetry.js';

export default function SocialCardPreview({ article }) {
  const cardRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);

  if (!article) {
    console.error("SocialCardPreview: No article data provided");
    return null;
  }

  const {
    headline = "The Future of Visual Journalism",
    subhead = "How immersive storytelling is changing the way we consume news.",
    author = "Explainer Team",
    category = "Explainer",
    heroImage = "https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=2070&auto=format&fit=crop",
    date = "Feb 16, 2026",
  } = article;

  // Safe read time calculation
  const readTime = article.readTime || "10 min";

  const handleDownload = async () => {
    if (!cardRef.current || isGenerating) return;

    try {
      setIsGenerating(true);
      analytics.track('social_card_download_start', { headline });

      await new Promise(resolve => setTimeout(resolve, 300));

      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        backgroundColor: '#000',
        pixelRatio: 2, // Reverting to 2 for stability
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
        }
      });

      const link = document.createElement('a');
      link.download = `explainer-square-${article.slug || 'story'}.png`;
      link.href = dataUrl;
      link.click();

      setIsDownloaded(true);
      analytics.track('social_card_download_success', { headline });
      setTimeout(() => setIsDownloaded(false), 3000);
    } catch (err) {
      console.error('Failed to generate image:', err);
      analytics.track('social_card_download_error', { headline, error: err.message });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: headline,
          text: subhead,
          url: window.location.href,
        });
        analytics.track('social_card_web_share', { headline });
      } catch (err) {
        console.log('Share failed:', err);
      }
    }
  };

  return (
    <div className="flex flex-col gap-12 my-24 bg-white p-8 md:p-20 border-y border-neutral-100 relative overflow-hidden group/outer text-black">
      {/* Editorial Decorative Background */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-[0.03] overflow-hidden">
        <span className="text-[30rem] font-serif absolute -top-40 -left-20 leading-none font-black">SQ</span>
      </div>
      
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-12 relative z-10">
        <div className="max-w-2xl text-left">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-[#FAFF00] border-2 border-white"><Zap className="w-4 h-4" /></div>
                <div className="w-8 h-8 rounded-full bg-[#FAFF00] flex items-center justify-center text-black border-2 border-white"><Sparkles className="w-4 h-4" /></div>
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-neutral-400">Social Grid Optimization</span>
          </div>
          
          <h3 className="text-5xl md:text-6xl font-serif font-black text-black leading-[0.9] tracking-tighter mb-6">
            Square Format, <br /><span className="text-[#FAFF00] bg-black px-4 inline-block">Absolute Impact.</span>
          </h3>
          
          <p className="text-neutral-500 text-xl font-serif leading-relaxed italic">
            Optimized for Instagram and mobile feeds. A 1:1 masterpiece designed to command the scroll.
          </p>
        </div>
        
        <div className="flex flex-col gap-4 min-w-[240px]">
            <button 
              onClick={handleShare}
              className="group flex items-center justify-between gap-4 px-8 py-5 bg-black text-white text-[10px] font-black uppercase tracking-[0.3em] hover:bg-[#FAFF00] hover:text-black transition-all shadow-2xl"
            >
                Direct Share
                <Share2 className="w-4 h-4 group-hover:rotate-12 transition-transform" />
            </button>
            <button 
              onClick={handleDownload}
              disabled={isGenerating}
              className={`group flex items-center justify-between gap-4 px-8 py-5 border-2 transition-all text-[10px] font-black uppercase tracking-[0.3em] ${
                isDownloaded 
                  ? 'bg-green-600 border-green-600 text-white' 
                  : 'bg-white border-black text-black hover:bg-black hover:text-white'
              }`}
            >
                {isGenerating ? 'Rendering...' : isDownloaded ? 'Stored' : 'Download Square'}
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : isDownloaded ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
            </button>
        </div>
      </div>

      {/* --- THE MASTERPIECE CARD (1:1 ASPECT RATIO) --- */}
      <div className="relative mx-auto w-full max-w-[600px] z-20">
        <div ref={cardRef} className="bg-black">
          <div className="relative aspect-square w-full overflow-hidden">
            {/* Background Composition */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-neutral-900"></div>
                {heroImage && (
                  <img 
                      src={heroImage} 
                      alt="" 
                      crossOrigin="anonymous"
                      className="w-full h-full object-cover opacity-60 scale-110"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/90"></div>
                
                {/* Visual Flourish: Glass Grid */}
                <div className="absolute top-0 right-[20%] w-px h-full bg-white/10"></div>
                <div className="absolute top-[20%] left-0 w-full h-px bg-white/10"></div>
            </div>

            {/* Editorial Content Grid */}
            <div className="absolute inset-0 z-10 p-10 md:p-12 flex flex-col justify-between text-white">
                
                {/* Header: Branding */}
                <div className="flex justify-between items-start w-full">
                    <div className="bg-[#FAFF00] text-black px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em]">
                        {category}
                    </div>
                    
                    <div className="flex flex-col items-end">
                        <div className="text-white font-serif font-black text-2xl leading-none tracking-tighter">
                            Exp<span className="text-[#FAFF00]">.</span>
                        </div>
                    </div>
                </div>

                {/* Center: Main Story */}
                <div className="relative py-10 text-left w-full">
                    <div className="absolute -left-6 -top-12 text-white/5 text-[15rem] font-serif font-black select-none pointer-events-none">
                        {headline?.charAt(0)}
                    </div>
                    
                    <div className="relative z-10">
                        <div className="text-white/40 text-[9px] font-black uppercase tracking-[0.4em] mb-4 flex items-center gap-2">
                            <span>{date}</span>
                            <span className="w-4 h-px bg-white/20"></span>
                            <span>{readTime} Read</span>
                        </div>
                        
                        <h4 className="font-serif text-4xl md:text-5xl font-black text-white leading-[0.9] tracking-tighter mb-8 text-pretty">
                            {headline}
                        </h4>
                        
                        <div className="flex items-start gap-6">
                            <div className="w-1 h-16 bg-[#FAFF00] flex-shrink-0"></div>
                            <p className="text-white/60 text-sm font-serif leading-relaxed italic line-clamp-3">
                                {subhead}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer: Credit & Action */}
                <div className="space-y-8 w-full">
                    <div className="h-px w-full bg-white/10"></div>
                    
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#FAFF00] bg-neutral-800">
                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${author}`} crossOrigin="anonymous" className="w-full h-full object-cover" />
                                </div>
                                <div className="absolute -bottom-1 -right-1 bg-[#FAFF00] text-black rounded-full p-0.5">
                                    <ShieldCheck className="w-3 h-3" />
                                </div>
                            </div>
                            <div className="flex flex-col text-left">
                                <span className="text-white font-black text-[9px] uppercase tracking-[0.2em]">{author}</span>
                                <span className="text-white/30 text-[7px] font-black uppercase tracking-[0.3em]">Verified Reporter</span>
                            </div>
                        </div>
                        
                        <div className="bg-white text-black px-5 py-3 flex items-center gap-3">
                            <span className="text-[8px] font-black uppercase tracking-[0.3em]">Read Report</span>
                            <ArrowRight className="w-3 h-3" />
                        </div>
                    </div>
                </div>
                
                {/* Tech Overlays */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.08] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
                <div className="absolute top-8 left-8 w-4 h-4 border-t border-l border-[#FAFF00]/40"></div>
                <div className="absolute bottom-8 right-8 w-4 h-4 border-b border-r border-[#FAFF00]/40"></div>
                <div className="absolute bottom-8 left-8 text-[6px] font-mono text-white/20 tracking-widest uppercase">Explainer Africa Prototype V2.0</div>
            </div>
          </div>
        </div>
        
        <div className="absolute -inset-4 bg-black/30 blur-2xl -z-10 rounded-full scale-90 translate-y-10 opacity-40"></div>
      </div>

      {/* Tech Specifications Grid */}
      <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12 mt-8">
         {[
           { label: "Format", value: "1:1 Square Grid", icon: Zap },
           { label: "Resolution", value: "1080 × 1080 PX", icon: Sparkles },
           { label: "Optimization", value: "Feed + Status", icon: ShieldCheck },
           { label: "Rendering", value: "3.0X Super-Res", icon: Zap }
         ].map((spec, i) => (
           <div key={i} className="flex flex-col items-center text-center group/spec">
             <div className="w-10 h-10 rounded-full border border-neutral-100 flex items-center justify-center mb-4 group-hover/spec:bg-[#FAFF00] group-hover/spec:border-[#FAFF00] transition-colors">
                <spec.icon className="w-4 h-4 text-neutral-300 group-hover/spec:text-black" />
             </div>
             <span className="text-[8px] font-black uppercase tracking-[0.4em] text-neutral-300 mb-1">{spec.label}</span>
             <span className="text-xs font-bold text-neutral-800">{spec.value}</span>
           </div>
         ))}
      </div>
    </div>
  );
}

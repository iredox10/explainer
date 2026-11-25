import { useRef, useState } from 'react';
import { Share2, Download, ArrowRight, Check, Loader2, Sparkles, Zap, ShieldCheck, Copy, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { toPng } from 'html-to-image';
import { analytics } from '../../lib/telemetry.js';

export default function SocialCardPreview({ article }) {
    const cardRef = useRef(null);
    const [format, setFormat] = useState('portrait'); // 'portrait' (4:5 BBC-style News Banner) | 'square' (1:1)
    const [customHeadline, setCustomHeadline] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedUrl, setGeneratedUrl] = useState('');
    const [isDownloaded, setIsDownloaded] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    if (!article) {
        return null;
    }

    const {
        headline = 'The Future of Visual Journalism',
        subhead = 'How immersive storytelling is changing the way we consume news.',
        author = 'Explainer Team',
        category = 'Explainer',
        heroImage = '/social-preview.jpg',
        date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        slug = ''
    } = article;

    const displayHeadline = customHeadline.trim() || headline;
    const readTime = article.readTime || '5 min';
    const shareUrl = typeof window !== 'undefined' && slug
        ? `${window.location.origin}/article/${slug}`
        : (typeof window !== 'undefined' ? window.location.href : 'https://explainer.africa');

    const renderBannerPng = async () => {
        if (!cardRef.current) return null;
        setErrorMsg('');
        await new Promise((resolve) => setTimeout(resolve, 150));

        return toPng(cardRef.current, {
            cacheBust: true,
            backgroundColor: '#050505',
            pixelRatio: 2,
            style: {
                transform: 'scale(1)',
                transformOrigin: 'top left',
            },
        });
    };

    const handleGenerateAndDownload = async () => {
        if (!cardRef.current || isGenerating) return;

        try {
            setIsGenerating(true);
            analytics.track('social_card_download_start', { headline: displayHeadline, format });

            const dataUrl = await renderBannerPng();
            if (!dataUrl) throw new Error('Could not render banner');

            setGeneratedUrl(dataUrl);

            const link = document.createElement('a');
            link.download = `explainer-${format}-${slug || 'story'}.png`;
            link.href = dataUrl;
            link.click();

            setIsDownloaded(true);
            analytics.track('social_card_download_success', { headline: displayHeadline, format });
            setTimeout(() => setIsDownloaded(false), 3000);
        } catch (err) {
            console.error('Failed to generate banner:', err);
            setErrorMsg('Could not export image (external photo may block CORS). Try uploading the hero image locally.');
            analytics.track('social_card_download_error', { headline: displayHeadline, error: err.message });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleShare = async () => {
        if (isGenerating) return;
        try {
            setIsGenerating(true);
            let dataUrl = generatedUrl;
            if (!dataUrl) {
                dataUrl = await renderBannerPng();
                if (dataUrl) setGeneratedUrl(dataUrl);
            }

            if (typeof navigator !== 'undefined' && navigator.share) {
                if (dataUrl) {
                    const res = await fetch(dataUrl);
                    const blob = await res.blob();
                    const file = new File([blob], `explainer-${slug || 'news'}.png`, { type: 'image/png' });
                    if (navigator.canShare && navigator.canShare({ files: [file] })) {
                        await navigator.share({
                            title: displayHeadline,
                            text: `${displayHeadline} — ${subhead}`,
                            url: shareUrl,
                            files: [file],
                        });
                        analytics.track('social_card_web_share', { headline: displayHeadline, withFile: true });
                        return;
                    }
                }

                await navigator.share({
                    title: displayHeadline,
                    text: `${displayHeadline} — ${subhead}`,
                    url: shareUrl,
                });
                analytics.track('social_card_web_share', { headline: displayHeadline, withFile: false });
                return;
            }

            await handleCopyLink();
        } catch (err) {
            if (err?.name !== 'AbortError') {
                console.error('Share failed:', err);
                await handleCopyLink();
            }
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(`${displayHeadline}\n${shareUrl}`);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2500);
        } catch {
            setErrorMsg('Unable to copy link automatically.');
        }
    };

    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedText = encodeURIComponent(displayHeadline);
    const safeHero = heroImage || '/social-preview.jpg';

    return (
        <div className="flex flex-col gap-10 bg-white p-6 md:p-12 relative overflow-hidden text-black">
            {/* Header & Controls */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 relative z-10 border-b border-gray-100 pb-8">
                <div className="max-w-2xl text-left">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-black text-[#FAFF00] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.25em] flex items-center gap-1.5">
                            <Zap className="w-3 h-3 fill-[#FAFF00]" />
                            Newsroom Studio
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.35em] text-neutral-400">Social Banner Generator</span>
                    </div>

                    <h3 className="text-3xl md:text-5xl font-serif font-black text-black leading-[0.95] tracking-tighter mb-3">
                        Shareable <span className="bg-[#FAFF00] px-2 inline-block">News Banner.</span>
                    </h3>

                    <p className="text-neutral-500 text-sm md:text-base font-medium">
                        Generate a high-contrast editorial banner in Explainer colors and share directly to social feeds.
                    </p>
                </div>

                {/* Format Switcher */}
                <div className="flex items-center gap-2 bg-gray-100 p-1.5 rounded-2xl self-start lg:self-end">
                    <button
                        type="button"
                        onClick={() => { setFormat('portrait'); setGeneratedUrl(''); }}
                        className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${format === 'portrait' ? 'bg-black text-[#FAFF00] shadow-md' : 'text-gray-500 hover:text-black'}`}
                    >
                        News Banner (4:5)
                    </button>
                    <button
                        type="button"
                        onClick={() => { setFormat('square'); setGeneratedUrl(''); }}
                        className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${format === 'square' ? 'bg-black text-[#FAFF00] shadow-md' : 'text-gray-500 hover:text-black'}`}
                    >
                        Square Card (1:1)
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                {/* Left: Live Banner Canvas */}
                <div className="lg:col-span-7 flex flex-col items-center">
                    <div className={`relative w-full ${format === 'portrait' ? 'max-w-[460px]' : 'max-w-[540px]'} shadow-[0_30px_60px_rgba(0,0,0,0.22)]`}>
                        <div ref={cardRef} className="bg-[#050505]">
                            {format === 'portrait' ? (
                                /* --- 4:5 EDITORIAL NEWS BANNER (BBC-INSPIRED, EXPLAINER COLORS) --- */
                                <div
                                    className="relative aspect-[4/5] w-full overflow-hidden bg-[#050505] select-none"
                                    style={{ aspectRatio: '4 / 5' }}
                                >
                                    {/* Full-bleed Photo */}
                                    <img
                                        src={safeHero}
                                        alt=""
                                        crossOrigin="anonymous"
                                        className="absolute inset-0 w-full h-full object-cover object-center"
                                    />

                                    {/* Top vignette for brand legibility + deep bottom gradient for headline */}
                                    <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-transparent h-36" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/75 to-transparent top-[32%]" />

                                    {/* Subtle yellow editorial side frame */}
                                    <div className="absolute top-0 left-0 w-1.5 h-full bg-[#FAFF00]" />

                                    {/* Content Overlay */}
                                    <div className="absolute inset-0 p-7 md:p-9 flex flex-col justify-between text-white">
                                        {/* Top Brand Header */}
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-2.5">
                                                <div className="flex gap-0.5">
                                                    {['E', 'X', 'P'].map((ch) => (
                                                        <span
                                                            key={ch}
                                                            className="w-6 h-6 bg-[#FAFF00] text-[#050505] font-black text-xs flex items-center justify-center tracking-tighter"
                                                        >
                                                            {ch}
                                                        </span>
                                                    ))}
                                                </div>
                                                <span className="text-[11px] font-black uppercase tracking-[0.22em] text-white drop-shadow">
                                                    EXPLAINER <span className="text-[#FAFF00]">AFRICA</span>
                                                </span>
                                            </div>

                                            <span className="bg-black/75 border border-[#FAFF00]/60 text-[#FAFF00] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.22em]">
                                                {category}
                                            </span>
                                        </div>

                                        {/* Bottom Headline & Editorial Strip */}
                                        <div className="space-y-4 text-left">
                                            <div className="flex items-center gap-2.5">
                                                <span className="w-8 h-1 bg-[#FAFF00] inline-block" />
                                                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#FAFF00]">
                                                    {date}
                                                </span>
                                            </div>

                                            <h4 className="font-serif-display text-3xl sm:text-4xl font-black text-white leading-[1.05] tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]">
                                                {displayHeadline}
                                            </h4>

                                            <div className="pt-3 border-t border-white/15 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-white/75">
                                                <span>By {author}</span>
                                                <span className="text-[#FAFF00] font-black">explainer.africa</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* --- 1:1 SQUARE CARD --- */
                                <div
                                    className="relative aspect-square w-full overflow-hidden bg-[#050505] select-none"
                                    style={{ aspectRatio: '1 / 1', minHeight: '420px' }}
                                >
                                    <div className="absolute inset-0 z-0">
                                        <div className="absolute inset-0 bg-neutral-900" />
                                        <img
                                            src={safeHero}
                                            alt=""
                                            crossOrigin="anonymous"
                                            className="w-full h-full object-cover opacity-60 scale-105"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/30 to-black/95" />
                                        <div className="absolute top-0 right-[20%] w-px h-full bg-white/10" />
                                        <div className="absolute top-[20%] left-0 w-full h-px bg-white/10" />
                                    </div>

                                    <div className="absolute inset-0 z-10 p-8 md:p-10 flex flex-col justify-between text-white">
                                        <div className="flex justify-between items-start w-full">
                                            <div className="bg-[#FAFF00] text-black px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em]">
                                                {category}
                                            </div>
                                            <div className="text-white font-serif font-black text-2xl leading-none tracking-tighter">
                                                Exp<span className="text-[#FAFF00]">.</span>
                                            </div>
                                        </div>

                                        <div className="relative py-6 text-left w-full">
                                            <div className="text-white/50 text-[9px] font-black uppercase tracking-[0.35em] mb-3 flex items-center gap-2">
                                                <span>{date}</span>
                                                <span className="w-4 h-px bg-white/20" />
                                                <span>{readTime} Read</span>
                                            </div>
                                            <h4 className="font-serif text-3xl md:text-4xl font-black text-white leading-[0.98] tracking-tight mb-5">
                                                {displayHeadline}
                                            </h4>
                                            <div className="flex items-start gap-4">
                                                <div className="w-1 h-12 bg-[#FAFF00] flex-shrink-0" />
                                                <p className="text-white/75 text-xs md:text-sm font-serif leading-relaxed italic line-clamp-2">
                                                    {subhead}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-4 w-full">
                                            <div className="h-px w-full bg-white/15" />
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-[#FAFF00] bg-neutral-800">
                                                        <img
                                                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(author)}`}
                                                            crossOrigin="anonymous"
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                    <div className="flex flex-col text-left">
                                                        <span className="text-white font-black text-[9px] uppercase tracking-[0.2em]">{author}</span>
                                                        <span className="text-white/40 text-[7px] font-black uppercase tracking-[0.3em]">explainer.africa</span>
                                                    </div>
                                                </div>
                                                <div className="bg-[#FAFF00] text-black px-4 py-2 flex items-center gap-2">
                                                    <span className="text-[8px] font-black uppercase tracking-[0.25em]">Read Report</span>
                                                    <ArrowRight className="w-3 h-3" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Customize, Generate & Share Controls */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 block">
                            Banner Headline Override (Optional)
                        </label>
                        <textarea
                            rows={3}
                            value={customHeadline}
                            onChange={(e) => { setCustomHeadline(e.target.value); setGeneratedUrl(''); }}
                            placeholder={headline}
                            className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm font-bold text-gray-900 focus:outline-none focus:border-black resize-none"
                        />
                        <p className="text-[10px] text-gray-400 font-medium">
                            Tweak the punchy social headline here without changing the published article.
                        </p>
                    </div>

                    {errorMsg && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700">
                            {errorMsg}
                        </div>
                    )}

                    <div className="flex flex-col gap-3">
                        <button
                            type="button"
                            onClick={handleGenerateAndDownload}
                            disabled={isGenerating}
                            className={`w-full flex items-center justify-between gap-4 px-6 py-4 rounded-2xl transition-all text-xs font-black uppercase tracking-[0.2em] shadow-lg ${
                                isDownloaded
                                    ? 'bg-green-600 text-white'
                                    : 'bg-[#FAFF00] text-black hover:bg-black hover:text-[#FAFF00]'
                            }`}
                        >
                            <span>{isGenerating ? 'Generating Banner...' : isDownloaded ? 'Banner Downloaded!' : 'Generate & Download PNG'}</span>
                            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : isDownloaded ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                        </button>

                        <button
                            type="button"
                            onClick={handleShare}
                            disabled={isGenerating}
                            className="w-full flex items-center justify-between gap-4 px-6 py-4 bg-black text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-gray-800 transition-all"
                        >
                            <span>Share Banner & News</span>
                            <Share2 className="w-4 h-4" />
                        </button>

                        <button
                            type="button"
                            onClick={handleCopyLink}
                            className="w-full flex items-center justify-between gap-4 px-6 py-3.5 bg-white border border-gray-200 text-black rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:border-black transition-all"
                        >
                            <span>{isCopied ? 'Headline & Link Copied!' : 'Copy Headline + Article Link'}</span>
                            {isCopied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-400" />}
                        </button>
                    </div>

                    {/* Direct Social Network Share Links */}
                    <div className="pt-4 border-t border-gray-100 space-y-3">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 block">
                            Post Directly To
                        </span>
                        <div className="grid grid-cols-3 gap-2">
                            <a
                                href={`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl bg-gray-100 hover:bg-black hover:text-white text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                                X / Twitter <ExternalLink className="w-3 h-3" />
                            </a>
                            <a
                                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl bg-gray-100 hover:bg-[#0A66C2] hover:text-white text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                                LinkedIn <ExternalLink className="w-3 h-3" />
                            </a>
                            <a
                                href={`https://wa.me/?text=${encodedText}%20${encodedUrl}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl bg-gray-100 hover:bg-[#25D366] hover:text-white text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                                WhatsApp <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

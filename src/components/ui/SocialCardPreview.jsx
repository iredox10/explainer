import { useRef, useState } from 'react';
import { Share2, Download, ArrowRight, Check, Loader2, Zap, Copy, ExternalLink } from 'lucide-react';
import { toPng } from 'html-to-image';
import { analytics } from '../../lib/telemetry.js';

const TEMPLATES = [
    { id: 'portrait', label: 'News Banner', ratioLabel: '4:5', ratio: '4 / 5', maxWidth: 'max-w-[440px]', minHeight: '500px' },
    { id: 'breaking', label: 'Breaking Alert', ratioLabel: '4:5', ratio: '4 / 5', maxWidth: 'max-w-[440px]', minHeight: '500px' },
    { id: 'square', label: 'Square Card', ratioLabel: '1:1', ratio: '1 / 1', maxWidth: 'max-w-[500px]', minHeight: '420px' },
    { id: 'quote', label: 'Quote / Insight', ratioLabel: '1:1', ratio: '1 / 1', maxWidth: 'max-w-[500px]', minHeight: '420px' },
    { id: 'story', label: 'Story / Status', ratioLabel: '9:16', ratio: '9 / 16', maxWidth: 'max-w-[340px]', minHeight: '540px' },
];

export default function SocialCardPreview({ article }) {
    const cardRef = useRef(null);
    const [format, setFormat] = useState('portrait');
    const [customHeadline, setCustomHeadline] = useState('');
    const [customKicker, setCustomKicker] = useState('');
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
        slug = '',
    } = article;

    const activeTemplate = TEMPLATES.find((t) => t.id === format) || TEMPLATES[0];
    const displayHeadline = customHeadline.trim() || headline;
    const displayKicker = customKicker.trim() || (format === 'breaking' ? 'DEVELOPING STORY' : category);
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
                    const file = new File([blob], `explainer-${format}-${slug || 'news'}.png`, { type: 'image/png' });
                    if (navigator.canShare && navigator.canShare({ files: [file] })) {
                        await navigator.share({
                            title: displayHeadline,
                            text: `${displayHeadline} — ${subhead}`,
                            url: shareUrl,
                            files: [file],
                        });
                        analytics.track('social_card_web_share', { headline: displayHeadline, withFile: true, format });
                        return;
                    }
                }

                await navigator.share({
                    title: displayHeadline,
                    text: `${displayHeadline} — ${subhead}`,
                    url: shareUrl,
                });
                analytics.track('social_card_web_share', { headline: displayHeadline, withFile: false, format });
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
    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(author)}`;

    return (
        <div className="flex flex-col gap-8 bg-white p-6 md:p-10 relative overflow-hidden text-black">
            {/* Header & Template Selector */}
            <div className="flex flex-col gap-6 relative z-10 border-b border-gray-100 pb-6">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                    <div className="max-w-2xl text-left">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="bg-black text-[#FAFF00] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.25em] flex items-center gap-1.5">
                                <Zap className="w-3 h-3 fill-[#FAFF00]" />
                                Newsroom Studio
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.35em] text-neutral-400">5 Editorial Formats</span>
                        </div>

                        <h3 className="text-3xl md:text-4xl font-serif font-black text-black leading-[0.95] tracking-tighter mb-2">
                            Shareable <span className="bg-[#FAFF00] px-2 inline-block">News Cards.</span>
                        </h3>

                        <p className="text-neutral-500 text-sm font-medium">
                            Pick a visual format, customize the headline or kicker, export PNG, and share directly.
                        </p>
                    </div>
                </div>

                {/* 5-Template Switcher */}
                <div className="flex flex-wrap items-center gap-2 bg-gray-100 p-1.5 rounded-2xl">
                    {TEMPLATES.map((tpl) => {
                        const active = format === tpl.id;
                        return (
                            <button
                                key={tpl.id}
                                type="button"
                                onClick={() => { setFormat(tpl.id); setGeneratedUrl(''); }}
                                className={`px-3.5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                                    active ? 'bg-black text-[#FAFF00] shadow-md' : 'text-gray-500 hover:text-black hover:bg-white/60'
                                }`}
                            >
                                <span>{tpl.label}</span>
                                <span className={`px-1.5 py-0.5 rounded text-[8px] ${active ? 'bg-[#FAFF00] text-black' : 'bg-gray-200 text-gray-600'}`}>
                                    {tpl.ratioLabel}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                {/* Left: Live Banner Canvas */}
                <div className="lg:col-span-7 flex flex-col items-center">
                    <div className={`relative w-full ${activeTemplate.maxWidth} shadow-[0_30px_60px_rgba(0,0,0,0.22)]`}>
                        <div ref={cardRef} className="bg-[#050505]">
                            {/* 1. NEWS BANNER (4:5) */}
                            {format === 'portrait' && (
                                <div
                                    className="relative w-full overflow-hidden bg-[#050505] select-none"
                                    style={{ aspectRatio: '4 / 5', minHeight: '500px' }}
                                >
                                    <img
                                        src={safeHero}
                                        alt=""
                                        crossOrigin="anonymous"
                                        className="absolute inset-0 w-full h-full object-cover object-center"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-transparent to-transparent h-36" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/75 to-transparent top-[32%]" />
                                    <div className="absolute top-0 left-0 w-1.5 h-full bg-[#FAFF00]" />

                                    <div className="absolute inset-0 p-7 md:p-9 flex flex-col justify-between text-white">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-2.5">
                                                <div className="flex gap-0.5">
                                                    {['E', 'X', 'P'].map((ch) => (
                                                        <span key={ch} className="w-6 h-6 bg-[#FAFF00] text-[#050505] font-black text-xs flex items-center justify-center tracking-tighter">
                                                            {ch}
                                                        </span>
                                                    ))}
                                                </div>
                                                <span className="text-[11px] font-black uppercase tracking-[0.22em] text-white drop-shadow">
                                                    EXPLAINER <span className="text-[#FAFF00]">AFRICA</span>
                                                </span>
                                            </div>
                                            <span className="bg-black/75 border border-[#FAFF00]/60 text-[#FAFF00] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.22em]">
                                                {displayKicker}
                                            </span>
                                        </div>

                                        <div className="space-y-4 text-left">
                                            <div className="flex items-center gap-2.5">
                                                <span className="w-8 h-1 bg-[#FAFF00] inline-block" />
                                                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#FAFF00]">{date}</span>
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
                            )}

                            {/* 2. BREAKING ALERT SPLIT-FRAME (4:5) */}
                            {format === 'breaking' && (
                                <div
                                    className="relative w-full overflow-hidden bg-[#FAFF00] text-[#050505] select-none flex flex-col"
                                    style={{ aspectRatio: '4 / 5', minHeight: '500px' }}
                                >
                                    {/* Top Breaking Bar */}
                                    <div className="bg-[#050505] text-white px-6 py-3.5 flex items-center justify-between shrink-0">
                                        <div className="flex items-center gap-2.5">
                                            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                                            <span className="text-[11px] font-black uppercase tracking-[0.28em] text-[#FAFF00]">
                                                {displayKicker}
                                            </span>
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-[0.22em] text-white/70">
                                            EXPLAINER
                                        </span>
                                    </div>

                                    {/* Framed Photo */}
                                    <div className="relative flex-1 bg-black overflow-hidden border-y-4 border-[#050505]">
                                        <img
                                            src={safeHero}
                                            alt=""
                                            crossOrigin="anonymous"
                                            className="w-full h-full object-cover object-center"
                                        />
                                        <div className="absolute bottom-3 left-5 bg-[#050505] text-[#FAFF00] px-3 py-1 text-[9px] font-black uppercase tracking-[0.25em]">
                                            {category}
                                        </div>
                                    </div>

                                    {/* Bold Vox Yellow Headline Block */}
                                    <div className="p-6 md:p-7 bg-[#FAFF00] text-[#050505] flex flex-col justify-between gap-4 shrink-0 text-left">
                                        <h4 className="font-serif-display text-2xl sm:text-3xl font-black leading-[1.02] tracking-tight text-[#050505]">
                                            {displayHeadline}
                                        </h4>
                                        <div className="pt-3 border-t-2 border-[#050505]/20 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.22em]">
                                            <span>{date} • {author}</span>
                                            <span className="bg-[#050505] text-[#FAFF00] px-2.5 py-1">explainer.africa</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 3. SQUARE CARD (1:1) */}
                            {format === 'square' && (
                                <div
                                    className="relative w-full overflow-hidden bg-[#050505] select-none"
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
                                                {displayKicker}
                                            </div>
                                            <div className="text-white font-serif font-black text-2xl leading-none tracking-tighter">
                                                Exp<span className="text-[#FAFF00]">.</span>
                                            </div>
                                        </div>

                                        <div className="relative py-4 text-left w-full">
                                            <div className="text-white/50 text-[9px] font-black uppercase tracking-[0.35em] mb-3 flex items-center gap-2">
                                                <span>{date}</span>
                                                <span className="w-4 h-px bg-white/20" />
                                                <span>{readTime} Read</span>
                                            </div>
                                            <h4 className="font-serif text-3xl md:text-4xl font-black text-white leading-[0.98] tracking-tight mb-4">
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
                                                        <img src={avatarUrl} crossOrigin="anonymous" className="w-full h-full object-cover" />
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

                            {/* 4. QUOTE / INSIGHT TYPOGRAPHIC CARD (1:1) */}
                            {format === 'quote' && (
                                <div
                                    className="relative w-full overflow-hidden bg-[#050505] text-white select-none flex flex-col justify-between p-8 md:p-10"
                                    style={{ aspectRatio: '1 / 1', minHeight: '420px' }}
                                >
                                    {/* Geometric Watermark & Top Yellow Rule */}
                                    <div className="absolute top-0 left-0 w-full h-2 bg-[#FAFF00]" />
                                    <div className="absolute -right-6 -top-10 text-[#FAFF00]/10 font-serif font-black text-[18rem] leading-none pointer-events-none">
                                        “
                                    </div>

                                    <div className="relative z-10 flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FAFF00]">
                                            {displayKicker}
                                        </span>
                                        <div className="flex gap-0.5">
                                            {['E', 'X', 'P'].map((ch) => (
                                                <span key={ch} className="w-5 h-5 bg-[#FAFF00] text-[#050505] font-black text-[10px] flex items-center justify-center">
                                                    {ch}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="relative z-10 text-left space-y-5 my-auto py-4">
                                        <div className="w-12 h-1.5 bg-[#FAFF00]" />
                                        <h4 className="font-serif-display text-3xl md:text-4xl font-black leading-[1.06] tracking-tight text-white">
                                            “{displayHeadline}”
                                        </h4>
                                        <p className="text-sm text-white/65 font-serif italic line-clamp-2">
                                            {subhead}
                                        </p>
                                    </div>

                                    <div className="relative z-10 pt-5 border-t border-white/15 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#FAFF00] bg-neutral-900">
                                                <img src={safeHero} crossOrigin="anonymous" className="w-full h-full object-cover" />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white">{author}</p>
                                                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/40">{date}</p>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[#FAFF00]">
                                            explainer.africa
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* 5. STORY / WHATSAPP STATUS (9:16) */}
                            {format === 'story' && (
                                <div
                                    className="relative w-full overflow-hidden bg-[#050505] text-white select-none"
                                    style={{ aspectRatio: '9 / 16', minHeight: '540px' }}
                                >
                                    <img
                                        src={safeHero}
                                        alt=""
                                        crossOrigin="anonymous"
                                        className="absolute inset-0 w-full h-full object-cover object-center"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/15 to-[#050505]" />
                                    <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-[#050505] via-[#050505]/85 to-transparent" />

                                    <div className="absolute inset-0 p-7 flex flex-col justify-between">
                                        {/* Top Brand + Kicker */}
                                        <div className="flex flex-col items-start gap-3">
                                            <div className="flex items-center gap-2">
                                                <div className="flex gap-0.5">
                                                    {['E', 'X', 'P'].map((ch) => (
                                                        <span key={ch} className="w-5 h-5 bg-[#FAFF00] text-[#050505] font-black text-[10px] flex items-center justify-center">
                                                            {ch}
                                                        </span>
                                                    ))}
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-[0.22em]">EXPLAINER AFRICA</span>
                                            </div>
                                            <span className="bg-[#FAFF00] text-black px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.25em]">
                                                {displayKicker}
                                            </span>
                                        </div>

                                        {/* Lower Story Headline + CTA Pill */}
                                        <div className="space-y-5 text-left">
                                            <div className="w-10 h-1 bg-[#FAFF00]" />
                                            <h4 className="font-serif-display text-3xl font-black leading-[1.06] tracking-tight text-white">
                                                {displayHeadline}
                                            </h4>
                                            <p className="text-xs text-white/75 font-serif italic line-clamp-2">
                                                {subhead}
                                            </p>
                                            <div className="bg-[#FAFF00] text-black px-4 py-3 rounded-full flex items-center justify-between">
                                                <span className="text-[9px] font-black uppercase tracking-[0.25em]">Read Full Story</span>
                                                <span className="text-[9px] font-black uppercase tracking-[0.15em] flex items-center gap-1">
                                                    explainer.africa <ArrowRight className="w-3 h-3" />
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Customize, Generate & Share Controls */}
                <div className="lg:col-span-5 flex flex-col gap-5">
                    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 space-y-4">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 block mb-2">
                                Kicker / Badge Override (Optional)
                            </label>
                            <input
                                type="text"
                                value={customKicker}
                                onChange={(e) => { setCustomKicker(e.target.value); setGeneratedUrl(''); }}
                                placeholder={format === 'breaking' ? 'DEVELOPING STORY' : category}
                                className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-black uppercase tracking-wider text-gray-900 focus:outline-none focus:border-black"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 block mb-2">
                                Banner Headline Override (Optional)
                            </label>
                            <textarea
                                rows={3}
                                value={customHeadline}
                                onChange={(e) => { setCustomHeadline(e.target.value); setGeneratedUrl(''); }}
                                placeholder={headline}
                                className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm font-bold text-gray-900 focus:outline-none focus:border-black resize-none"
                            />
                        </div>
                        <p className="text-[10px] text-gray-400 font-medium">
                            Customize the social copy here without altering the published article.
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
                            <span>{isGenerating ? 'Generating Banner...' : isDownloaded ? 'Banner Downloaded!' : `Download ${activeTemplate.label} PNG`}</span>
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

import React, { useState, useRef } from 'react';
import { Send, Upload, X, Loader2, CheckCircle, Image as ImageIcon, Type, Globe } from 'lucide-react';
import { storyService } from '../../lib/services';

export default function GuestSubmissionPortal() {
    const [step, setStep] = useState(1); // 1: Info, 2: Content, 3: Success
    const [formData, setFormData] = useState({
        headline: "",
        subhead: "",
        authorName: "",
        authorEmail: "",
        content: [{ id: 1, type: "p", text: "" }],
        heroImage: ""
    });
    const [uploading, setUploading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef(null);

    const handleUpdateContent = (newContent) => setFormData(prev => ({ ...prev, content: newContent }));

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        try {
            const url = await storyService.uploadImage(file);
            setFormData(prev => ({ ...prev, heroImage: url }));
        } catch (e) { alert("Upload failed: " + e.message); }
        finally { setUploading(false); }
    };

    const submitToNewsroom = async () => {
        setIsSubmitting(true);
        try {
            const payload = {
                headline: formData.headline,
                subhead: formData.subhead,
                author: `${formData.authorName} (Guest)`,
                category: "Guest Submission",
                workflow_status: "pending_review", // Straight to editors
                status: "Pending Review",
                layout: "standard",
                content: JSON.stringify(formData.content),
                scrollySections: JSON.stringify([]),
                heroImage: formData.heroImage,
                isFeatured: false
            };

            await storyService.saveStory('new-story', payload);
            setStep(3);
        } catch (e) {
            alert("Submission failed: " + e.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (step === 3) return (
        <div className="min-h-screen bg-black flex items-center justify-center p-8">
            <div className="max-w-md w-full text-center space-y-8 animate-in zoom-in duration-500">
                <div className="flex justify-center">
                    <div className="w-24 h-24 bg-[#FAFF00] rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(250,255,0,0.3)]">
                        <CheckCircle className="w-12 h-12 text-black" />
                    </div>
                </div>
                <div className="space-y-4">
                    <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Dispatch Received</h1>
                    <p className="text-gray-400 font-medium leading-relaxed">
                        Your contribution has been beamed to the VOX newsroom. Our editors will review your work and contact you via email if we proceed to publication.
                    </p>
                </div>
                <a href="/" className="inline-block px-10 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all">
                    Return to Site
                </a>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-[#FAFF00] selection:text-black">
            {/* Progress Nav */}
            <nav className="fixed top-0 left-0 w-full h-1 bg-white/10 z-50">
                <div className={`h-full bg-[#FAFF00] transition-all duration-700 ${step === 1 ? 'w-1/3' : 'w-2/3'}`} />
            </nav>

            <div className="max-w-5xl mx-auto px-8 py-24 flex flex-col md:flex-row gap-20">
                {/* Context Rail */}
                <aside className="md:w-1/3 space-y-12">
                    <div className="space-y-4">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FAFF00]">Submission Portal</h2>
                        <h1 className="text-6xl font-black uppercase tracking-tighter leading-[0.85]">
                            The <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FAFF00] to-white">Dispatch</span>
                        </h1>
                    </div>

                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-[10px] font-black">{step}</div>
                            <div className="flex-1 pt-1">
                                <h3 className="text-xs font-black uppercase tracking-widest">
                                    {step === 1 ? 'Intel & Metadata' : 'Content Production'}
                                </h3>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1 leading-relaxed">
                                    {step === 1 ? 'Tell us who you are and what the story is about.' : 'Draft your visual journalism piece.'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 bg-white/5 rounded-3xl border border-white/5 space-y-6">
                        <p className="text-xs text-gray-400 leading-relaxed italic">
                            "Visual journalism is about explaining the world so it can be fixed. We believe truth is a shared responsibility."
                        </p>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-black border border-white/10" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Editorial Board</span>
                        </div>
                    </div>
                </aside>

                {/* Content Field */}
                <main className="flex-1 animate-in slide-in-from-bottom-10 duration-700">
                    {step === 1 && (
                        <div className="space-y-12 pb-20">
                            <section className="space-y-8">
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Correspondent Name</label>
                                        <input
                                            type="text"
                                            value={formData.authorName}
                                            onChange={e => setFormData({ ...formData, authorName: e.target.value })}
                                            className="w-full bg-white/5 border-2 border-transparent focus:border-[#FAFF00] p-5 rounded-2xl outline-none font-bold text-sm transition-all"
                                            placeholder="REQUIRED"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Encrypted Email</label>
                                        <input
                                            type="email"
                                            value={formData.authorEmail}
                                            onChange={e => setFormData({ ...formData, authorEmail: e.target.value })}
                                            className="w-full bg-white/5 border-2 border-transparent focus:border-[#FAFF00] p-5 rounded-2xl outline-none font-bold text-sm transition-all"
                                            placeholder="FOR CONTACT ONLY"
                                        />
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-8">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FAFF00]">The Headline</label>
                                    <textarea
                                        value={formData.headline}
                                        onChange={e => setFormData({ ...formData, headline: e.target.value })}
                                        className="w-full bg-transparent border-none text-5xl font-black uppercase tracking-tighter resize-none outline-none placeholder:text-white/10"
                                        placeholder="Enter your loud headline..."
                                        rows="3"
                                    />
                                </div>
                                <div className="space-y-4 pt-12 border-t border-white/5">
                                    <label className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500">Sub-Intelligence (Summary)</label>
                                    <textarea
                                        value={formData.subhead}
                                        onChange={e => setFormData({ ...formData, subhead: e.target.value })}
                                        className="w-full bg-transparent border-none text-xl font-medium text-gray-400 leading-relaxed resize-none outline-none placeholder:text-white/5"
                                        placeholder="Explain why this matters in two sentences..."
                                        rows="4"
                                    />
                                </div>
                            </section>

                            <button
                                disabled={!formData.headline || !formData.authorName}
                                onClick={() => setStep(2)}
                                className="bg-[#FAFF00] text-black w-full py-6 rounded-2xl text-xs font-black uppercase tracking-[0.3em] hover:bg-white transition-all shadow-[0_20px_40px_rgba(250,255,0,0.1)] disabled:opacity-20 flex items-center justify-center gap-4 group"
                            >
                                Next: Produce Content <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-12 pb-20">
                            {/* Editor Mock Component */}
                            <div className="space-y-8">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-[#FAFF00] flex items-center gap-3">
                                    <Type className="w-4 h-4" /> Story Flow Blocks
                                </h3>

                                {formData.content.map((block) => (
                                    <div key={block.id} className="relative group">
                                        {block.type === 'p' && (
                                            <textarea
                                                value={block.text}
                                                autoFocus
                                                onChange={e => handleUpdateContent(formData.content.map(b => b.id === block.id ? { ...b, text: e.target.value } : b))}
                                                placeholder="Tell the story here..."
                                                className="w-full bg-white/5 p-8 rounded-3xl border border-white/5 outline-none focus:border-white/20 transition-all text-lg font-medium leading-relaxed"
                                                rows="4"
                                            />
                                        )}
                                        <button onClick={() => handleUpdateContent(formData.content.filter(b => b.id !== block.id))} className="absolute -top-2 -right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}

                                <div className="flex gap-4">
                                    <button onClick={() => handleUpdateContent([...formData.content, { id: Date.now(), type: 'p', text: '' }])} className="p-6 bg-white/5 rounded-2xl border border-white/5 hover:bg-white hover:text-black transition-all group flex-1">
                                        <Type className="w-5 h-5 mx-auto mb-2 opacity-50 group-hover:opacity-100" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Add Text Dispatch</span>
                                    </button>
                                    <button className="p-6 bg-white/5 rounded-2xl border border-white/5 hover:bg-white hover:text-black transition-all group flex-1 opacity-50 cursor-not-allowed">
                                        <ImageIcon className="w-5 h-5 mx-auto mb-2 opacity-50" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Visual Blocks (Editors Only)</span>
                                    </button>
                                </div>
                            </div>

                            <div className="pt-12 border-t border-white/5 space-y-8">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-[#FAFF00]">Cover Transmission (Primary Image)</h3>
                                {formData.heroImage ? (
                                    <div className="relative aspect-video rounded-3xl overflow-hidden group">
                                        <img src={formData.heroImage} className="w-full h-full object-cover" />
                                        <button onClick={() => setFormData({ ...formData, heroImage: "" })} className="absolute top-4 right-4 bg-black/60 p-4 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                ) : (
                                    <div onClick={() => fileInputRef.current?.click()} className="aspect-video bg-white/5 rounded-3xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-[#FAFF00] hover:bg-white/10 transition-all text-gray-500 hover:text-[#FAFF00]">
                                        {uploading ? <Loader2 className="animate-spin" /> : <Upload className="w-10 h-10" />}
                                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Upload Field Intel Image</span>
                                    </div>
                                )}
                                <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
                            </div>

                            <div className="flex gap-4">
                                <button onClick={() => setStep(1)} className="px-10 py-6 text-xs font-black uppercase tracking-widest text-gray-500 hover:text-white transition-all">
                                    Back
                                </button>
                                <button
                                    onClick={submitToNewsroom}
                                    disabled={isSubmitting}
                                    className="flex-1 bg-[#FAFF00] text-black py-6 rounded-2xl text-xs font-black uppercase tracking-[0.3em] hover:bg-white transition-all shadow-[0_20px_40px_rgba(250,255,0,0.15)] flex items-center justify-center gap-4"
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : <Send className="w-5 h-5" />}
                                    {isSubmitting ? 'Encrypting Dispatch...' : 'Broadcast to Newsroom'}
                                </button>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* Footer Credit */}
            <footer className="fixed bottom-0 left-0 w-full p-8 flex justify-between items-center pointer-events-none opacity-40">
                <div className="flex items-center gap-3">
                    <Globe className="w-4 h-4" />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em]">Sovereign Communication Protocol 4.0</span>
                </div>
                <span className="text-[9px] font-black uppercase tracking-[0.2em]">VOX NEWSROOM 2025</span>
            </footer>
        </div>
    );
}

function ArrowRight({ className }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
        </svg>
    );
}

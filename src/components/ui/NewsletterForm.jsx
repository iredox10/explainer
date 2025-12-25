import React, { useState } from 'react';
import { Mail, CheckCircle, Loader2, ArrowRight } from 'lucide-react';
import { newsletterService } from '../../lib/services.js';

export default function NewsletterForm() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [errorMsg, setErrorMsg] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) return;

        setStatus('loading');
        try {
            await newsletterService.subscribe(email);
            setStatus('success');
            setEmail('');
        } catch (error) {
            console.error(error);
            setStatus('error');
            setErrorMsg(error.message || 'Subscription failed. Please try again.');
            setTimeout(() => setStatus('idle'), 5000);
        }
    };

    if (status === 'success') {
        return (
            <div className="bg-black/5 p-8 rounded-2xl border border-black/5 animate-in zoom-in duration-500">
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center">
                        <CheckCircle className="w-8 h-8 text-[#FAFF00]" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-black uppercase tracking-tighter">You're in the loop</h3>
                        <p className="text-sm text-black/60 font-medium">
                            Check your inbox soon for your first deep dive. Welcome to the newsroom.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="relative group">
            <div className={`flex flex-col sm:flex-row gap-3 transition-opacity duration-300 ${status === 'loading' ? 'opacity-50' : 'opacity-100'}`}>
                <div className="flex-1 relative">
                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-black/20 group-focus-within:text-black transition-colors" />
                    <input
                        type="email"
                        required
                        disabled={status === 'loading'}
                        placeholder="you@work.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-white border-2 border-black/5 px-14 py-5 font-bold text-black text-lg focus:outline-none focus:border-black rounded-sm transition-all placeholder:text-black/20"
                    />
                </div>
                <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="bg-black text-[#FAFF00] px-10 py-5 font-black uppercase tracking-[0.2em] text-xs hover:bg-[#111] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:cursor-not-allowed group/btn shadow-[0_20px_40px_rgba(0,0,0,0.1)]"
                >
                    {status === 'loading' ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <>
                            Join Newsroom <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                        </>
                    )}
                </button>
            </div>

            {status === 'error' && (
                <p className="absolute -bottom-10 left-0 text-red-600 text-[10px] font-black uppercase tracking-widest animate-in fade-in slide-in-from-top-2">
                    {errorMsg}
                </p>
            )}

            <div className="mt-6 flex items-center gap-4 opacity-30 group-focus-within:opacity-100 transition-opacity">
                <span className="w-8 h-px bg-black"></span>
                <p className="text-[10px] font-black uppercase tracking-[0.3em]">No spam. Only high-interference investigative journalism.</p>
            </div>
        </form>
    );
}

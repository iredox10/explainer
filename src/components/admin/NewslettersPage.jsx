import React, { useState, useEffect } from 'react';
import { Mail, Users, Send, Download, Search, Filter, Loader2, CheckCircle2, AlertCircle, Trash2, ExternalLink } from 'lucide-react';
import { databases, DB_ID, COLLECTIONS } from '../../lib/appwrite';
import { Query, ID } from 'appwrite';

export default function NewslettersPage() {
    const [subscribers, setSubscribers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [sentStatus, setSentStatus] = useState(null);
    const [campaignText, setCampaignText] = useState('');
    const [campaignSubject, setCampaignSubject] = useState('');

    useEffect(() => {
        fetchSubscribers();
    }, []);

    const fetchSubscribers = async () => {
        try {
            const response = await databases.listDocuments(DB_ID, COLLECTIONS.SUBSCRIBERS, [
                Query.orderDesc('$createdAt')
            ]);
            setSubscribers(response.documents);
        } catch (error) {
            console.error('Error fetching subscribers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendCampaign = async (e) => {
        e.preventDefault();
        if (!campaignSubject || !campaignText) return;

        setIsSending(true);
        // Simulate broadcast (In a real app, this would trigger an Appwrite Function or an external mail provider)
        try {
            await new Promise(resolve => setTimeout(resolve, 2000));
            setSentStatus({
                success: true,
                message: `Broadcast initiated. Dispatching to ${subscribers.length} recipients.`
            });
            setCampaignSubject('');
            setCampaignText('');

            // Log the campaign in system logs (simulated)
            console.log("Newsletter Sent:", { subject: campaignSubject, text: campaignText, recipientCount: subscribers.length });

        } catch (error) {
            setSentStatus({ success: false, message: 'Broadcast failed at the gateway level.' });
        } finally {
            setIsSending(false);
            setTimeout(() => setSentStatus(null), 5000);
        }
    };

    const filteredSubscribers = subscribers.filter(s =>
        s.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const exportCsv = () => {
        const headers = ["Email", "Subscribed At", "Status"];
        const rows = subscribers.map(s => [s.email, s.subscribedAt, s.status]);
        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "explainer_subscribers.csv");
        document.body.appendChild(link);
        link.click();
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-12 lg:pt-0">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-[#FAFF00]/10 rounded-lg">
                            <Mail className="w-5 h-5 text-[#FAFF00]" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase italic">Campaign Engine</h1>
                    </div>
                    <p className="text-gray-500 font-mono text-[10px] md:text-xs uppercase tracking-[0.2em]">Broadcast Protocols & Audience Intelligence</p>
                </div>

                <div className="flex flex-wrap gap-4 w-full md:w-auto">
                    <button
                        onClick={exportCsv}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#FAFF00] hover:bg-white/10 transition-all shadow-xl"
                    >
                        <Download className="w-4 h-4" />
                        Export Manifest
                    </button>
                    <div className="flex-1 md:flex-none bg-white/5 border border-white/10 px-6 py-3 rounded-xl flex items-center justify-center gap-3">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-xl font-black text-white">{subscribers.length}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Active Units</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Broadcast Console */}
                <div className="lg:col-span-2">
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 relative overflow-hidden group shadow-2xl">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#FAFF00]/5 rounded-full blur-3xl -mr-32 -mt-32"></div>

                        <h2 className="text-xl font-black text-white uppercase italic tracking-tight mb-6 flex items-center gap-3">
                            <Send className="w-5 h-5 text-[#FAFF00]" />
                            Dispatch Console
                        </h2>

                        <form onSubmit={handleSendCampaign} className="space-y-6 relative z-10">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2">Subject Header</label>
                                <input
                                    type="text"
                                    required
                                    value={campaignSubject}
                                    onChange={(e) => setCampaignSubject(e.target.value)}
                                    placeholder="INVESTIGATION: THE HIDDEN INFRASTRUCTURE OF LAGOS"
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-4 text-white focus:border-[#FAFF00] focus:ring-1 focus:ring-[#FAFF00] outline-none transition-all font-bold placeholder:text-white/10"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2">Dispatch Content (HTML Supported)</label>
                                <textarea
                                    required
                                    rows="12"
                                    value={campaignText}
                                    onChange={(e) => setCampaignText(e.target.value)}
                                    placeholder="Greetings Informant, our latest deep-dive is now live..."
                                    className="w-full bg-black/50 border border-white/10 rounded-2xl px-4 py-4 text-white focus:border-[#FAFF00] focus:ring-1 focus:ring-[#FAFF00] outline-none transition-all font-mono text-sm placeholder:text-white/10 leading-relaxed"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSending || subscribers.length === 0}
                                className="w-full bg-[#FAFF00] text-black py-4 rounded-xl font-black uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:hover:scale-100 shadow-[0_10px_30px_rgba(250,255,0,0.2)]"
                            >
                                {isSending ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Interfacing...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-5 h-5" />
                                        Initiate Global Broadcast
                                    </>
                                )}
                            </button>
                        </form>

                        {sentStatus && (
                            <div className={`mt-6 p-4 rounded-xl flex items-center gap-3 animate-in slide-in-from-bottom duration-300 ${sentStatus.success ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                {sentStatus.success ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                <span className="text-xs font-bold uppercase tracking-widest">{sentStatus.message}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Subscriber Intelligence */}
                <div className="lg:col-span-1 flex flex-col gap-8">
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col h-full shadow-2xl relative">
                        <h2 className="text-lg font-black text-white uppercase italic tracking-tight mb-6 flex items-center justify-between">
                            Audience Manifest
                            <span className="text-[10px] font-mono text-gray-500">REALTIME</span>
                        </h2>

                        <div className="relative mb-6">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Locate Identity..."
                                className="w-full bg-black/30 border border-white/5 rounded-lg pl-10 pr-4 py-2 text-xs text-white focus:border-[#FAFF00] outline-none transition-all placeholder:text-gray-600 font-bold"
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 max-h-[600px] pr-2">
                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-8 h-8 animate-spin text-[#FAFF00]" />
                                </div>
                            ) : filteredSubscribers.length === 0 ? (
                                <div className="text-center py-12 text-gray-600 uppercase font-black text-[10px] tracking-widest italic">
                                    No Identities Found
                                </div>
                            ) : (
                                filteredSubscribers.map(sub => (
                                    <div key={sub.$id} className="group p-4 bg-white/2 hover:bg-white/5 border border-white/5 rounded-xl transition-all duration-300">
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="font-bold text-xs text-white truncate max-w-[150px]">{sub.email}</div>
                                            <div className="px-1.5 py-0.5 bg-green-500/10 text-green-400 text-[8px] font-black uppercase rounded tracking-tighter">Active</div>
                                        </div>
                                        <div className="text-[9px] font-mono text-gray-600 flex items-center justify-between">
                                            <span>Joined: {new Date(sub.$createdAt).toLocaleDateString()}</span>
                                            <button className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-500">
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

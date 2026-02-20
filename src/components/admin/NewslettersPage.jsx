import { useState, useEffect } from 'react';
import { Mail, Users, Send, Download, Search, Loader2, CheckCircle2, AlertCircle, Trash2, Eye, BarChart3, Clock, X } from 'lucide-react';
import { databases, DB_ID, COLLECTIONS } from '../../lib/appwrite';
import { Query, ID } from 'appwrite';
import { emailService, emailTemplates } from '../../lib/email';
import { storyService } from '../../lib/services';

export default function NewslettersPage() {
    const [subscribers, setSubscribers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [sentStatus, setSentStatus] = useState(null);
    const [campaignText, setCampaignText] = useState('');
    const [campaignSubject, setCampaignSubject] = useState('');
    const [campaigns, setCampaigns] = useState([]);
    const [showCampaignHistory, setShowCampaignHistory] = useState(false);
    const [selectedCampaign, setSelectedCampaign] = useState(null);
    const [mode, setMode] = useState('compose');
    const [recentStories, setRecentStories] = useState([]);
    const [selectedStories, setSelectedStories] = useState([]);

    useEffect(() => {
        fetchSubscribers();
        fetchCampaigns();
        fetchRecentStories();
    }, []);

    const fetchSubscribers = async () => {
        try {
            const response = await databases.listDocuments(DB_ID, COLLECTIONS.SUBSCRIBERS, [
                Query.orderDesc('$createdAt'),
                Query.limit(500)
            ]);
            setSubscribers(response.documents);
        } catch (error) {
            console.error('Error fetching subscribers:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCampaigns = async () => {
        try {
            const response = await databases.listDocuments(DB_ID, 'campaigns', [
                Query.orderDesc('sentAt'),
                Query.limit(20)
            ]);
            setCampaigns(response.documents);
        } catch (error) {
            console.error('Error fetching campaigns:', error);
        }
    };

    const fetchRecentStories = async () => {
        try {
            const stories = await storyService.getPublishedStories();
            setRecentStories(stories.slice(0, 10));
        } catch (error) {
            console.error('Error fetching stories:', error);
        }
    };

    const handleDeleteSubscriber = async (subscriberId) => {
        if (!confirm('Remove this subscriber?')) return;
        
        try {
            await databases.deleteDocument(DB_ID, COLLECTIONS.SUBSCRIBERS, subscriberId);
            setSubscribers(subscribers.filter(s => s.$id !== subscriberId));
        } catch (error) {
            console.error('Error deleting subscriber:', error);
        }
    };

    const handleSendCampaign = async (e) => {
        e.preventDefault();
        if (!campaignSubject || !campaignText) return;

        setIsSending(true);
        try {
            const result = await emailService.sendCampaign({
                subject: campaignSubject,
                html: campaignText,
                text: campaignText.replace(/<[^>]*>/g, ''),
                subscriberIds: subscribers
                    .filter(s => s.status === 'active')
                    .map(s => s.$id)
            });

            setSentStatus({
                success: result.success,
                message: result.success 
                    ? `Campaign sent to ${result.results?.success || subscribers.length} subscribers`
                    : result.error || 'Failed to send campaign'
            });

            if (result.success) {
                setCampaignSubject('');
                setCampaignText('');
                setSelectedStories([]);
                await fetchCampaigns();
            }
        } catch (error) {
            setSentStatus({ 
                success: false, 
                message: error.message || 'Campaign failed' 
            });
        } finally {
            setIsSending(false);
            setTimeout(() => setSentStatus(null), 5000);
        }
    };

    const generateNewsletter = () => {
        if (selectedStories.length === 0) return;
        
        const template = emailTemplates.newsletter(selectedStories, {
            siteName: 'Explainer',
            siteUrl: 'https://explainer.africa'
        });
        
        setCampaignText(template.html);
        setCampaignSubject(`This Week on Explainer: ${selectedStories[0]?.headline?.slice(0, 30)}...`);
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
        <div className="min-h-screen bg-transparent flex font-sans text-gray-900">
            <div className="lg:ml-64 flex-1 p-4 md:p-8 pt-24 lg:pt-8 bg-gray-50/50">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-black p-2 rounded-lg">
                                <Mail className="w-5 h-5 text-[#FAFF00]" />
                            </div>
                            <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Campaign Engine</h1>
                        </div>
                        <p className="text-gray-500 text-sm font-medium">Broadcast Protocols & Audience Intelligence</p>
                    </div>

                    <div className="flex flex-wrap gap-4 w-full md:w-auto">
                        <button
                            onClick={exportCsv}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm"
                        >
                            <Download className="w-4 h-4" />
                            Export List
                        </button>
                        <div className="flex-1 md:flex-none bg-black border border-black px-6 py-3 rounded-xl flex items-center justify-center gap-3">
                            <Users className="w-4 h-4 text-[#FAFF00]" />
                            <span className="text-xl font-black text-white">{subscribers.filter(s => s.status === 'active').length.toLocaleString()}</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Active</span>
                        </div>
                    </div>
                </header>

                <div className="flex gap-2 mb-8">
                    {['compose', 'auto', 'history'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setMode(tab)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                mode === tab 
                                    ? 'bg-black text-[#FAFF00]' 
                                    : 'bg-white text-gray-400 hover:bg-gray-100'
                            }`}
                        >
                            {tab === 'compose' ? 'Compose' : tab === 'auto' ? 'Auto-Generate' : 'History'}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-3xl p-8 relative overflow-hidden shadow-xl border border-gray-100">
                            {mode === 'compose' && (
                                <>
                                    <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-6 flex items-center gap-3">
                                        <Send className="w-5 h-5 text-[#FAFF00]" />
                                        Dispatch Console
                                    </h2>

                                    <form onSubmit={handleSendCampaign} className="space-y-6">
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2">Subject Header</label>
                                            <input
                                                type="text"
                                                required
                                                value={campaignSubject}
                                                onChange={(e) => setCampaignSubject(e.target.value)}
                                                placeholder="INVESTIGATION: THE HIDDEN INFRASTRUCTURE OF LAGOS"
                                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-gray-900 focus:border-black focus:ring-2 focus:ring-black/5 outline-none transition-all font-bold placeholder:text-gray-300"
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
                                                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 text-gray-900 focus:border-black focus:ring-2 focus:ring-black/5 outline-none transition-all font-mono text-sm placeholder:text-gray-300 leading-relaxed"
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isSending || subscribers.filter(s => s.status === 'active').length === 0}
                                            className="w-full bg-[#FAFF00] text-black py-4 rounded-xl font-black uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:hover:scale-100 shadow-[0_10px_30px_rgba(250,255,0,0.2)]"
                                        >
                                            {isSending ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    Broadcasting...
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="w-5 h-5" />
                                                    Initiate Broadcast
                                                </>
                                            )}
                                        </button>
                                    </form>
                                </>
                            )}

                            {mode === 'auto' && (
                                <>
                                    <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-6 flex items-center gap-3">
                                        <Mail className="w-5 h-5 text-[#FAFF00]" />
                                        Auto-Generate Newsletter
                                    </h2>

                                    <p className="text-sm text-gray-500 mb-6">Select stories to include in your weekly digest:</p>

                                    <div className="space-y-3 max-h-[400px] overflow-y-auto mb-6">
                                        {recentStories.map(story => (
                                            <label
                                                key={story.$id}
                                                className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all ${
                                                    selectedStories.includes(story)
                                                        ? 'bg-[#FAFF00]/10 border-2 border-[#FAFF00]'
                                                        : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                                                }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedStories.includes(story)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedStories([...selectedStories, story]);
                                                        } else {
                                                            setSelectedStories(selectedStories.filter(s => s.$id !== story.$id));
                                                        }
                                                    }}
                                                    className="hidden"
                                                />
                                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                                    selectedStories.includes(story) 
                                                        ? 'bg-[#FAFF00] border-black' 
                                                        : 'border-gray-300'
                                                }`}>
                                                    {selectedStories.includes(story) && (
                                                        <svg className="w-3 h-3 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                            <polyline points="20 6 9 17 4 12" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold truncate">{story.headline}</p>
                                                    <p className="text-[10px] text-gray-400">{story.category} · {story.author}</p>
                                                </div>
                                            </label>
                                        ))}
                                    </div>

                                    <button
                                        onClick={generateNewsletter}
                                        disabled={selectedStories.length === 0}
                                        className="w-full bg-black text-[#FAFF00] py-4 rounded-xl font-black uppercase tracking-[0.2em] hover:bg-gray-900 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                                    >
                                        Generate Newsletter ({selectedStories.length} stories)
                                    </button>
                                </>
                            )}

                            {mode === 'history' && (
                                <>
                                    <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-6 flex items-center gap-3">
                                        <Clock className="w-5 h-5 text-[#FAFF00]" />
                                        Campaign History
                                    </h2>

                                    <div className="space-y-3">
                                        {campaigns.length > 0 ? campaigns.map(campaign => (
                                            <div
                                                key={campaign.$id}
                                                onClick={() => setSelectedCampaign(campaign)}
                                                className="p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-all"
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <h3 className="text-sm font-bold truncate flex-1">{campaign.subject}</h3>
                                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                                                        campaign.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                        campaign.status === 'sending' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-gray-100 text-gray-600'
                                                    }`}>
                                                        {campaign.status}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4 text-[10px] text-gray-400">
                                                    <span>{campaign.sentCount || 0} sent</span>
                                                    <span>·</span>
                                                    <span>{new Date(campaign.sentAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="text-center py-12 text-gray-400">
                                                <Mail className="w-10 h-10 mx-auto mb-4 opacity-30" />
                                                <p className="text-xs font-bold uppercase tracking-widest">No campaigns sent yet</p>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}

                            {sentStatus && (
                                <div className={`mt-6 p-4 rounded-xl flex items-center gap-3 animate-in slide-in-from-bottom duration-300 ${sentStatus.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                    {sentStatus.success ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                    <span className="text-xs font-bold">{sentStatus.message}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xl">
                            <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight mb-4 flex items-center justify-between">
                                Subscriber List
                                <span className="text-[10px] font-mono text-gray-400">{subscribers.length} total</span>
                            </h2>

                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search subscribers..."
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-10 pr-4 py-2 text-xs text-gray-900 focus:border-black outline-none transition-all"
                                />
                            </div>

                            <div className="overflow-y-auto custom-scrollbar space-y-2 max-h-[500px] pr-2">
                                {loading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className="w-8 h-8 animate-spin text-[#FAFF00]" />
                                    </div>
                                ) : filteredSubscribers.length === 0 ? (
                                    <div className="text-center py-12 text-gray-400">
                                        <p className="text-xs font-bold uppercase tracking-widest">No subscribers found</p>
                                    </div>
                                ) : (
                                    filteredSubscribers.map(sub => (
                                        <div key={sub.$id} className="group p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all duration-300">
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-bold text-xs text-gray-900 truncate">{sub.email}</div>
                                                    <div className="text-[9px] font-mono text-gray-400 mt-0.5">
                                                        {new Date(sub.$createdAt).toLocaleDateString()}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-1.5 py-0.5 text-[8px] font-black uppercase rounded ${
                                                        sub.status === 'active' 
                                                            ? 'bg-green-100 text-green-700' 
                                                            : 'bg-gray-200 text-gray-500'
                                                    }`}>
                                                        {sub.status || 'active'}
                                                    </span>
                                                    <button 
                                                        onClick={() => handleDeleteSubscriber(sub.$id)}
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500 p-1"
                                                        title="Remove subscriber"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {campaigns.length > 0 && (
                            <div className="mt-6 bg-white rounded-3xl p-6 border border-gray-100 shadow-xl">
                                <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight mb-4 flex items-center gap-2">
                                    <BarChart3 className="w-4 h-4 text-[#FAFF00]" />
                                    Latest Campaign Stats
                                </h2>
                                
                                {campaigns[0] && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-gray-50 rounded-xl p-3">
                                            <p className="text-2xl font-black text-gray-900">{campaigns[0].sentCount || 0}</p>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sent</p>
                                        </div>
                                        <div className="bg-gray-50 rounded-xl p-3">
                                            <p className="text-2xl font-black text-gray-900">{campaigns[0].openCount || 0}</p>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Opens</p>
                                        </div>
                                        <div className="bg-gray-50 rounded-xl p-3">
                                            <p className="text-2xl font-black text-gray-900">{campaigns[0].clickCount || 0}</p>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Clicks</p>
                                        </div>
                                        <div className="bg-gray-50 rounded-xl p-3">
                                            <p className="text-2xl font-black text-gray-900">
                                                {campaigns[0].sentCount > 0 
                                                    ? Math.round((campaigns[0].openCount || 0) / campaigns[0].sentCount * 100) 
                                                    : 0}%
                                            </p>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Open Rate</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
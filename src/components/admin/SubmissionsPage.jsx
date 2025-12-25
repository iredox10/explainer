import React, { useState, useEffect } from 'react';
import { Inbox, CheckCircle, XCircle, Loader2, ExternalLink, Calendar, Mail, User } from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import { getCurrentUser, ROLES } from '../../lib/authStore';
import { storyService } from '../../lib/services';

export default function SubmissionsPage() {
    const [user, setUser] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const u = getCurrentUser();
        if (!u) {
            window.location.href = '/admin/login';
        } else {
            setUser(u);
            loadSubmissions();
        }
    }, []);

    const loadSubmissions = async () => {
        setIsLoading(true);
        try {
            const data = await storyService.getAllStories();
            // Filter for stories submitted via the guest portal or in pending_review
            // In the portal logic, we set category to "Guest Submission"
            setSubmissions(data.filter(s => s.category === 'Guest Submission' || s.workflow_status === 'pending_review'));
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAction = async (id, status) => {
        try {
            await storyService.saveStory(id, { workflow_status: status });
            setSubmissions(prev => prev.map(s => s.$id === id ? { ...s, workflow_status: status } : s));
            alert(`Dispatch ${status === 'published' ? 'Approved' : 'Moved to drafts'}`);
        } catch (e) {
            alert("Action failed: " + e.message);
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-transparent flex font-sans text-gray-900">
            <AdminSidebar activePage="submissions" />

            <main className="ml-64 flex-1 p-8 bg-gray-50/50">
                <header className="flex justify-between items-end mb-12">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-black p-2 rounded-lg text-[#FAFF00]">
                                <Inbox className="w-5 h-5" />
                            </div>
                            <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Guest Queue</h1>
                        </div>
                        <p className="text-gray-500 text-sm font-medium">External dispatches awaiting newsroom verification.</p>
                    </div>
                </header>

                {isLoading ? (
                    <div className="flex justify-center py-20"><Loader2 className="animate-spin w-12 h-12 text-[#FAFF00]" /></div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {submissions.map((dispatch) => (
                            <div key={dispatch.$id} className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden group hover:border-[#FAFF00] transition-all duration-500">
                                <div className="p-8 flex flex-col md:flex-row gap-8">
                                    {/* Visual Preview */}
                                    <div className="w-full md:w-64 aspect-video md:aspect-square rounded-2xl bg-gray-50 overflow-hidden relative border border-gray-100">
                                        {dispatch.heroImage ? (
                                            <img src={dispatch.heroImage} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-200">
                                                <Inbox className="w-12 h-12 opacity-20" />
                                            </div>
                                        )}
                                        <div className="absolute top-4 left-4">
                                            <span className="bg-black/80 text-[#FAFF00] text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded">External Intel</span>
                                        </div>
                                    </div>

                                    {/* Meta & Content */}
                                    <div className="flex-1 space-y-4">
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#FAFF00] bg-black px-3 py-1 rounded-full">
                                                <Clock className="w-3 h-3" /> {dispatch.workflow_status}
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                                <Calendar className="w-3 h-3" /> {new Date(dispatch.$createdAt).toLocaleDateString()}
                                            </div>
                                        </div>

                                        <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter leading-none">{dispatch.headline}</h2>
                                        <p className="text-gray-500 text-sm font-serif line-clamp-2 leading-relaxed">{dispatch.subhead}</p>

                                        <div className="pt-4 flex items-center gap-6 border-t border-gray-50">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-black">{dispatch.author.charAt(0)}</div>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-900">{dispatch.author}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Mail className="w-3 h-3 text-gray-300" />
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Contact Pending</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-row md:flex-col gap-3 justify-center">
                                        <a href={`/admin/edit/${dispatch.$id}`} className="p-4 bg-gray-50 hover:bg-black hover:text-white rounded-2xl text-gray-400 transition-all flex items-center justify-center border border-gray-100" title="Review Intelligence">
                                            <ExternalLink className="w-5 h-5" />
                                        </a>
                                        <button onClick={() => handleAction(dispatch.$id, 'published')} className="p-4 bg-green-50 hover:bg-green-600 hover:text-white rounded-2xl text-green-600 transition-all flex items-center justify-center border border-green-100" title="Authorize Publication">
                                            <CheckCircle className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => handleAction(dispatch.$id, 'draft')} className="p-4 bg-red-50 hover:bg-red-600 hover:text-white rounded-2xl text-red-600 transition-all flex items-center justify-center border border-red-100" title="Reject Transmission">
                                            <XCircle className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {!isLoading && submissions.length === 0 && (
                            <div className="py-20 text-center space-y-4">
                                <div className="p-12 bg-white/50 inline-block rounded-[3rem] border-2 border-dashed border-gray-200">
                                    <Inbox className="w-16 h-16 text-gray-200" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-lg font-black text-gray-900 uppercase tracking-widest">Inbox Zero</p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">No guest dispatches currently in the pipeline.</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}

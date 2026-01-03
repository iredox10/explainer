import React, { useState, useEffect } from 'react';
import { Inbox, CheckCircle, XCircle, Loader2, ExternalLink, Calendar, Mail, Clock, Search } from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import { getCurrentUser } from '../../lib/authStore';
import { storyService } from '../../lib/services';

export default function SubmissionsPage() {
    const [user, setUser] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

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
            alert(`Dispatch status updated to ${status}`);
        } catch (e) {
            alert("Action failed: " + e.message);
        }
    };

    const filteredSubmissions = submissions.filter(s =>
        (s.headline || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.author || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!user) return null;

    return (
        <div className="min-h-screen bg-transparent flex font-sans text-gray-900">
            <AdminSidebar activePage="submissions" />

      <main className="lg:ml-64 flex-1 p-4 md:p-8 pt-24 lg:pt-8 bg-gray-50/50">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-black p-2 rounded-lg text-[#FAFF00]">
                <Inbox className="w-5 h-5" />
              </div>
              <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Guest Queue</h1>
            </div>
            <p className="text-gray-500 text-sm font-medium">External transmissions awaiting newsroom clearance.</p>
          </div>

          <div className="relative group w-full md:min-w-[300px] md:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-black transition-colors" />
            <input
              type="text"
              placeholder="Locate Dispatch..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-100 rounded-2xl py-3.5 pl-12 pr-4 text-xs font-bold uppercase tracking-tight focus:outline-none focus:border-black focus:ring-4 focus:ring-black/5 transition-all shadow-sm"
            />
          </div>
        </header>

                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="animate-spin w-12 h-12 text-[#FAFF00]" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {filteredSubmissions.map((dispatch) => (
                            <div key={dispatch.$id} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden group hover:border-[#FAFF00] transition-all duration-300">
                                <div className="p-6 md:p-8 flex flex-col xl:flex-row gap-6 md:gap-8">
                                    {/* Visual Preview */}
                                    <div className="w-full xl:w-48 aspect-video xl:aspect-square rounded-2xl md:rounded-[2rem] bg-gray-50 overflow-hidden relative border border-gray-100 shrink-0">
                                        {dispatch.heroImage ? (
                                            <img src={dispatch.heroImage} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-200">
                                                <Inbox className="w-12 h-12 opacity-20" />
                                            </div>
                                        )}
                                        <div className="absolute top-4 left-4">
                                            <span className="bg-black text-[#FAFF00] text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded">Guest Intel</span>
                                        </div>
                                    </div>

                                    {/* Meta & Content */}
                                    <div className="flex-1 space-y-4 min-w-0">
                                        <div className="flex flex-wrap items-center gap-3 md:gap-4">
                                            <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-black bg-[#FAFF00] px-3 py-1 rounded-full shrink-0">
                                                <Clock className="w-3 h-3" /> {dispatch.workflow_status}
                                            </div>
                                            <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-400 shrink-0">
                                                <Calendar className="w-3 h-3" /> {new Date(dispatch.$createdAt).toLocaleDateString()}
                                            </div>
                                        </div>

                                        <h2 className="text-xl md:text-2xl font-black text-gray-900 uppercase tracking-tighter leading-tight break-words">{dispatch.headline}</h2>
                                        <p className="text-gray-500 text-xs md:text-sm font-serif line-clamp-2 leading-relaxed">{dispatch.subhead || "No summary provided."}</p>

                                        <div className="pt-4 flex flex-wrap items-center gap-4 md:gap-6 border-t border-gray-50">
                                            <div className="flex items-center gap-2 shrink-0">
                                                <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-black">{dispatch.author?.charAt(0) || "?"}</div>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-900">{dispatch.author || "Anonymous"}</span>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <Mail className="w-3 h-3 text-gray-300" />
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Contact Pending</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-row xl:flex-col gap-3 justify-center border-t xl:border-t-0 xl:border-l border-gray-50 pt-6 xl:pt-0 xl:pl-8">
                                        <a href={`/admin/edit/${dispatch.$id}`} className="flex-1 xl:flex-none p-4 bg-gray-50 hover:bg-black hover:text-white rounded-2xl text-gray-400 transition-all flex items-center justify-center border border-gray-100" title="Review Intelligence">
                                            <ExternalLink className="w-5 h-5" />
                                        </a>
                                        <button onClick={() => handleAction(dispatch.$id, 'approved')} className="flex-1 xl:flex-none p-4 bg-green-50 hover:bg-green-600 hover:text-white rounded-2xl text-green-600 transition-all flex items-center justify-center border border-green-100" title="Authorize Publication">
                                            <CheckCircle className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => handleAction(dispatch.$id, 'draft')} className="flex-1 xl:flex-none p-4 bg-red-50 hover:bg-red-600 hover:text-white rounded-2xl text-red-600 transition-all flex items-center justify-center border border-red-100" title="Reject Transmission">
                                            <XCircle className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {!isLoading && filteredSubmissions.length === 0 && (
                            <div className="py-20 text-center space-y-4">
                                <div className="p-12 bg-white inline-block rounded-[3rem] border-2 border-dashed border-gray-200 shadow-sm">
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

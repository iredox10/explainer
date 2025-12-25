import React, { useEffect, useState } from 'react';
import { Layout, FileText, Settings, PenTool, TrendingUp, Users, Clock, ArrowUpRight, Shield, Zap, Inbox, Loader2 } from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import { getCurrentUser, fetchSyncUser, ROLES } from '../../lib/authStore';
import { storyService, adminService } from '../../lib/services';

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [stories, setStories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState([
    { label: "Dispatch Volume", value: "0", sub: "Published", icon: FileText, color: "text-[#FAFF00]" },
    { label: "Reader Depth", value: "1.2k", sub: "Active Now", icon: Users, color: "text-[#FAFF00]" },
    { label: "System Health", value: "99.9%", sub: "Operational", icon: Shield, color: "text-[#FAFF00]" },
    { label: "Network Impact", value: "24.5k", sub: "Total Views", icon: Zap, color: "text-[#FAFF00]" },
  ]);

  useEffect(() => {
    const init = async () => {
      let u = getCurrentUser();
      if (!u) u = await fetchSyncUser();
      if (!u) {
        window.location.href = '/admin/login';
      } else {
        setUser(u);
        loadData();
      }
    };
    init();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await storyService.getAllStories();
      setStories(data);
      setStats(prev => prev.map(s => s.label === "Dispatch Volume" ? { ...s, value: data.filter(st => st.workflow_status === 'published').length.toString() } : s));
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  const isSuper = user.role === ROLES.ADMIN;

  return (
    <div className="min-h-screen bg-transparent flex font-sans text-gray-900">
      <AdminSidebar activePage="dashboard" />

      <main className="ml-64 flex-1 p-8 bg-gray-50/50">
        <header className="flex justify-between items-end mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-black p-2 rounded-lg text-[#FAFF00]">
                <Zap className="w-5 h-5 fill-[#FAFF00]" />
              </div>
              <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Command Center</h1>
            </div>
            <p className="text-gray-500 text-sm font-medium">Global newsroom oversight and intelligence metrics.</p>
          </div>
          <div className="flex gap-4">
            <button onClick={() => window.location.href = '/admin/edit/new-story'} className="bg-[#FAFF00] text-black px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all shadow-[0_10px_20px_rgba(250,255,0,0.1)]">
              Initialize Dispatch
            </button>
          </div>
        </header>

        {/* Tactical Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xl hover:shadow-2xl hover:border-black transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gray-50 rounded-full -mr-8 -mt-8 opacity-50 group-hover:bg-[#FAFF00]/10 transition-colors"></div>
              <div className="relative z-10">
                <stat.icon className="w-6 h-6 text-gray-300 mb-6 group-hover:text-black transition-colors" />
                <h3 className="text-4xl font-black text-gray-900 tracking-tighter mb-1">{stat.value}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-black">{stat.label}</span>
                  <div className="w-1 h-1 rounded-full bg-gray-300"></div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{stat.sub}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Real-time Flow */}
          <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-10 shadow-2xl border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-[#FAFF00]"></div>
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Live Traffic Flow</h2>
              <div className="flex gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#FAFF00] bg-black px-2 py-0.5 rounded">Live Data Feed</span>
              </div>
            </div>

            <div className="h-64 flex items-end gap-3 px-2">
              {[40, 65, 45, 80, 20, 90, 70, 85, 60, 75, 50, 95, 30, 40, 60].map((h, i) => (
                <div key={i} className="flex-1 bg-gray-50 rounded-2xl hover:bg-black transition-all duration-500 relative group cursor-crosshair">
                  <div style={{ height: `${h}%` }} className="absolute bottom-0 w-full bg-inherit rounded-2xl"></div>
                  <div className="absolute bottom-0 w-full bg-[#FAFF00] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" style={{ height: `${h}%` }}></div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-8 border-t border-gray-50 flex justify-between">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                <Clock className="w-3 h-3" /> Peak Editorial Efficiency
              </div>
              <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest">
                <span className="text-gray-300">Mon</span>
                <span className="text-gray-300">Wed</span>
                <span className="text-black">Sun (Current)</span>
              </div>
            </div>
          </div>

          {/* Pending Intelligence (Review Queue) */}
          <div className="bg-black rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden text-white flex flex-col">
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#FAFF00]/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
            <div className="flex justify-between items-start mb-10 relative z-10">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tighter leading-none mb-1">Review Queue</h2>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Pending Dispatches</p>
              </div>
              <Inbox className="w-6 h-6 text-[#FAFF00]" />
            </div>

            <div className="flex-1 space-y-6 relative z-10 overflow-y-auto max-h-[300px] custom-scrollbar pr-2">
              {stories.filter(s => s.workflow_status === 'pending_review').length > 0 ? (
                stories.filter(s => s.workflow_status === 'pending_review').map((s) => (
                  <div key={s.$id} className="p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all cursor-pointer group" onClick={() => window.location.href = `/admin/edit/${s.$id}`}>
                    <h3 className="text-xs font-bold truncate group-hover:text-[#FAFF00] transition-colors">{s.headline}</h3>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">{s.author}</span>
                      <ArrowUpRight className="w-3 h-3 text-[#FAFF00] opacity-0 group-hover:opacity-100 transition-all" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-10 opacity-30">
                  <CheckSquare className="w-8 h-8 mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Inbox Zero</p>
                </div>
              )}
            </div>

            <button
              onClick={() => window.location.href = '/admin/submissions'}
              className="w-full mt-10 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all"
            >
              Access Full Queue
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

function CheckSquare({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="18" height="18" x="3" y="3" rx="2" /><path d="m9 11 3 3L22 4" />
    </svg>
  )
}
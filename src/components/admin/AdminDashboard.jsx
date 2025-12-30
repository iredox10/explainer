import React, { useEffect, useState } from 'react';
import { Layout, FileText, Settings, PenTool, TrendingUp, Users, Clock, ArrowUpRight, Shield, Zap, Inbox, Loader2, BarChart3, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminSidebar from './AdminSidebar';
import { getCurrentUser, fetchSyncUser, ROLES } from '../../lib/authStore';
import { storyService, adminService, newsletterService, authorService } from '../../lib/services';
import CommandMenu from '../ui/CommandMenu';

function TrafficChart() {
  // Generate random-ish but smooth data for the "Live" effect
  const data = [30, 40, 35, 50, 49, 60, 70, 91, 125, 100, 120, 110, 130, 140, 135, 150, 145, 160, 180, 170, 190, 200, 195, 210];
  const max = Math.max(...data);
  const width = 800;
  const height = 200;
  
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - (val / max) * height;
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `${points} ${width},${height} 0,${height}`;

  return (
    <div className="w-full h-64 relative group">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FAFF00" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#FAFF00" stopOpacity="0" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Grid Lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((p) => (
          <line 
            key={p}
            x1="0" y1={height * p} x2={width} y2={height * p} 
            stroke="rgba(0,0,0,0.03)" 
            strokeWidth="1"
          />
        ))}

        {/* Area Fill */}
        <motion.polyline
          points={areaPoints}
          fill="url(#chartGradient)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5 }}
        />

        {/* The Line */}
        <motion.polyline
          points={points}
          fill="none"
          stroke="#FAFF00"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#glow)"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, ease: "easeInOut" }}
        />

        {/* Animated Scanning Dot */}
        <motion.circle
          r="6"
          fill="black"
          stroke="#FAFF00"
          strokeWidth="2"
          initial={{ cx: 0, cy: height - (data[0] / max) * height }}
          animate={{ 
            cx: width,
            cy: height - (data[data.length-1] / max) * height
          }}
          transition={{ 
            duration: 10, 
            repeat: Infinity, 
            ease: "linear" 
          }}
        />
      </svg>
      
      {/* Tooltip Simulation */}
      <div className="absolute top-0 right-0 flex gap-4">
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Pulse</span>
          <span className="text-2xl font-black text-black leading-none">892.4 <span className="text-xs text-gray-300">RPM</span></span>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [stories, setStories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState([
    { label: "Dispatch Volume", value: "0", sub: "Published", icon: FileText, color: "text-[#FAFF00]" },
    { label: "Reader Depth", value: "0", sub: "Subscribers", icon: Users, color: "text-[#FAFF00]" },
    { label: "System Health", value: "Checking", sub: "Connecting...", icon: Shield, color: "text-[#FAFF00]" },
    { label: "Network Impact", value: "0", sub: "Contributors", icon: Zap, color: "text-[#FAFF00]" },
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
      const subsCount = await newsletterService.getSubscribersCount();
      const authCount = await authorService.getAuthorsCount();
      
      setStories(data);
      setStats([
        { label: "Dispatch Volume", value: data.filter(st => st.status === 'Published' || st.workflow_status === 'published').length.toString(), sub: "Live Stories", icon: FileText, color: "text-[#FAFF00]" },
        { label: "Reader Depth", value: subsCount.toLocaleString(), sub: "Active Subscribers", icon: Users, color: "text-[#FAFF00]" },
        { label: "System Health", value: "100%", sub: "Appwrite Online", icon: Shield, color: "text-[#FAFF00]" },
        { label: "Network Impact", value: authCount.toString(), sub: "Team Members", icon: Zap, color: "text-[#FAFF00]" },
      ]);
    } catch (e) {
      console.error(e);
      setStats(prev => prev.map(s => s.label === "System Health" ? { ...s, value: "Offline", sub: "Connection Error" } : s));
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  const isSuper = user.role === ROLES.ADMIN;

  return (
    <div className="min-h-screen bg-transparent flex font-sans text-gray-900">
      <CommandMenu />
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
                <span className="text-[10px] font-black uppercase tracking-widest text-black bg-[#FAFF00] px-2 py-0.5 rounded">Real-time Telemetry</span>
              </div>
            </div>

            <TrafficChart />

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
import React, { useEffect, useState } from 'react';
import { Layout, FileText, Settings, PenTool, TrendingUp, Users, Clock, ArrowUpRight } from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import { getCurrentUser, ROLES } from '../../lib/authStore';
import { storyService } from '../../lib/services';

const STATS = [
  { label: "Total Views", value: "2.4M", change: "+12%", icon: TrendingUp, color: "text-green-600", bg: "bg-green-100" },
  { label: "Active Readers", value: "850", change: "+5%", icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
  { label: "Avg. Read Time", value: "4m 12s", change: "-2%", icon: Clock, color: "text-orange-600", bg: "bg-orange-100" },
  { label: "Stories Published", value: "142", change: "+8", icon: FileText, color: "text-purple-600", bg: "bg-purple-100" },
];

const RECENT_ACTIVITY = [
  { action: "Published story", target: "The Giant Wakes", user: "Chioma Okafor", time: "2 hours ago" },
  { action: "Edited draft", target: "Future of Nollywood", user: "Admin", time: "5 hours ago" },
  { action: "New comment", target: "Fiber Optic Cables", user: "Reader", time: "1 day ago" },
  { action: "System update", target: "v2.4.0 deployed", user: "System", time: "2 days ago" },
];

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(STATS);

  useEffect(() => {
    const u = getCurrentUser();
    if (!u) {
      window.location.href = '/admin/login';
    } else {
      setUser(u);
      loadLiveStats();
    }
  }, []);

  const loadLiveStats = async () => {
      try {
          const stories = await storyService.getAllStories();
          setStats(prev => prev.map(s => s.label === "Stories Published" ? { ...s, value: stories.length.toString() } : s));
      } catch (e) { console.error(e); }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
      <AdminSidebar activePage="dashboard" />
      
      <main className="ml-64 flex-1 p-8">
        <header className="mb-8">
          <h1 className="text-2xl font-black text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-500 text-sm mt-1">Real-time metrics for Explainer Editorial.</p>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${stat.change.startsWith('+') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {stat.change}
                </span>
              </div>
              <h3 className="text-3xl font-black text-gray-900 mb-1">{stat.value}</h3>
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Chart Placeholder */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg text-gray-900">Traffic Overview</h3>
              <select className="text-sm bg-gray-50 border border-gray-200 rounded-md px-2 py-1 outline-none font-bold">
                <option>Last 30 Days</option>
                <option>Last 7 Days</option>
              </select>
            </div>
            <div className="h-64 flex items-end gap-2 px-2">
              {[40, 65, 45, 80, 55, 90, 70, 85, 60, 75, 50, 95, 60, 40, 80].map((h, i) => (
                <div key={i} className="flex-1 bg-gray-100 rounded-t-sm hover:bg-[#008751] transition-colors relative group">
                   <div style={{ height: `${h}%` }} className="absolute bottom-0 w-full bg-inherit rounded-t-sm"></div>
                   <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] font-bold px-2 py-1 rounded shadow-xl pointer-events-none z-20 whitespace-nowrap">
                     {h * 100} Sessions
                   </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-between text-[10px] text-gray-400 font-black uppercase tracking-widest pt-4 border-t border-gray-50">
              <span>01 Nov</span>
              <span>15 Nov</span>
              <span>30 Nov</span>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="font-bold text-lg text-gray-900 mb-6">Editorial Activity</h3>
            <div className="space-y-6">
              {RECENT_ACTIVITY.map((item, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-2 h-2 mt-2 rounded-full bg-[#008751] shrink-0 shadow-[0_0_8px_rgba(0,135,81,0.5)]"></div>
                  <div>
                    <p className="text-sm text-gray-900 font-medium leading-tight">
                      <span className="font-bold text-black">{item.action}</span>: {item.target}
                    </p>
                    <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-wider">{item.user} • {item.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-8 py-3 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-black border border-gray-100 hover:border-black rounded-lg transition-all flex items-center justify-center gap-2">
              Full Activity Log <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}
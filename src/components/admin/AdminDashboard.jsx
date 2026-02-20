import { useEffect, useState } from 'react';
import { Layout, FileText, Settings, PenTool, TrendingUp, Users, Clock, ArrowUpRight, Shield, Zap, Inbox, Loader2, BarChart3, Activity, Calendar, AlertTriangle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminSidebar from './AdminSidebar';
import AnalyticsPanel from './AnalyticsPanel';
import { getCurrentUser, fetchSyncUser, ROLES } from '../../lib/authStore';
import { storyService, adminService, newsletterService, authorService, assignmentService, activityService } from '../../lib/services';
import CommandMenu from '../ui/CommandMenu';

export default function AdminDashboard() {
    const [user, setUser] = useState(null);
    const [stories, setStories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
    const [overdueAssignments, setOverdueAssignments] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);
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
                loadData(u);
            }
        };
        init();
    }, []);

    const loadData = async (currentUser) => {
        setIsLoading(true);
        try {
            const [data, subsCount, authCount, deadlines, overdue, activity] = await Promise.all([
                storyService.getAllStories(),
                newsletterService.getSubscribersCount(),
                authorService.getAuthorsCount(),
                assignmentService?.getUpcomingDeadlines?.(7) || Promise.resolve([]),
                assignmentService?.getOverdueAssignments?.() || Promise.resolve([]),
                activityService?.getRecentActivity?.(24) || Promise.resolve([])
            ]);
            
            setStories(data);
            setUpcomingDeadlines(deadlines);
            setOverdueAssignments(overdue);
            setRecentActivity(activity);
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

            <main className="lg:ml-64 flex-1 p-4 md:p-8 pt-24 lg:pt-8 bg-gray-50/50">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-black p-2 rounded-lg text-[#FAFF00]">
                                <Zap className="w-5 h-5 fill-[#FAFF00]" />
                            </div>
                            <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Command Center</h1>
                        </div>
                        <p className="text-gray-500 text-sm font-medium">Global newsroom oversight and intelligence metrics.</p>
                    </div>
                    <div className="flex gap-4 w-full md:w-auto">
                        <button onClick={() => window.location.href = '/admin/edit/new-story'} className="flex-1 md:flex-none bg-[#FAFF00] text-black px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all shadow-[0_10px_20px_rgba(250,255,0,0.1)]">
                            Initialize Dispatch
                        </button>
                    </div>
                </header>

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

                <AnalyticsPanel />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
                    <div className="lg:col-span-1 bg-black rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden text-white flex flex-col">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-[#FAFF00]/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                        <div className="flex justify-between items-start mb-6 relative z-10">
                            <div>
                                <h2 className="text-xl font-black uppercase tracking-tighter leading-none mb-1">Review Queue</h2>
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Pending Dispatches</p>
                            </div>
                            <Inbox className="w-6 h-6 text-[#FAFF00]" />
                        </div>

                        <div className="flex-1 space-y-4 relative z-10 overflow-y-auto max-h-[300px] custom-scrollbar pr-2">
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
                                    <CheckCircle className="w-8 h-8 mb-4" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">Inbox Zero</p>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => window.location.href = '/admin/stories'}
                            className="w-full mt-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all"
                        >
                            Access Full Queue
                        </button>
                    </div>

                    <div className="lg:col-span-1 bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-black text-gray-900 uppercase tracking-tighter flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-[#FAFF00]" />
                                Upcoming Deadlines
                            </h2>
                            {overdueAssignments.length > 0 && (
                                <span className="bg-red-100 text-red-700 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
                                    {overdueAssignments.length} Overdue
                                </span>
                            )}
                        </div>

                        {overdueAssignments.length > 0 && (
                            <div className="mb-4 space-y-2">
                                {overdueAssignments.slice(0, 2).map(assignment => (
                                    <div key={assignment.$id} className="p-3 bg-red-50 border border-red-100 rounded-xl">
                                        <div className="flex items-center gap-2 mb-1">
                                            <AlertTriangle className="w-3 h-3 text-red-500" />
                                            <span className="text-[9px] font-black uppercase tracking-widest text-red-600">Overdue</span>
                                        </div>
                                        <p className="text-xs font-bold truncate">{assignment.storyTitle}</p>
                                        <p className="text-[10px] text-gray-500">{assignment.assignedToName}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="space-y-2 max-h-[200px] overflow-y-auto">
                            {upcomingDeadlines.length > 0 ? upcomingDeadlines.map(assignment => (
                                <div key={assignment.$id} className="p-3 bg-gray-50 rounded-xl">
                                    <p className="text-xs font-bold truncate">{assignment.storyTitle}</p>
                                    <div className="flex justify-between items-center mt-1">
                                        <span className="text-[10px] text-gray-500">{assignment.assignedToName}</span>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                                            {new Date(assignment.deadline).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest text-center py-6">No upcoming deadlines</p>
                            )}
                        </div>
                    </div>

                    <div className="lg:col-span-1 bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-black text-gray-900 uppercase tracking-tighter flex items-center gap-2">
                                <Activity className="w-5 h-5 text-[#FAFF00]" />
                                Activity Feed
                            </h2>
                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Last 24h</span>
                        </div>

                        <div className="space-y-3 max-h-[300px] overflow-y-auto">
                            {recentActivity.length > 0 ? recentActivity.map(activity => (
                                <div key={activity.$id} className="flex items-start gap-3 text-xs">
                                    <div className="w-2 h-2 rounded-full bg-[#FAFF00] mt-1.5 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold truncate">{activity.userName || 'System'}</p>
                                        <p className="text-[10px] text-gray-500 truncate">{formatActivityType(activity.type)}</p>
                                    </div>
                                    <span className="text-[9px] text-gray-400 flex-shrink-0">
                                        {formatTimeAgo(activity.timestamp)}
                                    </span>
                                </div>
                            )) : (
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest text-center py-6">No recent activity</p>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

function formatActivityType(type) {
    const labels = {
        'story_created': 'created a story',
        'story_updated': 'updated a story',
        'story_published': 'published a story',
        'story_deleted': 'deleted a story',
        'story_assigned': 'assigned a story',
        'comment_added': 'added a comment',
        'comment_resolved': 'resolved a comment',
        'user_invited': 'invited a user',
        'settings_updated': 'updated settings'
    };
    return labels[type] || type.replace(/_/g, ' ');
}

function formatTimeAgo(timestamp) {
    const now = new Date();
    const then = new Date(timestamp);
    const diff = Math.floor((now - then) / 1000);
    
    if (diff < 60) return 'now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
}
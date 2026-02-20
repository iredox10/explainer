import { useEffect, useState } from 'react';
import { TrendingUp, Users, Eye, Clock, ArrowUpRight, Loader2, BarChart3, MapPin, Globe, Monitor, Smartphone, Tablet } from 'lucide-react';
import { motion } from 'framer-motion';
import { analyticsService } from '../../lib/analytics';
import { storyService } from '../../lib/services';

function RealTrafficChart({ data }) {
    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-gray-400">
                <p className="text-xs font-bold uppercase tracking-widest">No traffic data yet</p>
            </div>
        );
    }

    const max = Math.max(...data.map(d => d.views), 1);
    const width = 800;
    const height = 200;
    
    const points = data.map((d, i) => {
        const x = (i / Math.max(data.length - 1, 1)) * width;
        const y = height - (d.views / max) * height;
        return `${x},${y}`;
    }).join(' ');

    const areaPoints = `${points} ${width},${height} 0,${height}`;

    return (
        <div className="w-full h-64 relative">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                <defs>
                    <linearGradient id="realChartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FAFF00" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#FAFF00" stopOpacity="0" />
                    </linearGradient>
                </defs>
                
                {[0, 0.25, 0.5, 0.75, 1].map((p) => (
                    <line 
                        key={p}
                        x1="0" y1={height * p} x2={width} y2={height * p} 
                        stroke="rgba(0,0,0,0.03)" 
                        strokeWidth="1"
                    />
                ))}

                <motion.polyline
                    points={areaPoints}
                    fill="url(#realChartGradient)"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1.5 }}
                />

                <motion.polyline
                    points={points}
                    fill="none"
                    stroke="#FAFF00"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 2, ease: "easeInOut" }}
                />
            </svg>
            
            <div className="absolute top-0 right-0 flex gap-4">
                <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Views</span>
                    <span className="text-2xl font-black text-black leading-none">{data.reduce((a, b) => a + b.views, 0).toLocaleString()}</span>
                </div>
            </div>
        </div>
    );
}

function ReferrerBadge({ source }) {
    const colors = {
        'Google': 'bg-blue-50 text-blue-700',
        'Twitter/X': 'bg-sky-50 text-sky-700',
        'Facebook': 'bg-indigo-50 text-indigo-700',
        'LinkedIn': 'bg-blue-50 text-blue-700',
        'Reddit': 'bg-orange-50 text-orange-700',
        'Direct': 'bg-gray-50 text-gray-700'
    };
    
    return (
        <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded ${colors[source] || 'bg-gray-50 text-gray-700'}`}>
            {source}
        </span>
    );
}

function DeviceIcon({ device }) {
    switch (device) {
        case 'mobile':
            return <Smartphone className="w-4 h-4" />;
        case 'tablet':
            return <Tablet className="w-4 h-4" />;
        default:
            return <Monitor className="w-4 h-4" />;
    }
}

export default function AnalyticsPanel() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [trafficByDay, setTrafficByDay] = useState([]);
    const [topStories, setTopStories] = useState([]);
    const [referrers, setReferrers] = useState([]);

    useEffect(() => {
        loadAnalytics();
    }, []);

    const loadAnalytics = async () => {
        setLoading(true);
        try {
            const [dashboardStats, traffic, stories, refs] = await Promise.all([
                analyticsService.getDashboardStats(7),
                analyticsService.getTrafficByDay(30),
                analyticsService.getTopStories(5, 7),
                analyticsService.getReferralSources(7)
            ]);
            
            setStats(dashboardStats);
            setTrafficByDay(traffic);
            setReferrers(refs);

            if (stories.length > 0) {
                const storyDetails = await Promise.all(
                    stories.slice(0, 5).map(async ({ storyId, views }) => {
                        try {
                            const story = await storyService.getStoryById(storyId);
                            return { ...story, views };
                        } catch {
                            return { $id: storyId, headline: 'Unknown', views };
                        }
                    })
                );
                setTopStories(storyDetails);
            }
        } catch (e) {
            console.error('Error loading analytics:', e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="animate-spin w-12 h-12 text-[#FAFF00]" />
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white rounded-3xl md:rounded-[2.5rem] p-6 md:p-10 shadow-2xl border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-[#FAFF00]"></div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
                    <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Traffic Overview</h2>
                    <div className="flex gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse mt-1 sm:mt-0"></span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-black bg-[#FAFF00] px-2 py-0.5 rounded">Last 30 Days</span>
                    </div>
                </div>

                <RealTrafficChart data={trafficByDay} />

                <div className="mt-8 pt-8 border-t border-gray-50 grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Total Pageviews</p>
                        <p className="text-2xl font-black text-gray-900">{stats?.totalPageviews?.toLocaleString() || 0}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Unique Visitors</p>
                        <p className="text-2xl font-black text-gray-900">{stats?.uniqueVisitors?.toLocaleString() || 0}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Stories Viewed</p>
                        <p className="text-2xl font-black text-gray-900">{stats?.storiesViewed || 0}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Avg. Views/Story</p>
                        <p className="text-2xl font-black text-gray-900">
                            {stats?.totalPageviews && stats?.storiesViewed 
                                ? Math.round(stats.totalPageviews / stats.storiesViewed) 
                                : 0}
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-8">
                <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
                    <h3 className="text-lg font-black text-gray-900 uppercase tracking-tighter mb-4 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-[#FAFF00]" />
                        Top Stories
                    </h3>
                    <div className="space-y-3">
                        {topStories.length > 0 ? topStories.map((story, i) => (
                            <a 
                                key={story.$id}
                                href={`/admin/edit/${story.$id}`}
                                className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all group"
                            >
                                <span className="text-lg font-black text-gray-300">{i + 1}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold truncate">{story.headline || 'Untitled'}</p>
                                    <p className="text-[10px] text-gray-400 font-bold">{story.views?.toLocaleString()} views</p>
                                </div>
                                <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-[#FAFF00] transition-colors" />
                            </a>
                        )) : (
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest text-center py-4">No data yet</p>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
                    <h3 className="text-lg font-black text-gray-900 uppercase tracking-tighter mb-4 flex items-center gap-2">
                        <Globe className="w-4 h-4 text-[#FAFF00]" />
                        Traffic Sources
                    </h3>
                    <div className="space-y-3">
                        {referrers.length > 0 ? referrers.slice(0, 6).map(({ source, count }) => (
                            <div key={source} className="flex items-center justify-between">
                                <ReferrerBadge source={source} />
                                <span className="text-xs font-black text-gray-700">{count.toLocaleString()}</span>
                            </div>
                        )) : (
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest text-center py-4">No data yet</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export function StoryAnalyticsWidget({ storyId }) {
    const [analytics, setAnalytics] = useState(null);
    const [scrollDepth, setScrollDepth] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStoryAnalytics();
    }, [storyId]);

    const loadStoryAnalytics = async () => {
        if (!storyId) return;
        setLoading(true);
        try {
            const [storyStats, depth] = await Promise.all([
                analyticsService.getStoryAnalytics(storyId, 30),
                analyticsService.getScrollDepthStats(storyId)
            ]);
            setAnalytics(storyStats);
            setScrollDepth(depth);
        } catch (e) {
            console.error('Error loading story analytics:', e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <Loader2 className="animate-spin w-6 h-6 text-[#FAFF00]" />;
    }

    return (
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-lg">
            <h4 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-3">Performance (30 days)</h4>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <p className="text-2xl font-black text-gray-900">{analytics?.totalViews || 0}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Views</p>
                </div>
                <div>
                    <p className="text-2xl font-black text-gray-900">{analytics?.uniqueVisitors || 0}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Unique</p>
                </div>
            </div>
            
            {scrollDepth && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Scroll Depth</p>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex">
                        <div className="bg-red-400 h-full" style={{ width: `${(scrollDepth.depthBuckets['0-25'] / scrollDepth.totalReaders) * 100}%` }} />
                        <div className="bg-yellow-400 h-full" style={{ width: `${(scrollDepth.depthBuckets['25-50'] / scrollDepth.totalReaders) * 100}%` }} />
                        <div className="bg-blue-400 h-full" style={{ width: `${(scrollDepth.depthBuckets['50-75'] / scrollDepth.totalReaders) * 100}%` }} />
                        <div className="bg-green-400 h-full" style={{ width: `${(scrollDepth.depthBuckets['75-100'] / scrollDepth.totalReaders) * 100}%` }} />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">Avg: {scrollDepth.avgDepth}% · Completions: {scrollDepth.completions}</p>
                </div>
            )}
        </div>
    );
}
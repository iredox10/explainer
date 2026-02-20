import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Image, FileText, Tag, User, Link, Search, Loader2, ExternalLink, RefreshCw } from 'lucide-react';
import { storyService } from '../../lib/services';

export default function ContentAuditDashboard() {
    const [loading, setLoading] = useState(true);
    const [stories, setStories] = useState([]);
    const [issues, setIssues] = useState([]);
    const [activeFilter, setActiveFilter] = useState('all');

    useEffect(() => {
        loadAuditData();
    }, []);

    const loadAuditData = async () => {
        setLoading(true);
        try {
            const data = await storyService.getAllStories();
            setStories(data);
            
            const foundIssues = [];
            
            data.forEach(story => {
                if (!story.headline) {
                    foundIssues.push({
                        type: 'missing_headline',
                        severity: 'critical',
                        story,
                        message: 'Missing headline'
                    });
                }
                
                if (!story.heroImage) {
                    foundIssues.push({
                        type: 'missing_hero_image',
                        severity: 'warning',
                        story,
                        message: 'Missing hero image'
                    });
                }
                
                if (!story.category) {
                    foundIssues.push({
                        type: 'missing_category',
                        severity: 'warning',
                        story,
                        message: 'Missing category'
                    });
                }
                
                if (!story.author) {
                    foundIssues.push({
                        type: 'missing_author',
                        severity: 'warning',
                        story,
                        message: 'Missing author'
                    });
                }
                
                const content = story.content || [];
                const contentText = content
                    .filter(b => b.type === 'p' || b.type === 'heading')
                    .map(b => b.text || '')
                    .join(' ');
                const wordCount = contentText.split(/\s+/).filter(w => w.length > 0).length;
                
                if (wordCount < 100 && story.status === 'Published') {
                    foundIssues.push({
                        type: 'thin_content',
                        severity: 'warning',
                        story,
                        message: `Thin content (${wordCount} words)`
                    });
                }
                
                if (!story.seo?.keywords?.length) {
                    foundIssues.push({
                        type: 'missing_seo_keywords',
                        severity: 'info',
                        story,
                        message: 'Missing SEO keywords'
                    });
                }
                
                if (!story.seo?.ogDescription && !story.subhead) {
                    foundIssues.push({
                        type: 'missing_og_description',
                        severity: 'info',
                        story,
                        message: 'Missing social description'
                    });
                }
                
                if (story.status === 'Draft') {
                    const created = new Date(story.$createdAt);
                    const daysOld = Math.floor((Date.now() - created.getTime()) / (1000 * 60 * 60 * 24));
                    if (daysOld > 30) {
                        foundIssues.push({
                            type: 'stale_draft',
                            severity: 'info',
                            story,
                            message: `Stale draft (${daysOld} days old)`
                        });
                    }
                }
            });
            
            setIssues(foundIssues);
        } catch (e) {
            console.error('Error loading audit data:', e);
        } finally {
            setLoading(false);
        }
    };

    const filteredIssues = activeFilter === 'all' 
        ? issues 
        : issues.filter(i => i.severity === activeFilter);

    const issueCounts = {
        all: issues.length,
        critical: issues.filter(i => i.severity === 'critical').length,
        warning: issues.filter(i => i.severity === 'warning').length,
        info: issues.filter(i => i.severity === 'info').length
    };

    const getIssueIcon = (type) => {
        switch (type) {
            case 'missing_headline': return <FileText className="w-4 h-4" />;
            case 'missing_hero_image': return <Image className="w-4 h-4" />;
            case 'missing_category': return <Tag className="w-4 h-4" />;
            case 'missing_author': return <User className="w-4 h-4" />;
            case 'broken_link': return <Link className="w-4 h-4" />;
            default: return <AlertTriangle className="w-4 h-4" />;
        }
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'critical': return 'bg-red-50 text-red-700 border-red-200';
            case 'warning': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
            default: return 'bg-blue-50 text-blue-700 border-blue-200';
        }
    };

    const getSeverityBadge = (severity) => {
        switch (severity) {
            case 'critical': return 'bg-red-100 text-red-700';
            case 'warning': return 'bg-yellow-100 text-yellow-700';
            default: return 'bg-blue-100 text-blue-700';
        }
    };

    return (
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-black rounded-lg">
                            <Search className="w-5 h-5 text-[#FAFF00]" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Content Audit</h2>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                {issues.length} issues found across {stories.length} stories
                            </p>
                        </div>
                    </div>
                    
                    <button
                        onClick={loadAuditData}
                        disabled={loading}
                        className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-all"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                <div className="flex gap-2 mt-6">
                    {['all', 'critical', 'warning', 'info'].map((filter) => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                activeFilter === filter
                                    ? 'bg-black text-[#FAFF00]'
                                    : 'bg-white text-gray-400 hover:bg-gray-100'
                            }`}
                        >
                            {filter} ({issueCounts[filter]})
                        </button>
                    ))}
                </div>
            </div>

            <div className="p-6">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="animate-spin w-8 h-8 text-[#FAFF00]" />
                    </div>
                ) : filteredIssues.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <CheckCircle className="w-12 h-12 mb-4 text-green-500" />
                        <p className="text-sm font-bold uppercase tracking-widest">
                            {activeFilter === 'all' ? 'All clear!' : `No ${activeFilter} issues`}
                        </p>
                        <p className="text-xs mt-1">Your content is in good shape.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredIssues.map((issue, i) => (
                            <div
                                key={`${issue.story.$id}-${issue.type}`}
                                className={`flex items-center gap-4 p-4 rounded-xl border ${getSeverityColor(issue.severity)}`}
                            >
                                <div className="w-10 h-10 rounded-lg bg-white/50 flex items-center justify-center">
                                    {getIssueIcon(issue.type)}
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold truncate">{issue.message}</p>
                                    <p className="text-xs text-gray-500 truncate">
                                        {issue.story.headline || 'Untitled'}
                                    </p>
                                </div>

                                <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest ${getSeverityBadge(issue.severity)}`}>
                                    {issue.severity}
                                </span>

                                <a
                                    href={`/admin/edit/${issue.story.$id}`}
                                    className="p-2 text-gray-400 hover:text-black hover:bg-white rounded-lg transition-all"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50">
                <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                        <p className="text-2xl font-black text-gray-900">{stories.length}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Stories</p>
                    </div>
                    <div>
                        <p className="text-2xl font-black text-red-600">{issueCounts.critical}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Critical</p>
                    </div>
                    <div>
                        <p className="text-2xl font-black text-yellow-600">{issueCounts.warning}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Warnings</p>
                    </div>
                    <div>
                        <p className="text-2xl font-black text-blue-600">{issueCounts.info}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Suggestions</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
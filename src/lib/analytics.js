import { databases, DB_ID, COLLECTIONS } from './appwrite';
import { Query, ID } from 'appwrite';

export const analyticsService = {
    async trackPageview(data) {
        try {
            const pageview = await databases.createDocument(
                DB_ID,
                COLLECTIONS.ANALYTICS,
                ID.unique(),
                {
                    ...data,
                    timestamp: new Date().toISOString(),
                    date: new Date().toISOString().split('T')[0]
                }
            );
            return pageview;
        } catch (error) {
            console.error('Error tracking pageview:', error);
            return null;
        }
    },

    async trackScrollDepth(storyId, data) {
        try {
            const scrollData = await databases.createDocument(
                DB_ID,
                COLLECTIONS.SCROLL_DEPTH,
                ID.unique(),
                {
                    storyId,
                    ...data,
                    timestamp: new Date().toISOString()
                }
            );
            return scrollData;
        } catch (error) {
            console.error('Error tracking scroll depth:', error);
            return null;
        }
    },

    async getStoryAnalytics(storyId, days = 30) {
        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            
            const response = await databases.listDocuments(
                DB_ID,
                COLLECTIONS.ANALYTICS,
                [
                    Query.equal('storyId', storyId),
                    Query.greaterThanEqual('timestamp', startDate.toISOString()),
                    Query.orderDesc('timestamp'),
                    Query.limit(1000)
                ]
            );
            
            return this.aggregateAnalytics(response.documents);
        } catch (error) {
            console.error('Error fetching story analytics:', error);
            return this.getEmptyAnalytics();
        }
    },

    async getDashboardStats(days = 7) {
        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            
            const response = await databases.listDocuments(
                DB_ID,
                COLLECTIONS.ANALYTICS,
                [
                    Query.greaterThanEqual('timestamp', startDate.toISOString()),
                    Query.orderDesc('timestamp'),
                    Query.limit(5000)
                ]
            );
            
            return this.aggregateDashboardStats(response.documents);
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            return this.getEmptyDashboardStats();
        }
    },

    async getTopStories(limit = 10, days = 7) {
        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            
            const response = await databases.listDocuments(
                DB_ID,
                COLLECTIONS.ANALYTICS,
                [
                    Query.greaterThanEqual('timestamp', startDate.toISOString()),
                    Query.limit(5000)
                ]
            );
            
            const storyViews = {};
            response.documents.forEach(doc => {
                if (doc.storyId) {
                    storyViews[doc.storyId] = (storyViews[doc.storyId] || 0) + 1;
                }
            });
            
            const sorted = Object.entries(storyViews)
                .sort((a, b) => b[1] - a[1])
                .slice(0, limit)
                .map(([storyId, views]) => ({ storyId, views }));
            
            return sorted;
        } catch (error) {
            console.error('Error fetching top stories:', error);
            return [];
        }
    },

    async getTrafficByDay(days = 30) {
        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            
            const response = await databases.listDocuments(
                DB_ID,
                COLLECTIONS.ANALYTICS,
                [
                    Query.greaterThanEqual('timestamp', startDate.toISOString()),
                    Query.orderAsc('timestamp'),
                    Query.limit(10000)
                ]
            );
            
            const byDay = {};
            response.documents.forEach(doc => {
                const day = doc.date || doc.timestamp.split('T')[0];
                byDay[day] = (byDay[day] || 0) + 1;
            });
            
            return Object.entries(byDay)
                .map(([date, views]) => ({ date, views }))
                .sort((a, b) => a.date.localeCompare(b.date));
        } catch (error) {
            console.error('Error fetching traffic by day:', error);
            return [];
        }
    },

    async getReferralSources(days = 30) {
        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            
            const response = await databases.listDocuments(
                DB_ID,
                COLLECTIONS.ANALYTICS,
                [
                    Query.greaterThanEqual('timestamp', startDate.toISOString()),
                    Query.limit(5000)
                ]
            );
            
            const sources = {};
            response.documents.forEach(doc => {
                const source = this.parseReferrer(doc.referrer);
                sources[source] = (sources[source] || 0) + 1;
            });
            
            return Object.entries(sources)
                .map(([source, count]) => ({ source, count }))
                .sort((a, b) => b.count - a.count);
        } catch (error) {
            console.error('Error fetching referral sources:', error);
            return [];
        }
    },

    async getScrollDepthStats(storyId) {
        try {
            const response = await databases.listDocuments(
                DB_ID,
                COLLECTIONS.SCROLL_DEPTH,
                [
                    Query.equal('storyId', storyId),
                    Query.orderDesc('timestamp'),
                    Query.limit(1000)
                ]
            );
            
            return this.aggregateScrollDepth(response.documents);
        } catch (error) {
            console.error('Error fetching scroll depth stats:', error);
            return null;
        }
    },

    aggregateAnalytics(documents) {
        const totalViews = documents.length;
        const uniqueVisitors = new Set(documents.map(d => d.visitorId)).size;
        const avgTimeOnPage = this.calculateAvgTime(documents);
        const byReferrer = this.groupBy(documents, 'referrer');
        const byDevice = this.groupBy(documents, 'device');
        
        return {
            totalViews,
            uniqueVisitors,
            avgTimeOnPage,
            byReferrer,
            byDevice,
            documents
        };
    },

    aggregateDashboardStats(documents) {
        const totalPageviews = documents.length;
        const uniqueVisitors = new Set(documents.map(d => d.visitorId)).size;
        const byStory = this.groupBy(documents, 'storyId');
        const byReferrer = this.groupBy(documents, 'referrer');
        const byPath = this.groupBy(documents, 'path');
        
        return {
            totalPageviews,
            uniqueVisitors,
            storiesViewed: Object.keys(byStory).length,
            topReferrers: Object.entries(byReferrer)
                .sort((a, b) => b[1].length - a[1].length)
                .slice(0, 5)
                .map(([source, docs]) => ({ source, count: docs.length })),
            topPages: Object.entries(byPath)
                .sort((a, b) => b[1].length - a[1].length)
                .slice(0, 10)
                .map(([path, docs]) => ({ path, views: docs.length }))
        };
    },

    aggregateScrollDepth(documents) {
        if (documents.length === 0) return null;
        
        const depthBuckets = {
            '0-25': 0,
            '25-50': 0,
            '50-75': 0,
            '75-100': 0
        };
        
        let totalDepth = 0;
        documents.forEach(doc => {
            const depth = doc.maxDepth || 0;
            totalDepth += depth;
            
            if (depth < 25) depthBuckets['0-25']++;
            else if (depth < 50) depthBuckets['25-50']++;
            else if (depth < 75) depthBuckets['50-75']++;
            else depthBuckets['75-100']++;
        });
        
        return {
            avgDepth: Math.round(totalDepth / documents.length),
            depthBuckets,
            totalReaders: documents.length,
            completions: depthBuckets['75-100']
        };
    },

    groupBy(arr, key) {
        return arr.reduce((acc, item) => {
            const value = item[key] || 'unknown';
            if (!acc[value]) acc[value] = [];
            acc[value].push(item);
            return acc;
        }, {});
    },

    calculateAvgTime(documents) {
        const times = documents.filter(d => d.timeOnPage).map(d => d.timeOnPage);
        if (times.length === 0) return 0;
        return Math.round(times.reduce((a, b) => a + b, 0) / times.length);
    },

    parseReferrer(referrer) {
        if (!referrer || referrer === 'direct') return 'Direct';
        try {
            const url = new URL(referrer);
            const hostname = url.hostname.replace('www.', '');
            
            if (hostname.includes('google')) return 'Google';
            if (hostname.includes('twitter') || hostname.includes('t.co') || hostname.includes('x.com')) return 'Twitter/X';
            if (hostname.includes('facebook') || hostname.includes('fb.com')) return 'Facebook';
            if (hostname.includes('linkedin')) return 'LinkedIn';
            if (hostname.includes('reddit')) return 'Reddit';
            return hostname;
        } catch {
            return 'Other';
        }
    },

    getEmptyAnalytics() {
        return {
            totalViews: 0,
            uniqueVisitors: 0,
            avgTimeOnPage: 0,
            byReferrer: {},
            byDevice: {},
            documents: []
        };
    },

    getEmptyDashboardStats() {
        return {
            totalPageviews: 0,
            uniqueVisitors: 0,
            storiesViewed: 0,
            topReferrers: [],
            topPages: []
        };
    }
};

export function useAnalytics() {
    const trackPageview = async (data) => {
        const visitorId = localStorage.getItem('explainer_visitor_id') || 
            'v_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('explainer_visitor_id', visitorId);
        
        return analyticsService.trackPageview({
            ...data,
            visitorId,
            referrer: document.referrer || 'direct',
            device: getDeviceType(),
            path: window.location.pathname,
            userAgent: navigator.userAgent
        });
    };

    const trackScrollDepth = async (storyId, maxDepth) => {
        const visitorId = localStorage.getItem('explainer_visitor_id');
        return analyticsService.trackScrollDepth(storyId, {
            visitorId,
            maxDepth,
            viewport: `${window.innerWidth}x${window.innerHeight}`
        });
    };

    return { trackPageview, trackScrollDepth };
}

function getDeviceType() {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
        return 'tablet';
    }
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
        return 'mobile';
    }
    return 'desktop';
}

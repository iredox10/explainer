import { useEffect, useRef, useCallback } from 'react';
import { analyticsService } from '../lib/analytics';

export function useScrollTracking(storyId, options = {}) {
    const {
        threshold = [25, 50, 75, 100],
        debounceMs = 500,
        trackTime = true
    } = options;

    const trackedDepths = useRef(new Set());
    const maxDepth = useRef(0);
    const startTime = useRef(Date.now());
    const hasTracked = useRef(false);

    const trackDepth = useCallback(async (depth) => {
        if (trackedDepths.current.has(depth)) return;
        
        trackedDepths.current.add(depth);
        
        try {
            await analyticsService.trackScrollDepth(storyId, {
                maxDepth: depth,
                timeOnPage: trackTime ? Date.now() - startTime.current : undefined
            });
        } catch (e) {
            console.error('Error tracking scroll depth:', e);
        }
    }, [storyId, trackTime]);

    const handleScroll = useCallback(() => {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrollPercent = Math.round((scrollTop / scrollHeight) * 100);

        if (scrollPercent > maxDepth.current) {
            maxDepth.current = scrollPercent;
        }

        threshold.forEach(t => {
            if (scrollPercent >= t && !trackedDepths.current.has(t)) {
                trackDepth(t);
            }
        });
    }, [threshold, trackDepth]);

    useEffect(() => {
        if (!storyId) return;

        let timeoutId;
        const debouncedScroll = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(handleScroll, debounceMs);
        };

        window.addEventListener('scroll', debouncedScroll, { passive: true });

        const handleBeforeUnload = async () => {
            if (maxDepth.current > 0 && !hasTracked.current) {
                hasTracked.current = true;
                await analyticsService.trackScrollDepth(storyId, {
                    maxDepth: maxDepth.current,
                    timeOnPage: Date.now() - startTime.current,
                    isFinal: true
                });
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('scroll', debouncedScroll);
            window.removeEventListener('beforeunload', handleBeforeUnload);
            clearTimeout(timeoutId);
        };
    }, [storyId, handleScroll, debounceMs]);

    return {
        currentDepth: maxDepth.current,
        trackedThresholds: Array.from(trackedDepths.current)
    };
}

export function usePageviewTracking() {
    const tracked = useRef(false);

    useEffect(() => {
        if (tracked.current) return;
        tracked.current = true;

        const visitorId = localStorage.getItem('explainer_visitor_id') || 
            'v_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('explainer_visitor_id', visitorId);

        const trackPageview = async () => {
            try {
                await analyticsService.trackPageview({
                    visitorId,
                    path: window.location.pathname,
                    referrer: document.referrer || 'direct',
                    device: getDeviceType(),
                    userAgent: navigator.userAgent,
                    timestamp: new Date().toISOString()
                });
            } catch (e) {
                console.error('Error tracking pageview:', e);
            }
        };

        trackPageview();
    }, []);
}

export function useStoryPageview(storyId) {
    const tracked = useRef(false);

    useEffect(() => {
        if (!storyId || tracked.current) return;
        tracked.current = true;

        const visitorId = localStorage.getItem('explainer_visitor_id') || 
            'v_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('explainer_visitor_id', visitorId);

        const trackStoryView = async () => {
            try {
                await analyticsService.trackPageview({
                    storyId,
                    visitorId,
                    path: window.location.pathname,
                    referrer: document.referrer || 'direct',
                    device: getDeviceType(),
                    userAgent: navigator.userAgent,
                    timestamp: new Date().toISOString()
                });
            } catch (e) {
                console.error('Error tracking story view:', e);
            }
        };

        trackStoryView();
    }, [storyId]);
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

export function ScrollytellingTracker({ storyId, totalSteps, currentStep }) {
    useEffect(() => {
        if (!storyId || currentStep === undefined) return;

        const trackStep = async () => {
            try {
                const depth = Math.round(((currentStep + 1) / totalSteps) * 100);
                await analyticsService.trackScrollDepth(storyId, {
                    maxDepth: depth,
                    currentStep,
                    totalSteps,
                    stepReached: true
                });
            } catch (e) {
                console.error('Error tracking scrolly step:', e);
            }
        };

        if (currentStep === totalSteps - 1) {
            trackStep();
        }
    }, [storyId, currentStep, totalSteps]);

    return null;
}
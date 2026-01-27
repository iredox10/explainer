const ANALYTICS_KEY = import.meta.env.PUBLIC_ANALYTICS_KEY;

export const analytics = {
    enabled: !!ANALYTICS_KEY,
    track(event, payload = {}) {
        if (!ANALYTICS_KEY || typeof window === 'undefined') return;
        if (!window.gtag) return;
        window.gtag('event', event, payload);
    }
};

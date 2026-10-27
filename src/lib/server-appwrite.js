import { API_URL, apiFetch, internalFetch, unwrapDocuments, withQuery } from './api.js';

const RETRYABLE_CODES = new Set(['ETIMEDOUT', 'ECONNRESET', 'ENOTFOUND', 'EAI_AGAIN']);
const REQUEST_TIMEOUT_MS = 8000;

function isRetryable(error) {
    if (!error) return false;
    if (error.name === 'TimeoutError' || error.name === 'AbortError') return true;
    if (RETRYABLE_CODES.has(error.code)) return true;
    return /fetch failed|network|timeout/i.test(error.message || '');
}

async function request(path, options = {}, fallback = null) {
    const { retries = 3, ...rest } = options;
    let lastError;

    for (let attempt = 0; attempt < retries; attempt += 1) {
        try {
            return await apiFetch(path, {
                auth: false,
                credentials: 'omit',
                signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
                ...rest,
            });
        } catch (error) {
            lastError = error;
            if (!isRetryable(error) || attempt === retries - 1) break;
            await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
        }
    }

    console.error(`[SERVER-API] ${options.method || 'GET'} ${path} failed:`, lastError?.message || lastError);
    return fallback;
}

async function requestInternal(path, fallback = null) {
    try {
        return await internalFetch(path, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    } catch (error) {
        console.error(`[SERVER-API] internal GET ${path} failed:`, error?.message || error);
        return fallback;
    }
}

export const serverStoryService = {
    async getStoryById(id) {
        return request(`/api/stories/${encodeURIComponent(id)}`);
    },

    async getPreviewStoryById(id) {
        return requestInternal(`/api/internal/stories/${encodeURIComponent(id)}`);
    },

    async getStoryBySlug(slug) {
        return request(`/api/stories/${encodeURIComponent(slug)}`);
    },

    async getPublishedStories() {
        const payload = await request(withQuery('/api/stories', { limit: 200, sort: '-publishedAt' }), {}, { documents: [] });
        return unwrapDocuments(payload);
    },

    async searchStories(queryText) {
        const payload = await request(
            withQuery('/api/stories', { q: queryText, limit: 10 }),
            {},
            { documents: [] },
        );
        return unwrapDocuments(payload);
    },

    async getAllStories() {
        const payload = await request(withQuery('/api/stories', { limit: 200, sort: '-createdAt' }), {}, { documents: [] });
        return unwrapDocuments(payload);
    },

    calculateReadTime(content) {
        try {
            const blocks = typeof content === 'string' ? JSON.parse(content) : content;
            if (!Array.isArray(blocks)) return 1;
            const text = blocks.map((block) => block.text || '').join(' ');
            const wordsPerMinute = 225;
            const words = text.trim().split(/\s+/).filter(Boolean).length;
            return Math.ceil(words / wordsPerMinute) || 1;
        } catch (error) {
            return 1;
        }
    },
};

let settingsCache = null;
let settingsFetchedAt = 0;
const SETTINGS_TTL = 5 * 60 * 1000;

export const serverAdminService = {
    async getSettings() {
        const now = Date.now();
        if (settingsCache && now - settingsFetchedAt < SETTINGS_TTL) {
            return settingsCache;
        }

        const payload = await request('/api/settings');
        if (payload) {
            settingsCache = payload;
            settingsFetchedAt = now;
            return payload;
        }

        if (settingsCache) return settingsCache;
        return { maintenance_mode: false };
    },
};

export const serverCategoryService = {
    async getCategories() {
        const payload = await request('/api/categories', {}, { documents: [] });
        return unwrapDocuments(payload);
    },

    async getCategoryBySlug(slug) {
        return request(`/api/categories/${encodeURIComponent(slug)}`);
    },
};

export const serverNewsletterService = {
    async subscribe(email) {
        return apiFetch('/api/subscribers', {
            method: 'POST',
            auth: false,
            credentials: 'omit',
            body: { email },
        });
    },
};

export { API_URL };

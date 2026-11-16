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
// Settings drive sitewide behaviour (site name, breaking-news banner,
// maintenance mode) and editors expect their changes to show up immediately,
// so keep the cache window very short rather than the old 5 minutes.
const SETTINGS_TTL = 5 * 1000;

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

let categoriesCache = null;
let categoriesFetchedAt = 0;
const CATEGORIES_TTL = 60 * 1000;

export const serverCategoryService = {
    async getCategories() {
        const now = Date.now();
        if (categoriesCache && now - categoriesFetchedAt < CATEGORIES_TTL) {
            return categoriesCache;
        }

        const payload = await request('/api/categories', {}, { documents: [] });
        const categories = unwrapDocuments(payload);

        if (categories.length > 0) {
            categoriesCache = categories;
            categoriesFetchedAt = now;
            return categories;
        }

        if (categoriesCache) return categoriesCache;
        return categories;
    },

    async getCategoryBySlug(slug) {
        return request(`/api/categories/${encodeURIComponent(slug)}`);
    },
};

let authorsCache = null;
let authorsFetchedAt = 0;
const AUTHORS_TTL = 60 * 1000;

export const serverAuthorService = {
    async getAuthors() {
        const now = Date.now();
        if (authorsCache && now - authorsFetchedAt < AUTHORS_TTL) {
            return authorsCache;
        }

        const payload = await request('/api/authors', {}, { documents: [] });
        const authors = unwrapDocuments(payload);

        if (authors.length > 0) {
            authorsCache = authors;
            authorsFetchedAt = now;
            return authors;
        }

        if (authorsCache) return authorsCache;
        return authors;
    },

    // request() already resolves to null for a 404 (it only retries network
    // errors and returns the fallback), so a missing author never throws here.
    async getAuthorBySlug(slug) {
        return request(`/api/authors/${encodeURIComponent(slug)}`, {}, null);
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

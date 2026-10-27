const env = import.meta.env || process.env;

export const API_URL = (env.PUBLIC_API_URL || 'http://localhost:8787').replace(/\/$/, '');

export const AUTH_TOKEN_KEY = 'explainer_api_token';

export class ApiError extends Error {
    constructor(message, status, payload) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.payload = payload;
    }
}

export function apiUrl(path) {
    if (/^https?:\/\//i.test(path)) return path;
    return `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export function mediaUrl(url) {
    if (!url) return url;
    if (/^(https?:|data:|blob:)/i.test(url)) return url;
    return apiUrl(url);
}

export function withQuery(path, params = {}) {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return;
        search.set(key, String(value));
    });
    const query = search.toString();
    return query ? `${path}?${query}` : path;
}

export function getAuthToken() {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token) {
    if (typeof window === 'undefined') return;
    if (token) window.localStorage.setItem(AUTH_TOKEN_KEY, token);
    else window.localStorage.removeItem(AUTH_TOKEN_KEY);
}

export function clearAuthToken() {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
}

export async function apiFetch(path, options = {}) {
    const {
        method = 'GET',
        body,
        auth = true,
        headers = {},
        signal,
        credentials = 'include',
        returnResponse = false,
    } = options;

    const requestHeaders = { ...headers };
    const token = auth ? getAuthToken() : null;
    if (token) requestHeaders.Authorization = `Bearer ${token}`;

    let requestBody = body;
    if (body !== undefined && !(body instanceof FormData)) {
        requestHeaders['Content-Type'] = requestHeaders['Content-Type'] || 'application/json';
        requestBody = JSON.stringify(body);
    }

    const response = await fetch(apiUrl(path), {
        method,
        headers: requestHeaders,
        body: requestBody,
        credentials,
        signal,
    });

    const contentType = response.headers.get('content-type') || '';
    let payload = null;
    if (contentType.includes('application/json')) {
        payload = await response.json().catch(() => null);
    } else {
        payload = await response.text().catch(() => '');
    }

    if (!response.ok) {
        const message =
            (payload && typeof payload === 'object' && (payload.message || payload.error)) ||
            (typeof payload === 'string' && payload) ||
            `Request failed with status ${response.status}`;
        throw new ApiError(message, response.status, payload);
    }

    if (returnResponse) return { data: payload, response };
    return payload;
}

export async function internalFetch(path, options = {}) {
    const runtimeEnv = typeof process !== 'undefined' ? process.env : {};
    const key = runtimeEnv.INTERNAL_API_KEY || env.INTERNAL_API_KEY;
    if (!key) {
        throw new Error('INTERNAL_API_KEY is not configured on the frontend server');
    }
    return apiFetch(path, {
        ...options,
        auth: false,
        credentials: 'omit',
        headers: { ...(options.headers || {}), 'x-internal-key': key },
    });
}

export function unwrapDocuments(payload) {
    if (Array.isArray(payload)) return payload;
    return payload?.documents ?? [];
}

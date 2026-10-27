import type { Context } from 'hono';

export type Json = Record<string, unknown>;

export function toIso(value: unknown): string | null {
    if (!value) return null;
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'string') {
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
    }
    return null;
}

export function toDate(value: unknown): Date | null {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === 'string' || typeof value === 'number') {
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    return null;
}

/**
 * The existing admin UI was written against Appwrite documents, so responses
 * expose both native fields and the Appwrite aliases it reads ($id/$createdAt).
 */
export function serializeRow<T extends Record<string, unknown>>(row: T): T & {
    $id: unknown;
    $createdAt: string | null;
    $updatedAt: string | null;
} {
    return {
        ...row,
        $id: row.id,
        $createdAt:
            toIso(row.createdAt) ??
            toIso(row.uploadedAt) ??
            toIso(row.timestamp) ??
            toIso(row.subscribedAt),
        $updatedAt:
            toIso(row.updatedAt) ??
            toIso(row.uploadedAt) ??
            toIso(row.createdAt) ??
            toIso(row.timestamp),
    };
}

export function parseJson<T>(value: unknown, fallback: T): T {
    if (value === null || value === undefined) return fallback;
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) return fallback;
        try {
            return JSON.parse(trimmed) as T;
        } catch {
            return fallback;
        }
    }
    return value as T;
}

export function normalizeJsonArray(value: unknown): unknown[] {
    const parsed = parseJson<unknown>(value, []);
    return Array.isArray(parsed) ? parsed : [];
}

export function normalizeJsonObject(value: unknown): Record<string, unknown> {
    const parsed = parseJson<unknown>(value, {});
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : {};
}

export function normalizeStringArray(value: unknown): string[] {
    const parsed = parseJson<unknown>(value, []);
    if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
    if (typeof parsed === 'string') return parsed.split(',').map((part) => part.trim()).filter(Boolean);
    return [];
}

export function pagination(c: Context): { limit: number; offset: number } {
    const limit = Math.min(Math.max(Number(c.req.query('limit') ?? 50), 1), 200);
    const offset = Math.max(Number(c.req.query('offset') ?? 0), 0);
    return { limit, offset };
}

export function requestBaseUrl(c: Context): string {
    const configured = process.env.MEDIA_PUBLIC_BASE_URL;
    if (configured) return configured.replace(/\/$/, '');
    const url = new URL(c.req.url);
    return `${url.protocol}//${url.host}`;
}

import type { Context } from 'hono';
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/index.js';
import { stories } from '../db/schema.js';
import { normalizeJsonArray } from '../lib/http.js';
import { slugifyOrFallback, uniqueSuffix } from '../lib/slug.js';

const MAX_CONTENT_BYTES = 200 * 1024;

const submissionSchema = z.object({
    headline: z.string().trim().min(1).max(300),
    subhead: z.string().max(2000).optional(),
    author: z.string().trim().min(1).max(160),
    authorEmail: z.string().trim().email().max(320),
    category: z.string().max(120).optional(),
    content: z.union([z.array(z.unknown()), z.string()]).optional(),
    heroImage: z.union([z.literal(''), z.string().url().max(2048)]).optional(),
});

/* -------------------------------------------------------------------------- */
/* In-memory IP rate limit (5 submissions / 10 minutes). Single-process only.  */
/* -------------------------------------------------------------------------- */

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const submissionsByIp = new Map<string, number[]>();

function clientIp(c: Context): string {
    const forwarded = c.req.header('x-forwarded-for');
    if (forwarded) return forwarded.split(',')[0]!.trim();
    return c.req.header('x-real-ip')?.trim() || 'unknown';
}

/** Records a hit and returns retry-after seconds when the limit is exceeded. */
function hitRateLimit(ip: string): number | null {
    const now = Date.now();
    const cutoff = now - RATE_LIMIT_WINDOW_MS;
    const recent = (submissionsByIp.get(ip) ?? []).filter((stamp) => stamp > cutoff);

    if (recent.length >= RATE_LIMIT_MAX) {
        submissionsByIp.set(ip, recent);
        return Math.max(Math.ceil((recent[0]! + RATE_LIMIT_WINDOW_MS - now) / 1000), 1);
    }

    recent.push(now);
    submissionsByIp.set(ip, recent);

    // Keep the map bounded on long-running processes.
    if (submissionsByIp.size > 5000) {
        for (const [key, stamps] of submissionsByIp) {
            if (stamps.every((stamp) => stamp <= cutoff)) submissionsByIp.delete(key);
        }
    }
    return null;
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function contentBlocks(value: unknown): unknown[] | null {
    if (value === undefined) return [];
    if (Array.isArray(value)) return value;
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
        const parsed: unknown = JSON.parse(trimmed);
        return Array.isArray(parsed) ? parsed : null;
    } catch {
        return null;
    }
}

async function uniqueSlug(headline: string): Promise<string> {
    const base = slugifyOrFallback(headline, 'submission');
    const [collision] = await db
        .select({ id: stories.id })
        .from(stories)
        .where(eq(stories.slug, base))
        .limit(1);
    return collision ? `${base}-${uniqueSuffix()}` : base;
}

/* -------------------------------------------------------------------------- */
/* Route                                                                       */
/* -------------------------------------------------------------------------- */

export const publicSubmissions = new Hono();

publicSubmissions.post(
    '/',
    async (c, next) => {
        const retryAfter = hitRateLimit(clientIp(c));
        if (retryAfter !== null) {
            c.header('Retry-After', String(retryAfter));
            return c.json(
                { error: 'Too many submissions. Please try again later.', retryAfter },
                429,
            );
        }
        await next();
    },
    zValidator('json', submissionSchema),
    async (c) => {
        const body = c.req.valid('json');

        const blocks = contentBlocks(body.content);
        if (!blocks) {
            return c.json({ error: 'content must be an array of blocks or a JSON array string' }, 400);
        }
        if (Buffer.byteLength(JSON.stringify(blocks), 'utf8') > MAX_CONTENT_BYTES) {
            return c.json({ error: 'content exceeds the 200KB limit' }, 400);
        }

        const authorEmail = body.authorEmail.trim().toLowerCase();
        const subhead = body.subhead?.trim() || null;
        const category = body.category?.trim() || 'Guest Submission';

        const [created] = await db
            .insert(stories)
            .values({
                slug: await uniqueSlug(body.headline),
                headline: body.headline,
                subhead,
                category,
                author: body.author,
                // Status is server-controlled: guests can never publish or self-approve.
                status: 'Pending Review',
                workflowStatus: 'pending_review',
                layout: 'standard',
                heroImage: body.heroImage || null,
                content: normalizeJsonArray(blocks),
                versionLog: [
                    {
                        action: 'Guest submission received',
                        user: `${body.author} <${authorEmail}>`,
                        timestamp: new Date().toISOString(),
                    },
                ],
            })
            .returning({ id: stories.id, slug: stories.slug });

        return c.json({ success: true, id: created!.id, slug: created!.slug }, 201);
    },
);

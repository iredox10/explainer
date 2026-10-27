import { timingSafeEqual } from 'node:crypto';
import type { Context } from 'hono';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { stories } from '../db/schema.js';
import { env } from '../env.js';
import { serializeStory } from './stories.js';

function assertInternalKey(c: Context) {
    if (!env.INTERNAL_API_KEY) {
        throw new HTTPException(503, { message: 'INTERNAL_API_KEY is not configured' });
    }

    const header = c.req.header('x-internal-key') ?? '';
    const expected = env.INTERNAL_API_KEY;
    const provided = Buffer.from(header);
    const reference = Buffer.from(expected);

    if (provided.length !== reference.length || !timingSafeEqual(provided, reference)) {
        throw new HTTPException(401, { message: 'Unauthorized' });
    }
}

export const internalRoutes = new Hono();

internalRoutes.get('/stories/:idOrSlug', async (c) => {
    assertInternalKey(c);

    const value = c.req.param('idOrSlug');
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
    const identity = isUuid ? eq(stories.id, value) : eq(stories.slug, value);

    const [row] = await db.select().from(stories).where(identity).limit(1);
    if (!row) throw new HTTPException(404, { message: 'Story not found' });
    return c.json(serializeStory(row as unknown as Record<string, unknown>));
});

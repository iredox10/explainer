import type { Context } from 'hono';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { and, eq, lte } from 'drizzle-orm';
import { db } from '../db/index.js';
import { stories } from '../db/schema.js';
import { env } from '../env.js';

export const cronRoutes = new Hono();

function assertCronSecret(c: Context) {
    const expected = env.CRON_SECRET;
    if (!expected) {
        throw new HTTPException(503, { message: 'CRON_SECRET is not configured' });
    }
    const header = c.req.header('authorization') ?? '';
    if (header !== `Bearer ${expected}`) {
        throw new HTTPException(401, { message: 'Unauthorized' });
    }
}

async function publishScheduled(c: Context) {
    assertCronSecret(c);
    const now = new Date();

    const due = await db
        .select({ id: stories.id, headline: stories.headline, slug: stories.slug })
        .from(stories)
        .where(and(eq(stories.status, 'Scheduled'), lte(stories.scheduledAt, now)));

    const published: typeof due = [];
    const failed: Array<{ id: string; error: string }> = [];

    for (const story of due) {
        try {
            await db
                .update(stories)
                .set({
                    status: 'Published',
                    workflowStatus: 'published',
                    publishedAt: now,
                    updatedAt: now,
                })
                .where(eq(stories.id, story.id));
            published.push(story);
        } catch (error) {
            failed.push({ id: story.id, error: (error as Error).message });
        }
    }

    return { published, failed, total: due.length };
}

cronRoutes.post('/publish-scheduled', async (c) => {
    const result = await publishScheduled(c);
    return c.json({ success: true, timestamp: new Date().toISOString(), results: result });
});

cronRoutes.get('/publish-scheduled', async (c) => {
    const result = await publishScheduled(c);
    return c.json({ success: true, timestamp: new Date().toISOString(), results: result });
});

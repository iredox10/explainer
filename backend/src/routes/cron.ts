import type { Context } from 'hono';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { env } from '../env.js';
import { publishScheduledStories } from '../lib/scheduled-publishing.js';

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

async function runPublish(c: Context) {
    assertCronSecret(c);
    const results = await publishScheduledStories();
    return c.json({ success: true, timestamp: new Date().toISOString(), results });
}

cronRoutes.post('/publish-scheduled', (c) => runPublish(c));
cronRoutes.get('/publish-scheduled', (c) => runPublish(c));

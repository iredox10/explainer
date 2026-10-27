import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { secureHeaders } from 'hono/secure-headers';
import { auth } from './auth/index.js';
import { requireAuth, type AppEnv } from './auth/middleware.js';
import { sql } from './db/index.js';
import { env, trustedOrigins } from './env.js';
import { logger } from './lib/logger.js';
import { authRoutes } from './routes/auth.js';
import { publicStories, adminStories } from './routes/stories.js';
import {
    adminAuthors,
    adminCategories,
    publicAuthors,
    publicCategories,
} from './routes/taxonomy.js';
import { adminSettings, publicSettings } from './routes/settings.js';
import { adminSubscribers, publicSubscribers } from './routes/subscribers.js';
import { adminAnalytics, publicAnalytics } from './routes/analytics.js';
import { adminMedia, publicMedia } from './routes/media.js';
import { adminUsers } from './routes/users.js';
import { adminEditorial } from './routes/editorial.js';
import { adminCampaigns, publicCampaigns } from './routes/campaigns.js';
import { cronRoutes } from './routes/cron.js';
import { internalRoutes } from './routes/internal.js';

export const app = new Hono<AppEnv>();

app.use('*', secureHeaders());
app.use('*', async (c, next) => {
    const startedAt = Date.now();
    await next();
    logger.info(
        {
            method: c.req.method,
            path: c.req.path,
            status: c.res.status,
            durationMs: Date.now() - startedAt,
        },
        'request',
    );
});
app.use(
    '*',
    cors({
        origin: trustedOrigins,
        allowHeaders: ['Content-Type', 'Authorization'],
        allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
        exposeHeaders: ['set-auth-token'],
        credentials: true,
        maxAge: 86400,
    }),
);

app.get('/health', async (c) => {
    try {
        await sql`SELECT 1`;
        return c.json({
            status: 'ok',
            service: 'explainer-api',
            environment: env.NODE_ENV,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        logger.error({ error }, 'health check failed');
        return c.json({ status: 'degraded', service: 'explainer-api' }, 503);
    }
});

app.route('/media', publicMedia);

app.route('/api/auth', authRoutes);
app.on(['GET', 'POST'], '/api/auth/*', (c) => auth.handler(c.req.raw));

app.route('/api/stories', publicStories);
app.route('/api/categories', publicCategories);
app.route('/api/authors', publicAuthors);
app.route('/api/settings', publicSettings);
app.route('/api/subscribers', publicSubscribers);
app.route('/api/analytics', publicAnalytics);
app.route('/api/campaigns', publicCampaigns);
app.route('/api/cron', cronRoutes);
app.route('/api/internal', internalRoutes);

app.use('/api/admin/*', requireAuth);
app.route('/api/admin/stories', adminStories);
app.route('/api/admin/categories', adminCategories);
app.route('/api/admin/authors', adminAuthors);
app.route('/api/admin/settings', adminSettings);
app.route('/api/admin/subscribers', adminSubscribers);
app.route('/api/admin/analytics', adminAnalytics);
app.route('/api/admin/media', adminMedia);
app.route('/api/admin/users', adminUsers);
app.route('/api/admin', adminEditorial);
app.route('/api/admin/campaigns', adminCampaigns);

app.notFound((c) => c.json({ error: 'Not found' }, 404));

app.onError((error, c) => {
    if (error instanceof HTTPException) {
        return error.getResponse();
    }
    logger.error({ error }, 'unhandled request error');
    return c.json({ error: 'Internal server error' }, 500);
});

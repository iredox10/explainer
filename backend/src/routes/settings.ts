import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { zValidator } from '@hono/zod-validator';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { requireRole } from '../auth/middleware.js';
import { db } from '../db/index.js';
import { settings } from '../db/schema.js';
import { serializeRow } from '../lib/http.js';

const settingsInput = z.object({
    siteName: z.string().max(140).optional(),
    site_name: z.string().max(140).optional(),
    maintenanceMode: z.boolean().optional(),
    maintenance_mode: z.boolean().optional(),
    breakingNewsActive: z.boolean().optional(),
    breaking_news_active: z.boolean().optional(),
});

async function getSettings() {
    const [row] = await db.select().from(settings).where(eq(settings.id, 1)).limit(1);
    return row ?? null;
}

function withAliases(row: NonNullable<Awaited<ReturnType<typeof getSettings>>>) {
    return {
        ...serializeRow(row as unknown as Record<string, unknown>),
        $id: 'settings',
        site_name: row.siteName,
        maintenance_mode: row.maintenanceMode,
        breaking_news_active: row.breakingNewsActive,
    };
}

export const publicSettings = new Hono();

publicSettings.get('/', async (c) => {
    const row = await getSettings();
    if (!row) {
        return c.json({
            $id: 'settings',
            siteName: 'Explainer',
            site_name: 'Explainer',
            maintenanceMode: false,
            maintenance_mode: false,
            breakingNewsActive: false,
            breaking_news_active: false,
        });
    }
    return c.json(withAliases(row));
});

export const adminSettings = new Hono();

adminSettings.get('/', async (c) => {
    const row = await getSettings();
    return c.json(row ? withAliases(row) : {});
});

adminSettings.patch('/', requireRole('editor', 'superadmin'), zValidator('json', settingsInput), async (c) => {
    const body = c.req.valid('json');
    const row: Record<string, unknown> = { updatedAt: new Date() };
    const siteName = body.siteName ?? body.site_name;
    const maintenanceMode = body.maintenanceMode ?? body.maintenance_mode;
    const breakingNewsActive = body.breakingNewsActive ?? body.breaking_news_active;
    if (siteName !== undefined) row.siteName = siteName;
    if (maintenanceMode !== undefined) row.maintenanceMode = maintenanceMode;
    if (breakingNewsActive !== undefined) row.breakingNewsActive = breakingNewsActive;

    const [updated] = await db
        .insert(settings)
        .values({ id: 1, ...row })
        .onConflictDoUpdate({ target: settings.id, set: row })
        .returning();

    if (!updated) throw new HTTPException(500, { message: 'Failed to update settings' });
    return c.json(withAliases(updated));
});

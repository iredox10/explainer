import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { zValidator } from '@hono/zod-validator';
import { desc, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/index.js';
import { campaigns, subscribers } from '../db/schema.js';
import { requireRole } from '../auth/middleware.js';
import { sendEmail } from '../lib/email.js';
import { pagination, serializeRow } from '../lib/http.js';

const campaignInput = z.object({
    subject: z.string().min(1).max(600),
    html: z.string().max(200_000).nullable().optional(),
    text: z.string().max(100_000).nullable().optional(),
    status: z.string().max(40).optional(),
    subscriberIds: z.array(z.string()).optional(),
    send: z.boolean().optional(),
});

const campaignPatch = z.object({
    status: z.string().max(40).optional(),
    open: z.boolean().optional(),
    click: z.boolean().optional(),
    sentCount: z.number().int().min(0).optional(),
    failedCount: z.number().int().min(0).optional(),
});

async function recipientList(subscriberIds?: string[]) {
    if (subscriberIds && subscriberIds.length > 0) {
        return db
            .select({ id: subscribers.id, email: subscribers.email })
            .from(subscribers)
            .where(inArray(subscribers.id, subscriberIds));
    }
    return db
        .select({ id: subscribers.id, email: subscribers.email })
        .from(subscribers)
        .where(eq(subscribers.status, 'active'));
}

async function deliver(campaignId: string, subscriberIds?: string[]) {
    const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, campaignId)).limit(1);
    if (!campaign) throw new HTTPException(404, { message: 'Campaign not found' });

    const recipients = await recipientList(subscriberIds);
    let sent = 0;
    let failed = 0;

    for (let index = 0; index < recipients.length; index += 10) {
        const batch = recipients.slice(index, index + 10);
        const results = await Promise.all(
            batch.map((recipient) =>
                sendEmail({
                    to: recipient.email,
                    subject: campaign.subject,
                    html: campaign.html || campaign.text || '',
                    text: campaign.text || undefined,
                }),
            ),
        );
        for (const result of results) {
            if (result.success) sent += 1;
            else failed += 1;
        }
    }

    const [updated] = await db
        .update(campaigns)
        .set({
            status: 'sent',
            sentCount: sent,
            failedCount: failed,
            totalRecipients: recipients.length,
            sentAt: new Date(),
        })
        .where(eq(campaigns.id, campaignId))
        .returning();

    return updated;
}

export const adminCampaigns = new Hono();

adminCampaigns.get('/', async (c) => {
    const { limit, offset } = pagination(c);
    const rows = await db
        .select()
        .from(campaigns)
        .orderBy(desc(campaigns.createdAt))
        .limit(limit)
        .offset(offset);
    return c.json({
        documents: rows.map((row) => serializeRow(row as unknown as Record<string, unknown>)),
        total: rows.length,
    });
});

adminCampaigns.get('/:id', async (c) => {
    const [row] = await db.select().from(campaigns).where(eq(campaigns.id, c.req.param('id'))).limit(1);
    if (!row) throw new HTTPException(404, { message: 'Campaign not found' });
    return c.json(serializeRow(row as unknown as Record<string, unknown>));
});

adminCampaigns.post(
    '/',
    requireRole('editor', 'superadmin'),
    zValidator('json', campaignInput),
    async (c) => {
        const body = c.req.valid('json');
        const recipients = await recipientList(body.subscriberIds);

        const [created] = await db
            .insert(campaigns)
            .values({
                subject: body.subject,
                html: body.html || null,
                text: body.text || null,
                status: body.send ? 'sending' : (body.status ?? 'draft'),
                totalRecipients: recipients.length,
            })
            .returning();

        const row = body.send && created ? await deliver(created.id, body.subscriberIds) : created;
        if (!row) throw new HTTPException(500, { message: 'Failed to create campaign' });
        return c.json(serializeRow(row as unknown as Record<string, unknown>), 201);
    },
);

adminCampaigns.post('/:id/send', requireRole('editor', 'superadmin'), async (c) => {
    const row = await deliver(c.req.param('id'));
    return c.json(serializeRow(row as unknown as Record<string, unknown>));
});

adminCampaigns.patch('/:id', requireRole('editor', 'superadmin'), zValidator('json', campaignPatch), async (c) => {
    const body = c.req.valid('json');
    const [current] = await db.select().from(campaigns).where(eq(campaigns.id, c.req.param('id'))).limit(1);
    if (!current) throw new HTTPException(404, { message: 'Campaign not found' });

    const [updated] = await db
        .update(campaigns)
        .set({
            status: body.status ?? current.status,
            sentCount: body.sentCount ?? current.sentCount,
            failedCount: body.failedCount ?? current.failedCount,
            openCount: body.open ? current.openCount + 1 : current.openCount,
            clickCount: body.click ? current.clickCount + 1 : current.clickCount,
        })
        .where(eq(campaigns.id, current.id))
        .returning();

    return c.json(serializeRow(updated as unknown as Record<string, unknown>));
});

const PIXEL = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64',
);

export const publicCampaigns = new Hono();

publicCampaigns.get('/:id/open.gif', async (c) => {
    const [current] = await db.select().from(campaigns).where(eq(campaigns.id, c.req.param('id'))).limit(1);
    if (current) {
        await db
            .update(campaigns)
            .set({ openCount: current.openCount + 1 })
            .where(eq(campaigns.id, current.id));
    }
    return new Response(PIXEL, {
        headers: { 'Content-Type': 'image/gif', 'Cache-Control': 'no-store' },
    });
});

publicCampaigns.get('/:id/click', async (c) => {
    const target = c.req.query('url');
    const [current] = await db.select().from(campaigns).where(eq(campaigns.id, c.req.param('id'))).limit(1);
    if (current) {
        await db
            .update(campaigns)
            .set({ clickCount: current.clickCount + 1 })
            .where(eq(campaigns.id, current.id));
    }

    if (target && /^https?:\/\//i.test(target)) {
        return c.redirect(target, 302);
    }
    return c.json({ success: true });
});

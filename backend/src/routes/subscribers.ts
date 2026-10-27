import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { zValidator } from '@hono/zod-validator';
import { and, count, desc, eq, ilike, type SQL } from 'drizzle-orm';
import { z } from 'zod';
import { requireRole } from '../auth/middleware.js';
import { db } from '../db/index.js';
import { subscribers } from '../db/schema.js';
import { pagination, serializeRow } from '../lib/http.js';

const subscribeInput = z.object({
    email: z.string().email().max(320),
});

export const publicSubscribers = new Hono();

publicSubscribers.post('/', zValidator('json', subscribeInput), async (c) => {
    const { email } = c.req.valid('json');
    const normalized = email.trim().toLowerCase();

    const [row] = await db
        .insert(subscribers)
        .values({ email: normalized, status: 'active' })
        .onConflictDoNothing({ target: subscribers.email })
        .returning();

    if (!row) {
        return c.json({ success: true, message: 'You are already subscribed!' });
    }

    return c.json({ success: true, message: 'Subscribed successfully', subscriber: serializeRow(row as unknown as Record<string, unknown>) }, 201);
});

export const adminSubscribers = new Hono();

adminSubscribers.get('/', async (c) => {
    const { limit, offset } = pagination(c);
    const status = c.req.query('status');
    const q = c.req.query('q')?.trim();

    const conditions: SQL[] = [];
    if (status) conditions.push(eq(subscribers.status, status));
    if (q) conditions.push(ilike(subscribers.email, `%${q}%`));
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, total] = await Promise.all([
        db
            .select()
            .from(subscribers)
            .where(where)
            .orderBy(desc(subscribers.subscribedAt))
            .limit(limit)
            .offset(offset),
        db.select({ value: count() }).from(subscribers).where(where),
    ]);

    return c.json({
        documents: rows.map((row) => serializeRow(row as unknown as Record<string, unknown>)),
        total: Number(total[0]?.value ?? 0),
    });
});

adminSubscribers.delete('/:id', requireRole('editor', 'superadmin'), async (c) => {
    const [deleted] = await db
        .delete(subscribers)
        .where(eq(subscribers.id, c.req.param('id')))
        .returning({ id: subscribers.id });
    if (!deleted) throw new HTTPException(404, { message: 'Subscriber not found' });
    return c.json({ success: true, id: deleted.id });
});

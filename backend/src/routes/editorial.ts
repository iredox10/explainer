import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { zValidator } from '@hono/zod-validator';
import { and, desc, eq, type SQL } from 'drizzle-orm';
import { z } from 'zod';
import type { AppEnv } from '../auth/middleware.js';
import { db } from '../db/index.js';
import {
    activityLog,
    assignments,
    comments,
    notifications,
    profiles,
} from '../db/schema.js';
import { normalizeJsonObject, pagination, serializeRow, toDate } from '../lib/http.js';

const commentInput = z.object({
    storyId: z.string().min(1).max(200),
    blockId: z.string().min(1).max(200),
    content: z.string().min(1).max(8000),
    authorId: z.string().optional(),
    authorName: z.string().optional(),
    authorEmail: z.string().email().optional(),
    author: z
        .object({
            id: z.string().optional(),
            name: z.string().optional(),
            email: z.string().email().optional(),
        })
        .optional(),
});

const commentPatch = z.object({
    content: z.string().min(1).max(8000).optional(),
    resolved: z.boolean().optional(),
    replies: z.unknown().optional(),
});

const assignmentInput = z.object({
    storyId: z.string().min(1).max(200),
    storyTitle: z.string().min(1).max(600),
    assignedToId: z.string().min(1),
    assignedToName: z.string().min(1),
    assignedById: z.string().optional(),
    assignedByName: z.string().optional(),
    deadline: z.string(),
    status: z.string().max(40).optional(),
    notes: z.string().max(4000).nullable().optional(),
});

const assignmentPatch = z.object({
    status: z.string().max(40).optional(),
    deadline: z.string().optional(),
    notes: z.string().max(4000).nullable().optional(),
    assignedToId: z.string().optional(),
    assignedToName: z.string().optional(),
});

const notificationInput = z.object({
    userId: z.string().optional(),
    type: z.string().min(1).max(80),
    title: z.string().min(1).max(300),
    message: z.string().max(2000).nullable().optional(),
    link: z.string().max(1200).nullable().optional(),
});

const activityInput = z.object({
    type: z.string().min(1).max(80),
    storyId: z.string().max(200).nullable().optional(),
    userId: z.string().max(200).nullable().optional(),
    userName: z.string().max(200).nullable().optional(),
    details: z.unknown().optional(),
});

export const adminEditorial = new Hono<AppEnv>();

adminEditorial.get('/comments', async (c) => {
    const storyId = c.req.query('storyId');
    const resolved = c.req.query('resolved');
    const conditions: SQL[] = [];
    if (storyId) conditions.push(eq(comments.storyId, storyId));
    if (resolved === 'true' || resolved === 'false') conditions.push(eq(comments.resolved, resolved === 'true'));
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await db.select().from(comments).where(where).orderBy(comments.createdAt);
    return c.json({
        documents: rows.map((row) => serializeRow(row as unknown as Record<string, unknown>)),
        total: rows.length,
    });
});

adminEditorial.post('/comments', zValidator('json', commentInput), async (c) => {
    const body = c.req.valid('json');
    const profile = c.get('profile');
    const user = c.get('user');

    const [row] = await db
        .insert(comments)
        .values({
            storyId: body.storyId,
            blockId: body.blockId,
            content: body.content,
            authorId: body.authorId || body.author?.id || profile?.userId || user.id,
            authorName: body.authorName || body.author?.name || profile?.name || user.name,
            authorEmail: body.authorEmail || body.author?.email || profile?.email || user.email,
        })
        .returning();

    if (!row) throw new HTTPException(500, { message: 'Failed to create comment' });

    await logActivity({
        type: 'comment_added',
        storyId: body.storyId,
        userId: row.authorId,
        userName: row.authorName,
        details: { blockId: body.blockId, commentId: row.id },
    });

    return c.json(serializeRow(row as unknown as Record<string, unknown>), 201);
});

adminEditorial.get('/comments/:id', async (c) => {
    const [row] = await db.select().from(comments).where(eq(comments.id, c.req.param('id'))).limit(1);
    if (!row) throw new HTTPException(404, { message: 'Comment not found' });
    return c.json(serializeRow(row as unknown as Record<string, unknown>));
});

adminEditorial.patch('/comments/:id', zValidator('json', commentPatch), async (c) => {
    const body = c.req.valid('json');
    const user = c.get('user');
    const profile = c.get('profile');
    const row: Record<string, unknown> = {};
    if (body.content !== undefined) row.content = body.content;
    if (body.replies !== undefined) row.replies = body.replies;
    if (body.resolved !== undefined) {
        row.resolved = body.resolved;
        row.resolvedAt = body.resolved ? new Date() : null;
        row.resolvedById = body.resolved ? user.id : null;
        row.resolvedByName = body.resolved ? (profile?.name ?? user.name) : null;
    }

    const [updated] = await db
        .update(comments)
        .set(row)
        .where(eq(comments.id, c.req.param('id')))
        .returning();
    if (!updated) throw new HTTPException(404, { message: 'Comment not found' });
    return c.json(serializeRow(updated as unknown as Record<string, unknown>));
});

adminEditorial.delete('/comments/:id', async (c) => {
    const [deleted] = await db
        .delete(comments)
        .where(eq(comments.id, c.req.param('id')))
        .returning({ id: comments.id });
    if (!deleted) throw new HTTPException(404, { message: 'Comment not found' });
    return c.json({ success: true, id: deleted.id });
});

adminEditorial.get('/assignments', async (c) => {
    const conditions: SQL[] = [];
    const assignedToId = c.req.query('assignedToId');
    const status = c.req.query('status');
    const storyId = c.req.query('storyId');
    if (assignedToId) conditions.push(eq(assignments.assignedToId, assignedToId));
    if (status) conditions.push(eq(assignments.status, status));
    if (storyId) conditions.push(eq(assignments.storyId, storyId));
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await db
        .select()
        .from(assignments)
        .where(where)
        .orderBy(desc(assignments.deadline));
    return c.json({
        documents: rows.map((row) => serializeRow(row as unknown as Record<string, unknown>)),
        total: rows.length,
    });
});

adminEditorial.post('/assignments', zValidator('json', assignmentInput), async (c) => {
    const body = c.req.valid('json');
    const user = c.get('user');
    const profile = c.get('profile');

    const [row] = await db
        .insert(assignments)
        .values({
            storyId: body.storyId,
            storyTitle: body.storyTitle,
            assignedToId: body.assignedToId,
            assignedToName: body.assignedToName,
            assignedById: body.assignedById || user.id,
            assignedByName: body.assignedByName || profile?.name || user.name,
            deadline: toDate(body.deadline) ?? new Date(),
            status: body.status || 'assigned',
            notes: body.notes || null,
        })
        .returning();

    await logActivity({
        type: 'story_assigned',
        storyId: body.storyId,
        userId: user.id,
        userName: profile?.name ?? user.name,
        details: { assignedTo: body.assignedToName, deadline: body.deadline },
    });

    return c.json(serializeRow(row as unknown as Record<string, unknown>), 201);
});

adminEditorial.patch('/assignments/:id', zValidator('json', assignmentPatch), async (c) => {
    const body = c.req.valid('json');
    const row: Record<string, unknown> = {};
    if (body.status !== undefined) {
        row.status = body.status;
        row.completedAt = ['completed', 'done'].includes(body.status) ? new Date() : null;
    }
    if (body.deadline !== undefined) row.deadline = toDate(body.deadline) ?? new Date();
    if (body.notes !== undefined) row.notes = body.notes || null;
    if (body.assignedToId !== undefined) row.assignedToId = body.assignedToId;
    if (body.assignedToName !== undefined) row.assignedToName = body.assignedToName;

    const [updated] = await db
        .update(assignments)
        .set(row)
        .where(eq(assignments.id, c.req.param('id')))
        .returning();
    if (!updated) throw new HTTPException(404, { message: 'Assignment not found' });
    return c.json(serializeRow(updated as unknown as Record<string, unknown>));
});

adminEditorial.delete('/assignments/:id', async (c) => {
    const [deleted] = await db
        .delete(assignments)
        .where(eq(assignments.id, c.req.param('id')))
        .returning({ id: assignments.id });
    if (!deleted) throw new HTTPException(404, { message: 'Assignment not found' });
    return c.json({ success: true, id: deleted.id });
});

adminEditorial.get('/notifications', async (c) => {
    const userId = c.req.query('userId') || c.get('user').id;
    const rows = await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt))
        .limit(100);
    return c.json({
        documents: rows.map((row) => serializeRow(row as unknown as Record<string, unknown>)),
        total: rows.length,
    });
});

adminEditorial.post('/notifications', zValidator('json', notificationInput), async (c) => {
    const body = c.req.valid('json');
    const [row] = await db
        .insert(notifications)
        .values({
            userId: body.userId || c.get('user').id,
            type: body.type,
            title: body.title,
            message: body.message || null,
            link: body.link || null,
        })
        .returning();
    return c.json(serializeRow(row as unknown as Record<string, unknown>), 201);
});

adminEditorial.patch('/notifications/:id/read', async (c) => {
    const [updated] = await db
        .update(notifications)
        .set({ read: true, readAt: new Date() })
        .where(eq(notifications.id, c.req.param('id')))
        .returning();
    if (!updated) throw new HTTPException(404, { message: 'Notification not found' });
    return c.json(serializeRow(updated as unknown as Record<string, unknown>));
});

adminEditorial.delete('/notifications/:id', async (c) => {
    const [deleted] = await db
        .delete(notifications)
        .where(eq(notifications.id, c.req.param('id')))
        .returning({ id: notifications.id });
    if (!deleted) throw new HTTPException(404, { message: 'Notification not found' });
    return c.json({ success: true, id: deleted.id });
});

adminEditorial.get('/activity', async (c) => {
    const { limit, offset } = pagination(c);
    const storyId = c.req.query('storyId');
    const type = c.req.query('type');
    const conditions: SQL[] = [];
    if (storyId) conditions.push(eq(activityLog.storyId, storyId));
    if (type) conditions.push(eq(activityLog.type, type));
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await db
        .select()
        .from(activityLog)
        .where(where)
        .orderBy(desc(activityLog.timestamp))
        .limit(limit)
        .offset(offset);
    return c.json({
        documents: rows.map((row) => serializeRow(row as unknown as Record<string, unknown>)),
        total: rows.length,
    });
});

adminEditorial.post('/activity', zValidator('json', activityInput), async (c) => {
    const body = c.req.valid('json');
    const user = c.get('user');
    const profile = c.get('profile');
    const [row] = await db
        .insert(activityLog)
        .values({
            type: body.type,
            storyId: body.storyId || null,
            userId: body.userId || user.id,
            userName: body.userName || profile?.name || user.name,
            details: normalizeJsonObject(body.details),
        })
        .returning();
    return c.json(serializeRow(row as unknown as Record<string, unknown>), 201);
});

adminEditorial.get('/logs', async (c) => {
    const { limit } = pagination(c);
    const rows = await db
        .select()
        .from(activityLog)
        .orderBy(desc(activityLog.timestamp))
        .limit(limit);

    return c.json({
        logs: rows.map((row) => ({
            ...serializeRow(row as unknown as Record<string, unknown>),
            event: row.type,
            time: row.timestamp,
            ip: null,
            userAgent: null,
        })),
        total: rows.length,
    });
});

async function logActivity(input: {
    type: string;
    storyId?: string | null;
    userId?: string | null;
    userName?: string | null;
    details?: Record<string, unknown>;
}) {
    await db.insert(activityLog).values({
        type: input.type,
        storyId: input.storyId || null,
        userId: input.userId || null,
        userName: input.userName || null,
        details: input.details ?? {},
    });
}

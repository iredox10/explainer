import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { and, count, desc, eq, gte, type SQL } from 'drizzle-orm';
import { z } from 'zod';
import type { Context } from 'hono';
import { db } from '../db/index.js';
import { analyticsEvents, scrollDepth } from '../db/schema.js';
import { serializeRow, toDate } from '../lib/http.js';

const pageviewInput = z.object({
    storyId: z.string().max(200).nullable().optional(),
    visitorId: z.string().min(1).max(200),
    path: z.string().min(1).max(1200),
    referrer: z.string().max(1200).nullable().optional(),
    device: z.string().max(80).nullable().optional(),
    userAgent: z.string().max(2000).nullable().optional(),
    timeOnPage: z.number().int().min(0).nullable().optional(),
    timestamp: z.string().optional(),
    date: z.string().optional(),
    eventDate: z.string().optional(),
});

const scrollInput = z.object({
    storyId: z.string().min(1).max(200),
    visitorId: z.string().min(1).max(200),
    maxDepth: z.number().int().min(0).max(100),
    currentStep: z.number().int().nullable().optional(),
    totalSteps: z.number().int().nullable().optional(),
    viewport: z.string().max(80).nullable().optional(),
    timestamp: z.string().optional(),
});

function dateOnly(value?: string): string {
    if (value) {
        const parsed = toDate(value);
        if (parsed) return parsed.toISOString().slice(0, 10);
    }
    return new Date().toISOString().slice(0, 10);
}

export const publicAnalytics = new Hono();

publicAnalytics.post('/pageview', zValidator('json', pageviewInput), async (c) => {
    const body = c.req.valid('json');
    const [row] = await db
        .insert(analyticsEvents)
        .values({
            storyId: body.storyId || null,
            visitorId: body.visitorId,
            path: body.path,
            referrer: body.referrer || null,
            device: body.device || null,
            userAgent: body.userAgent || null,
            timeOnPage: body.timeOnPage ?? null,
            eventDate: dateOnly(body.eventDate || body.date),
            timestamp: toDate(body.timestamp) ?? new Date(),
        })
        .returning();

    return c.json(serializeRow(row as unknown as Record<string, unknown>), 201);
});

publicAnalytics.post('/scroll', zValidator('json', scrollInput), async (c) => {
    const body = c.req.valid('json');
    const [row] = await db
        .insert(scrollDepth)
        .values({
            storyId: body.storyId,
            visitorId: body.visitorId,
            maxDepth: body.maxDepth,
            currentStep: body.currentStep ?? null,
            totalSteps: body.totalSteps ?? null,
            viewport: body.viewport || null,
            timestamp: toDate(body.timestamp) ?? new Date(),
        })
        .returning();

    return c.json(serializeRow(row as unknown as Record<string, unknown>), 201);
});

export const adminAnalytics = new Hono();

function analyticsWindow(c: Context): { limit: number; offset: number } {
    const limit = Math.min(Math.max(Number(c.req.query('limit') ?? 1000), 1), 10000);
    const offset = Math.max(Number(c.req.query('offset') ?? 0), 0);
    return { limit, offset };
}

adminAnalytics.get('/events', async (c) => {
    const { limit, offset } = analyticsWindow(c);
    const storyId = c.req.query('storyId');
    const days = Number(c.req.query('days') ?? 30);
    const since = new Date(Date.now() - Math.max(days, 1) * 24 * 60 * 60 * 1000);

    const conditions: SQL[] = [gte(analyticsEvents.timestamp, since)];
    if (storyId) conditions.push(eq(analyticsEvents.storyId, storyId));
    const where = and(...conditions);

    const [rows, total] = await Promise.all([
        db
            .select()
            .from(analyticsEvents)
            .where(where)
            .orderBy(desc(analyticsEvents.timestamp))
            .limit(limit)
            .offset(offset),
        db.select({ value: count() }).from(analyticsEvents).where(where),
    ]);

    return c.json({
        documents: rows.map((row) => serializeRow(row as unknown as Record<string, unknown>)),
        total: Number(total[0]?.value ?? 0),
    });
});

adminAnalytics.get('/scroll', async (c) => {
    const { limit, offset } = analyticsWindow(c);
    const storyId = c.req.query('storyId');
    const conditions: SQL[] = [];
    if (storyId) conditions.push(eq(scrollDepth.storyId, storyId));
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, total] = await Promise.all([
        db
            .select()
            .from(scrollDepth)
            .where(where)
            .orderBy(desc(scrollDepth.timestamp))
            .limit(limit)
            .offset(offset),
        db.select({ value: count() }).from(scrollDepth).where(where),
    ]);

    return c.json({
        documents: rows.map((row) => serializeRow(row as unknown as Record<string, unknown>)),
        total: Number(total[0]?.value ?? 0),
    });
});

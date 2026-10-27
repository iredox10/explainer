import path from 'node:path';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { zValidator } from '@hono/zod-validator';
import { and, count, desc, eq, ilike, sql, type SQL } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/index.js';
import { media } from '../db/schema.js';
import { normalizeStringArray, pagination, serializeRow } from '../lib/http.js';
import { deleteObject, putObject, readObject, validateUpload } from '../lib/storage.js';
import type { AppEnv } from '../auth/middleware.js';

const mediaMetadataInput = z.object({
    tags: z.unknown().optional(),
    usage: z.unknown().optional(),
    caption: z.string().max(2000).nullable().optional(),
    altText: z.string().max(1000).nullable().optional(),
});

const MIME_BY_EXTENSION: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.avif': 'image/avif',
    '.svg': 'image/svg+xml',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.pdf': 'application/pdf',
};

export const publicMedia = new Hono();

publicMedia.get('/*', async (c) => {
    const key = c.req.path.replace(/^\/media\//, '');
    if (!key) throw new HTTPException(404, { message: 'Not found' });

    const object = await readObject(key);
    if (!object) throw new HTTPException(404, { message: 'Media not found' });

    const contentType = object.contentType ?? MIME_BY_EXTENSION[path.extname(key).toLowerCase()] ?? 'application/octet-stream';
    return new Response(Buffer.from(object.data), {
        headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=31536000, immutable',
        },
    });
});

export const adminMedia = new Hono<AppEnv>();

adminMedia.post('/', async (c) => {
    const body = await c.req.parseBody();
    const file = body.file;
    if (!(file instanceof File)) {
        throw new HTTPException(400, { message: 'A multipart file field named "file" is required' });
    }

    validateUpload(file);
    const { key, url } = await putObject(file, file.name);
    const tags = normalizeStringArray(body.tags);
    const usage = normalizeStringArray(body.usage);

    const [record] = await db
        .insert(media)
        .values({
            storageKey: key,
            filename: path.basename(key),
            originalName: file.name,
            mimeType: file.type || null,
            size: file.size,
            url,
            tags,
            usage,
            caption: typeof body.caption === 'string' ? body.caption : null,
            altText: typeof body.altText === 'string' ? body.altText : null,
            uploadedBy: c.get('user')?.id ?? null,
        })
        .returning();

    if (!record) throw new HTTPException(500, { message: 'Failed to store media record' });

    return c.json(
        {
            ...serializeRow(record as unknown as Record<string, unknown>),
            fileId: record.storageKey,
            url,
            record: serializeRow(record as unknown as Record<string, unknown>),
        },
        201,
    );
});

adminMedia.get('/', async (c) => {
    const { limit, offset } = pagination(c);
    const tag = c.req.query('tag');
    const type = c.req.query('type');
    const search = c.req.query('search')?.trim();

    const conditions: SQL[] = [];
    if (tag) {
        conditions.push(sql`${media.tags} @> ${JSON.stringify([tag])}::jsonb`);
    }
    if (type) conditions.push(ilike(media.mimeType, `${type}%`));
    if (search) conditions.push(ilike(media.filename, `%${search}%`));
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, total] = await Promise.all([
        db
            .select()
            .from(media)
            .where(where)
            .orderBy(desc(media.uploadedAt))
            .limit(limit)
            .offset(offset),
        db.select({ value: count() }).from(media).where(where),
    ]);

    return c.json({
        documents: rows.map((row) => ({
            ...serializeRow(row as unknown as Record<string, unknown>),
            fileId: row.storageKey,
        })),
        total: Number(total[0]?.value ?? 0),
    });
});

adminMedia.get('/tags', async (c) => {
    const result = await db.execute<{ tag: string; uses: number }>(sql`
        SELECT tag, count(*)::int AS uses
        FROM media, jsonb_array_elements_text(tags) AS tag
        GROUP BY tag
        ORDER BY uses DESC
        LIMIT 30
    `);
    return c.json({ tags: result });
});

adminMedia.get('/:id', async (c) => {
    const [row] = await db.select().from(media).where(eq(media.id, c.req.param('id'))).limit(1);
    if (!row) throw new HTTPException(404, { message: 'Media not found' });
    return c.json({
        ...serializeRow(row as unknown as Record<string, unknown>),
        fileId: row.storageKey,
    });
});

adminMedia.patch('/:id', zValidator('json', mediaMetadataInput), async (c) => {
    const id = c.req.param('id');
    const body = c.req.valid('json');
    const row: Record<string, unknown> = {};
    if (body.tags !== undefined) row.tags = normalizeStringArray(body.tags);
    if (body.usage !== undefined) row.usage = normalizeStringArray(body.usage);
    if (body.caption !== undefined) row.caption = body.caption || null;
    if (body.altText !== undefined) row.altText = body.altText || null;

    const [updated] = await db.update(media).set(row).where(eq(media.id, id)).returning();
    if (!updated) throw new HTTPException(404, { message: 'Media not found' });
    return c.json({
        ...serializeRow(updated as unknown as Record<string, unknown>),
        fileId: updated.storageKey,
    });
});

adminMedia.delete('/:id', async (c) => {
    const [record] = await db.select().from(media).where(eq(media.id, c.req.param('id'))).limit(1);
    if (!record) throw new HTTPException(404, { message: 'Media not found' });

    await deleteObject(record.storageKey);
    await db.delete(media).where(eq(media.id, record.id));
    return c.json({ success: true, id: record.id });
});

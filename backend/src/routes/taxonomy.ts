import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { zValidator } from '@hono/zod-validator';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { requireRole } from '../auth/middleware.js';
import { db } from '../db/index.js';
import { authors, categories } from '../db/schema.js';
import { serializeRow } from '../lib/http.js';
import { slugifyOrFallback, uniqueSuffix } from '../lib/slug.js';

const categoryInput = z.object({
    name: z.string().min(1).max(120).optional(),
    slug: z.string().max(140).optional(),
    color: z.string().max(30).optional(),
});

const authorInput = z.object({
    name: z.string().min(1).max(160).optional(),
    email: z.string().email().nullable().optional(),
    role: z.string().max(120).nullable().optional(),
    bio: z.string().max(2000).nullable().optional(),
    slug: z.string().max(160).optional(),
    imageUrl: z.string().nullable().optional(),
});

async function uniqueCategorySlug(base: string, excludeId?: string): Promise<string> {
    let candidate = slugifyOrFallback(base, 'category');
    const [collision] = await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, candidate)).limit(1);
    if (!collision || collision.id === excludeId) return candidate;
    return `${candidate}-${uniqueSuffix()}`;
}

async function uniqueAuthorSlug(base: string, excludeId?: string): Promise<string> {
    let candidate = slugifyOrFallback(base, 'author');
    const [collision] = await db.select({ id: authors.id }).from(authors).where(eq(authors.slug, candidate)).limit(1);
    if (!collision || collision.id === excludeId) return candidate;
    return `${candidate}-${uniqueSuffix()}`;
}

export const publicCategories = new Hono();

publicCategories.get('/', async (c) => {
    const rows = await db.select().from(categories).orderBy(categories.name);
    return c.json({
        documents: rows.map((row) => serializeRow(row as unknown as Record<string, unknown>)),
        total: rows.length,
    });
});

publicCategories.get('/:slug', async (c) => {
    const [row] = await db.select().from(categories).where(eq(categories.slug, c.req.param('slug'))).limit(1);
    if (!row) throw new HTTPException(404, { message: 'Category not found' });
    return c.json(serializeRow(row as unknown as Record<string, unknown>));
});

export const adminCategories = new Hono();

adminCategories.get('/', async (c) => {
    const rows = await db.select().from(categories).orderBy(categories.name);
    return c.json({
        documents: rows.map((row) => serializeRow(row as unknown as Record<string, unknown>)),
        total: rows.length,
    });
});

adminCategories.post('/', requireRole('editor', 'superadmin'), zValidator('json', categoryInput), async (c) => {
    const body = c.req.valid('json');
    if (!body.name) throw new HTTPException(400, { message: 'name is required' });

    const [created] = await db
        .insert(categories)
        .values({
            name: body.name,
            slug: await uniqueCategorySlug(body.slug || body.name),
            color: body.color || '#000000',
        })
        .returning();

    return c.json(serializeRow(created as unknown as Record<string, unknown>), 201);
});

adminCategories.patch('/:id', requireRole('editor', 'superadmin'), zValidator('json', categoryInput), async (c) => {
    const id = c.req.param('id');
    const body = c.req.valid('json');
    const row: Record<string, unknown> = { updatedAt: new Date() };
    if (body.name !== undefined) row.name = body.name;
    if (body.color !== undefined) row.color = body.color;
    if (body.slug !== undefined) row.slug = await uniqueCategorySlug(body.slug, id);

    const [updated] = await db.update(categories).set(row).where(eq(categories.id, id)).returning();
    if (!updated) throw new HTTPException(404, { message: 'Category not found' });
    return c.json(serializeRow(updated as unknown as Record<string, unknown>));
});

adminCategories.delete('/:id', requireRole('editor', 'superadmin'), async (c) => {
    const [deleted] = await db.delete(categories).where(eq(categories.id, c.req.param('id'))).returning({ id: categories.id });
    if (!deleted) throw new HTTPException(404, { message: 'Category not found' });
    return c.json({ success: true, id: deleted.id });
});

export const publicAuthors = new Hono();

publicAuthors.get('/', async (c) => {
    const rows = await db.select().from(authors).orderBy(authors.name);
    return c.json({
        documents: rows.map((row) => serializeRow(row as unknown as Record<string, unknown>)),
        total: rows.length,
    });
});

publicAuthors.get('/:slug', async (c) => {
    const [row] = await db.select().from(authors).where(eq(authors.slug, c.req.param('slug'))).limit(1);
    if (!row) throw new HTTPException(404, { message: 'Author not found' });
    return c.json(serializeRow(row as unknown as Record<string, unknown>));
});

export const adminAuthors = new Hono();

adminAuthors.get('/', async (c) => {
    const rows = await db.select().from(authors).orderBy(authors.name);
    return c.json({
        documents: rows.map((row) => serializeRow(row as unknown as Record<string, unknown>)),
        total: rows.length,
    });
});

adminAuthors.post('/', requireRole('editor', 'superadmin'), zValidator('json', authorInput), async (c) => {
    const body = c.req.valid('json');
    if (!body.name) throw new HTTPException(400, { message: 'name is required' });

    const [created] = await db
        .insert(authors)
        .values({
            name: body.name,
            email: body.email || null,
            role: body.role || null,
            bio: body.bio || null,
            imageUrl: body.imageUrl || null,
            slug: await uniqueAuthorSlug(body.slug || body.name),
        })
        .returning()
        .catch((error: { code?: string }) => {
            if (error.code === '23505') {
                throw new HTTPException(409, { message: 'An author with this email already exists' });
            }
            throw error;
        });

    return c.json(serializeRow(created as unknown as Record<string, unknown>), 201);
});

adminAuthors.patch('/:id', requireRole('editor', 'superadmin'), zValidator('json', authorInput), async (c) => {
    const id = c.req.param('id');
    const body = c.req.valid('json');
    const row: Record<string, unknown> = { updatedAt: new Date() };
    if (body.name !== undefined) row.name = body.name;
    if (body.email !== undefined) row.email = body.email || null;
    if (body.role !== undefined) row.role = body.role || null;
    if (body.bio !== undefined) row.bio = body.bio || null;
    if (body.imageUrl !== undefined) row.imageUrl = body.imageUrl || null;
    if (body.slug !== undefined) row.slug = await uniqueAuthorSlug(body.slug, id);

    const [updated] = await db.update(authors).set(row).where(eq(authors.id, id)).returning();
    if (!updated) throw new HTTPException(404, { message: 'Author not found' });
    return c.json(serializeRow(updated as unknown as Record<string, unknown>));
});

adminAuthors.delete('/:id', requireRole('editor', 'superadmin'), async (c) => {
    const [deleted] = await db.delete(authors).where(eq(authors.id, c.req.param('id'))).returning({ id: authors.id });
    if (!deleted) throw new HTTPException(404, { message: 'Author not found' });
    return c.json({ success: true, id: deleted.id });
});

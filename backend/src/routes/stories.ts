import type { Context } from 'hono';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { zValidator } from '@hono/zod-validator';
import { and, asc, count, desc, eq, ilike, lte, or, type SQL } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/index.js';
import { stories } from '../db/schema.js';
import {
    normalizeJsonArray,
    normalizeJsonObject,
    normalizeStringArray,
    pagination,
    serializeRow,
    toDate,
} from '../lib/http.js';
import { slugifyOrFallback, uniqueSuffix } from '../lib/slug.js';

const storyInputSchema = z.object({
    headline: z.string().min(1).max(300).optional(),
    subhead: z.string().max(2000).nullable().optional(),
    category: z.string().max(120).nullable().optional(),
    author: z.string().max(120).nullable().optional(),
    authorId: z.string().nullable().optional(),
    author_id: z.string().nullable().optional(),
    editorId: z.string().nullable().optional(),
    editor_id: z.string().nullable().optional(),
    role: z.string().max(120).nullable().optional(),
    status: z.string().max(40).optional(),
    workflowStatus: z.string().max(40).optional(),
    workflow_status: z.string().max(40).optional(),
    layout: z.string().max(40).optional(),
    slug: z.string().max(200).optional(),
    heroImage: z.string().nullable().optional(),
    hero_image: z.string().nullable().optional(),
    videoUrl: z.string().nullable().optional(),
    video_url: z.string().nullable().optional(),
    leftVideoUrl: z.string().nullable().optional(),
    left_video_url: z.string().nullable().optional(),
    rightVideoUrl: z.string().nullable().optional(),
    right_video_url: z.string().nullable().optional(),
    ambientAudioUrl: z.string().nullable().optional(),
    ambient_audio_url: z.string().nullable().optional(),
    content: z.unknown().optional(),
    scrollySections: z.unknown().optional(),
    scrolly_sections: z.unknown().optional(),
    date: z.string().nullable().optional(),
    readTime: z.string().nullable().optional(),
    read_time: z.string().nullable().optional(),
    seriesSlug: z.string().nullable().optional(),
    series_slug: z.string().nullable().optional(),
    seriesPart: z.number().int().nullable().optional(),
    series_part: z.number().int().nullable().optional(),
    isFeatured: z.boolean().optional(),
    is_featured: z.boolean().optional(),
    lockedBy: z.string().nullable().optional(),
    locked_by: z.string().nullable().optional(),
    versionLog: z.unknown().optional(),
    version_log: z.unknown().optional(),
    tags: z.unknown().optional(),
    sources: z.unknown().optional(),
    footnotes: z.unknown().optional(),
    related: z.unknown().optional(),
    seo: z.unknown().optional(),
    revisionSnapshots: z.unknown().optional(),
    revision_snapshots: z.unknown().optional(),
    publishedAt: z.string().nullable().optional(),
    published_at: z.string().nullable().optional(),
    scheduledAt: z.string().nullable().optional(),
    scheduled_at: z.string().nullable().optional(),
});

type StoryInput = z.infer<typeof storyInputSchema>;

function firstDefined(body: StoryInput, ...keys: (keyof StoryInput)[]) {
    for (const key of keys) {
        if (body[key] !== undefined) return body[key];
    }
    return undefined;
}

function storyRowFromInput(body: StoryInput, mode: 'create' | 'update') {
    const row: Record<string, unknown> = {};
    const set = (column: string, value: unknown) => {
        if (value !== undefined) row[column] = value;
    };

    const headline = firstDefined(body, 'headline');
    if (headline !== undefined) row.headline = headline;
    set('subhead', firstDefined(body, 'subhead'));
    set('category', firstDefined(body, 'category'));
    set('author', firstDefined(body, 'author'));
    set('authorId', firstDefined(body, 'authorId', 'author_id'));
    set('editorId', firstDefined(body, 'editorId', 'editor_id'));
    set('role', firstDefined(body, 'role'));
    set('status', firstDefined(body, 'status'));
    set('workflowStatus', firstDefined(body, 'workflowStatus', 'workflow_status'));
    set('layout', firstDefined(body, 'layout'));
    set('heroImage', firstDefined(body, 'heroImage', 'hero_image'));
    set('videoUrl', firstDefined(body, 'videoUrl', 'video_url'));
    set('leftVideoUrl', firstDefined(body, 'leftVideoUrl', 'left_video_url'));
    set('rightVideoUrl', firstDefined(body, 'rightVideoUrl', 'right_video_url'));
    set('ambientAudioUrl', firstDefined(body, 'ambientAudioUrl', 'ambient_audio_url'));
    set('date', firstDefined(body, 'date'));
    set('readTime', firstDefined(body, 'readTime', 'read_time'));
    set('seriesSlug', firstDefined(body, 'seriesSlug', 'series_slug'));
    set('seriesPart', firstDefined(body, 'seriesPart', 'series_part'));
    set('isFeatured', firstDefined(body, 'isFeatured', 'is_featured'));
    set('lockedBy', firstDefined(body, 'lockedBy', 'locked_by'));
    set('publishedAt', toDate(firstDefined(body, 'publishedAt', 'published_at')));
    set('scheduledAt', toDate(firstDefined(body, 'scheduledAt', 'scheduled_at')));

    const content = firstDefined(body, 'content');
    if (content !== undefined) row.content = normalizeJsonArray(content);
    const scrolly = firstDefined(body, 'scrollySections', 'scrolly_sections');
    if (scrolly !== undefined) row.scrollySections = normalizeJsonArray(scrolly);
    const tags = firstDefined(body, 'tags');
    if (tags !== undefined) row.tags = normalizeStringArray(tags);
    const sources = firstDefined(body, 'sources');
    if (sources !== undefined) row.sources = normalizeJsonArray(sources);
    const footnotes = firstDefined(body, 'footnotes');
    if (footnotes !== undefined) row.footnotes = normalizeJsonArray(footnotes);
    const related = firstDefined(body, 'related');
    if (related !== undefined) row.related = normalizeJsonArray(related);
    const seo = firstDefined(body, 'seo');
    if (seo !== undefined) row.seo = normalizeJsonObject(seo);
    const revisions = firstDefined(body, 'revisionSnapshots', 'revision_snapshots');
    if (revisions !== undefined) row.revisionSnapshots = normalizeJsonArray(revisions);
    const versionLog = firstDefined(body, 'versionLog', 'version_log');
    if (versionLog !== undefined) row.versionLog = normalizeJsonArray(versionLog);

    if (mode === 'create') {
        if (!row.headline) throw new HTTPException(400, { message: 'headline is required' });
        const slugInput = firstDefined(body, 'slug');
        row.slug = slugifyOrFallback(
            typeof slugInput === 'string' && slugInput ? slugInput : String(row.headline),
            'story',
        );
        row.status = (row.status as string | undefined) ?? 'Draft';
        row.workflowStatus = (row.workflowStatus as string | undefined) ?? 'draft';
        row.layout = (row.layout as string | undefined) ?? 'standard';
    }

    row.updatedAt = new Date();

    if (row.status === 'Published' && !row.publishedAt) {
        row.publishedAt = new Date();
        if (!row.workflowStatus) row.workflowStatus = 'published';
    }

    return row;
}

async function ensureUniqueSlug(base: string, excludeId?: string): Promise<string> {
    let candidate = slugifyOrFallback(base, 'story');
    const [collision] = await db
        .select({ id: stories.id })
        .from(stories)
        .where(eq(stories.slug, candidate))
        .limit(1);
    if (!collision || collision.id === excludeId) return candidate;
    candidate = `${candidate}-${uniqueSuffix()}`;
    return candidate;
}

export function serializeStory(row: Record<string, unknown>) {
    const serialized = serializeRow(row);
    return {
        ...serialized,
        workflow_status: serialized.workflowStatus,
        author_id: serialized.authorId,
        editor_id: serialized.editorId,
        hero_image: serialized.heroImage,
        video_url: serialized.videoUrl,
        left_video_url: serialized.leftVideoUrl,
        right_video_url: serialized.rightVideoUrl,
        ambient_audio_url: serialized.ambientAudioUrl,
        read_time: serialized.readTime,
        series_slug: serialized.seriesSlug,
        series_part: serialized.seriesPart,
        is_featured: serialized.isFeatured,
        locked_by: serialized.lockedBy,
        version_log: serialized.versionLog,
        revision_snapshots: serialized.revisionSnapshots,
        published_at: serialized.publishedAt,
        scheduled_at: serialized.scheduledAt,
        scrolly_sections: serialized.scrollySections,
    };
}

function sortClause(sort: string | undefined) {
    switch (sort) {
        case 'publishedAt':
            return asc(stories.publishedAt);
        case 'createdAt':
            return asc(stories.createdAt);
        case '-createdAt':
            return desc(stories.createdAt);
        case 'headline':
            return asc(stories.headline);
        case '-publishedAt':
        default:
            return desc(stories.publishedAt);
    }
}

function filtersForAdmin(c: Context) {
    const conditions: SQL[] = [];
    const status = c.req.query('status');
    const category = c.req.query('category');
    const q = c.req.query('q');
    if (status) conditions.push(eq(stories.status, status));
    if (category) conditions.push(eq(stories.category, category));
    if (q) {
        const search = or(ilike(stories.headline, `%${q}%`), ilike(stories.subhead, `%${q}%`));
        if (search) conditions.push(search);
    }
    return conditions;
}

export const publicStories = new Hono();

publicStories.get('/', async (c) => {
    const { limit, offset } = pagination(c);
    const q = c.req.query('q')?.trim();
    const category = c.req.query('category');
    const series = c.req.query('series');
    const featured = c.req.query('featured');

    const conditions: SQL[] = [
        eq(stories.status, 'Published'),
        lte(stories.publishedAt, new Date()),
    ];

    if (q) {
        const search = or(ilike(stories.headline, `%${q}%`), ilike(stories.subhead, `%${q}%`));
        if (search) conditions.push(search);
    }
    if (category) conditions.push(eq(stories.category, category));
    if (series) conditions.push(eq(stories.seriesSlug, series));
    if (featured === 'true') conditions.push(eq(stories.isFeatured, true));

    const where = and(...conditions);

    const [rows, total] = await Promise.all([
        db
            .select()
            .from(stories)
            .where(where)
            .orderBy(sortClause(c.req.query('sort')))
            .limit(limit)
            .offset(offset),
        db.select({ value: count() }).from(stories).where(where),
    ]);

    return c.json({
        documents: rows.map((row) => serializeStory(row as unknown as Record<string, unknown>)),
        total: Number(total[0]?.value ?? 0),
    });
});

publicStories.get('/:idOrSlug', async (c) => {
    const value = c.req.param('idOrSlug');
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
    const identity = isUuid ? eq(stories.id, value) : eq(stories.slug, value);

    const [row] = await db
        .select()
        .from(stories)
        .where(and(identity, eq(stories.status, 'Published'), lte(stories.publishedAt, new Date())))
        .limit(1);

    if (!row) throw new HTTPException(404, { message: 'Story not found' });
    return c.json(serializeStory(row as unknown as Record<string, unknown>));
});

export const adminStories = new Hono();

adminStories.get('/', async (c) => {
    const { limit, offset } = pagination(c);
    const where = and(...filtersForAdmin(c));

    const [rows, total] = await Promise.all([
        db
            .select()
            .from(stories)
            .where(where)
            .orderBy(sortClause(c.req.query('sort')))
            .limit(limit)
            .offset(offset),
        db.select({ value: count() }).from(stories).where(where),
    ]);

    return c.json({
        documents: rows.map((row) => serializeStory(row as unknown as Record<string, unknown>)),
        total: Number(total[0]?.value ?? 0),
    });
});

adminStories.get('/:id', async (c) => {
    const value = c.req.param('id');
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
    const identity = isUuid ? eq(stories.id, value) : eq(stories.slug, value);
    const [row] = await db.select().from(stories).where(identity).limit(1);
    if (!row) throw new HTTPException(404, { message: 'Story not found' });
    return c.json(serializeStory(row as unknown as Record<string, unknown>));
});

adminStories.post('/', zValidator('json', storyInputSchema), async (c) => {
    const body = c.req.valid('json');
    const row = storyRowFromInput(body, 'create');
    row.slug = await ensureUniqueSlug(String(row.slug));

    const [created] = await db
        .insert(stories)
        .values(row as typeof stories.$inferInsert)
        .returning();

    return c.json(serializeStory(created as unknown as Record<string, unknown>), 201);
});

adminStories.patch('/:id', zValidator('json', storyInputSchema), async (c) => {
    const id = c.req.param('id');
    const body = c.req.valid('json');
    const row = storyRowFromInput(body, 'update');

    if (body.slug !== undefined) {
        row.slug = await ensureUniqueSlug(body.slug, id);
    }
    if (Object.keys(row).length === 1) {
        const [existing] = await db.select().from(stories).where(eq(stories.id, id)).limit(1);
        if (!existing) throw new HTTPException(404, { message: 'Story not found' });
        return c.json(serializeStory(existing as unknown as Record<string, unknown>));
    }

    const [updated] = await db
        .update(stories)
        .set(row as Partial<typeof stories.$inferInsert>)
        .where(eq(stories.id, id))
        .returning();

    if (!updated) throw new HTTPException(404, { message: 'Story not found' });
    return c.json(serializeStory(updated as unknown as Record<string, unknown>));
});

adminStories.delete('/:id', async (c) => {
    const [deleted] = await db.delete(stories).where(eq(stories.id, c.req.param('id'))).returning({ id: stories.id });
    if (!deleted) throw new HTTPException(404, { message: 'Story not found' });
    return c.json({ success: true, id: deleted.id });
});

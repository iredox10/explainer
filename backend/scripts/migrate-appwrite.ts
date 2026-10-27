import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { and, eq, isNull } from 'drizzle-orm';
import { closeDatabase, db } from '../src/db/index.js';
import {
    activityLog,
    assignments,
    authors,
    campaigns,
    categories,
    comments,
    media,
    notifications,
    settings,
    stories,
    subscribers,
} from '../src/db/schema.js';
import { env } from '../src/env.js';
import {
    normalizeJsonArray,
    normalizeJsonObject,
    normalizeStringArray,
    parseJson,
    toDate,
} from '../src/lib/http.js';
import { slugify } from '../src/lib/slug.js';
import { logger } from '../src/lib/logger.js';
import { putObject } from '../src/lib/storage.js';

type LegacyDoc = Record<string, unknown> & {
    $id: string;
    $createdAt?: string;
    $updatedAt?: string;
};

const FLAGS = new Set(process.argv.slice(2));
const DRY_RUN = FLAGS.has('--dry-run');
const SKIP_MEDIA = FLAGS.has('--skip-media');
const ONLY = (() => {
    const flag = [...FLAGS].find((value) => value.startsWith('--only='));
    return flag ? new Set(flag.slice('--only='.length).split(',').map((v) => v.trim()).filter(Boolean)) : null;
})();

const COLLECTIONS = {
    stories: 'stories',
    authors: 'authors',
    categories: 'categories',
    configs: 'configs',
    subscribers: 'subscribers',
    media: process.env.APPWRITE_MEDIA_COLLECTION || '69931689000ed9172485',
    comments: process.env.APPWRITE_COMMENTS_COLLECTION || '6993168d003721c2a818',
    activity: process.env.APPWRITE_ACTIVITY_COLLECTION || '69931692002b481e1f65',
    notifications: process.env.APPWRITE_NOTIFICATIONS_COLLECTION || '6993169700368e51c1bb',
    assignments: process.env.APPWRITE_ASSIGNMENTS_COLLECTION || '6993169d00183f5e36ea',
    campaigns: process.env.APPWRITE_CAMPAIGNS_COLLECTION || '699316a700375a018328',
};

const MANIFEST_PATH = path.resolve(process.cwd(), '.appwrite-media-map.json');
const FILE_URL_RE = /\/storage\/buckets\/[^/]+\/files\/([^/?#]+)\/(?:view|download|preview)[^"'\s)]*/g;

const counts = {
    categories: 0,
    authors: 0,
    stories: 0,
    media: 0,
    subscribers: 0,
    campaigns: 0,
    comments: 0,
    assignments: 0,
    notifications: 0,
    activity: 0,
    settings: 0,
    skipped: 0,
};

function enabled(name: string): boolean {
    return !ONLY || ONLY.has(name);
}

function requireAppwriteConfig() {
    const missing = (['APPWRITE_ENDPOINT', 'APPWRITE_PROJECT_ID', 'APPWRITE_API_KEY'] as const).filter(
        (key) => !env[key],
    );
    if (missing.length > 0) {
        throw new Error(
            `Missing ${missing.join(', ')}. Set them in backend/.env before running the export.`,
        );
    }
}

async function appwrite(pathname: string): Promise<Response> {
    const endpoint = env.APPWRITE_ENDPOINT!.replace(/\/$/, '');
    const response = await fetch(`${endpoint}${pathname}`, {
        headers: {
            'X-Appwrite-Project': env.APPWRITE_PROJECT_ID!,
            'X-Appwrite-Key': env.APPWRITE_API_KEY!,
            'X-Appwrite-Response-Format': '1.6.0',
        },
    });

    if (!response.ok) {
        const body = await response.text();
        throw new Error(`Appwrite ${response.status} ${pathname}: ${body.slice(0, 500)}`);
    }

    return response;
}

async function listDocuments(collectionId: string): Promise<LegacyDoc[]> {
    const documents: LegacyDoc[] = [];
    const limit = 100;
    let offset = 0;

    for (;;) {
        const params = new URLSearchParams();
        params.append('queries[]', `limit(${limit})`);
        params.append('queries[]', `offset(${offset})`);
        const response = await appwrite(
            `/databases/${env.APPWRITE_DATABASE_ID}/collections/${collectionId}/documents?${params.toString()}`,
        );
        const payload = (await response.json()) as { documents?: LegacyDoc[] };
        const page = payload.documents ?? [];
        documents.push(...page);
        if (page.length < limit) break;
        offset += limit;
    }

    return documents;
}

async function loadManifest(): Promise<Record<string, { key: string; url: string }>> {
    try {
        return JSON.parse(await readFile(MANIFEST_PATH, 'utf8'));
    } catch {
        return {};
    }
}

async function saveManifest(manifest: Record<string, { key: string; url: string }>) {
    await writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
}

function makeRewriter(fileUrls: Map<string, string>) {
    return function rewrite<T>(value: T): T {
        if (typeof value === 'string') {
            return value.replace(FILE_URL_RE, (match, fileId: string) => fileUrls.get(fileId) ?? match) as T;
        }
        if (Array.isArray(value)) {
            return value.map((entry) => rewrite(entry)) as T;
        }
        if (value && typeof value === 'object') {
            const output: Record<string, unknown> = {};
            for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
                output[key] = rewrite(entry);
            }
            return output as T;
        }
        return value;
    };
}

function stringValue(doc: LegacyDoc, ...keys: string[]): string | null {
    for (const key of keys) {
        const value = doc[key];
        if (typeof value === 'string' && value.trim()) return value;
        if (typeof value === 'number') return String(value);
    }
    return null;
}

function numberValue(doc: LegacyDoc, ...keys: string[]): number | null {
    for (const key of keys) {
        const value = doc[key];
        if (typeof value === 'number' && Number.isFinite(value)) return value;
        if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value);
    }
    return null;
}

function booleanValue(doc: LegacyDoc, ...keys: string[]): boolean {
    for (const key of keys) {
        const value = doc[key];
        if (typeof value === 'boolean') return value;
        if (value === 'true') return true;
        if (value === 'false') return false;
    }
    return false;
}

function timestamp(doc: LegacyDoc, ...keys: string[]): Date {
    for (const key of keys) {
        const parsed = toDate(doc[key]);
        if (parsed) return parsed;
    }
    return new Date();
}

async function migrateCategories(rewrite: ReturnType<typeof makeRewriter>) {
    if (!enabled('categories')) return;
    const docs = await listDocuments(COLLECTIONS.categories);
    for (const doc of docs) {
        const name = stringValue(doc, 'name');
        if (!name) {
            counts.skipped += 1;
            continue;
        }
        const slug = slugify(stringValue(doc, 'slug') || name) || slugify(name);
        const values = {
            name: rewrite(name),
            slug,
            color: stringValue(doc, 'color') || '#000000',
            createdAt: timestamp(doc, 'createdAt', '$createdAt'),
            updatedAt: timestamp(doc, 'updatedAt', '$updatedAt'),
        };
        if (!DRY_RUN) {
            await db.insert(categories).values(values).onConflictDoUpdate({
                target: categories.slug,
                set: { name: values.name, color: values.color, updatedAt: values.updatedAt },
            });
        }
        counts.categories += 1;
    }
    logger.info({ count: counts.categories }, 'categories migrated');
}

async function migrateAuthors(rewrite: ReturnType<typeof makeRewriter>) {
    if (!enabled('authors')) return new Map<string, string>();
    const docs = await listDocuments(COLLECTIONS.authors);
    const idMap = new Map<string, string>();

    for (const doc of docs) {
        const name = stringValue(doc, 'name');
        if (!name) {
            counts.skipped += 1;
            continue;
        }
        const email = stringValue(doc, 'email')?.toLowerCase() ?? null;
        const slug = slugify(stringValue(doc, 'slug') || name) || `author-${doc.$id}`;

        const [bySlug] = await db.select({ id: authors.id }).from(authors).where(eq(authors.slug, slug)).limit(1);
        const [byEmail] = email
            ? await db.select({ id: authors.id }).from(authors).where(eq(authors.email, email)).limit(1)
            : [];
        const existingId = byEmail?.id ?? bySlug?.id;

        const values = {
            name: rewrite(name),
            email,
            role: stringValue(doc, 'role'),
            bio: stringValue(doc, 'bio'),
            slug,
            imageUrl: stringValue(doc, 'imageUrl', 'image_url'),
            createdAt: timestamp(doc, 'createdAt', '$createdAt'),
            updatedAt: timestamp(doc, 'updatedAt', '$updatedAt'),
        };

        if (!DRY_RUN) {
            if (existingId) {
                await db.update(authors).set(values).where(eq(authors.id, existingId));
                idMap.set(doc.$id, existingId);
            } else {
                const [created] = await db.insert(authors).values(values).returning({ id: authors.id });
                if (created) idMap.set(doc.$id, created.id);
            }
        }
        counts.authors += 1;
    }

    logger.info({ count: counts.authors }, 'authors migrated');
    return idMap;
}

async function migrateMedia(rewrite: ReturnType<typeof makeRewriter>) {
    if (!enabled('media') || SKIP_MEDIA) return new Map<string, string>();
    const docs = await listDocuments(COLLECTIONS.media);
    const manifest = await loadManifest();
    const fileUrls = new Map<string, string>();

    for (const doc of docs) {
        const fileId = stringValue(doc, 'fileId', '$id');
        if (!fileId) {
            counts.skipped += 1;
            continue;
        }

        const cached = manifest[fileId];
        let stored = cached;

        if (!stored && !DRY_RUN) {
            const originalName = stringValue(doc, 'originalName', 'filename') || `${fileId}`;
            const mimeType = stringValue(doc, 'mimeType') || 'application/octet-stream';
            const response = await appwrite(
                `/storage/buckets/${env.APPWRITE_BUCKET_ID}/files/${fileId}/download`,
            );
            const buffer = Buffer.from(await response.arrayBuffer());
            const file = new File([buffer], originalName, { type: mimeType });
            const uploaded = await putObject(file, `${fileId}-${originalName}`);
            stored = { key: uploaded.key, url: uploaded.url };
            manifest[fileId] = stored;
            await saveManifest(manifest);
        }

        if (stored) {
            fileUrls.set(fileId, stored.url);
            const oldUrl = stringValue(doc, 'url');
            if (oldUrl) fileUrls.set(oldUrl, stored.url);

            if (!DRY_RUN) {
                const existing = await db
                    .select({ id: media.id })
                    .from(media)
                    .where(eq(media.storageKey, stored.key))
                    .limit(1);
                const values = {
                    storageKey: stored.key,
                    filename: stringValue(doc, 'filename') || path.basename(stored.key),
                    originalName: stringValue(doc, 'originalName', 'filename'),
                    mimeType: stringValue(doc, 'mimeType'),
                    size: numberValue(doc, 'size'),
                    url: stored.url,
                    tags: normalizeStringArray(doc.tags),
                    usage: normalizeStringArray(doc.usage),
                    caption: stringValue(doc, 'caption'),
                    altText: stringValue(doc, 'altText', 'alt_text'),
                    width: numberValue(doc, 'width'),
                    height: numberValue(doc, 'height'),
                    uploadedAt: timestamp(doc, 'uploadedAt', 'createdAt', '$createdAt'),
                };
                if (existing[0]) {
                    await db.update(media).set(values).where(eq(media.id, existing[0].id));
                } else {
                    await db.insert(media).values(values).onConflictDoNothing({ target: media.storageKey });
                }
            }
            counts.media += 1;
        }
    }

    logger.info({ count: counts.media, skipped: docs.length - counts.media }, 'media migrated');
    return fileUrls;
}

async function migrateStories(
    rewrite: ReturnType<typeof makeRewriter>,
    authorMap: Map<string, string>,
) {
    if (!enabled('stories')) return new Map<string, string>();
    const docs = await listDocuments(COLLECTIONS.stories);
    const storyMap = new Map<string, string>();

    for (const doc of docs) {
        const headline = stringValue(doc, 'headline');
        if (!headline) {
            counts.skipped += 1;
            continue;
        }

        const slug =
            slugify(stringValue(doc, 'slug') || headline) || `story-${doc.$id.toLowerCase()}`;
        const status = stringValue(doc, 'status') || 'Draft';
        const workflowStatus =
            stringValue(doc, 'workflow_status', 'workflowStatus') ||
            (status === 'Published' ? 'published' : 'draft');
        const legacyAuthorId = stringValue(doc, 'author_id', 'authorId');
        const publishedAt = toDate(doc.published_at ?? doc.publishedAt) ??
            (status === 'Published' ? timestamp(doc, '$createdAt') : null);

        const values = {
            slug,
            headline: rewrite(headline),
            subhead: stringValue(doc, 'subhead'),
            category: stringValue(doc, 'category'),
            author: stringValue(doc, 'author'),
            authorId: legacyAuthorId ? authorMap.get(legacyAuthorId) ?? null : null,
            editorId: null,
            role: stringValue(doc, 'role'),
            status,
            workflowStatus,
            layout: stringValue(doc, 'layout') || 'standard',
            heroImage: rewrite(stringValue(doc, 'heroImage', 'hero_image')),
            videoUrl: rewrite(stringValue(doc, 'videoUrl', 'video_url')),
            leftVideoUrl: rewrite(stringValue(doc, 'leftVideoUrl', 'left_video_url')),
            rightVideoUrl: rewrite(stringValue(doc, 'rightVideoUrl', 'right_video_url')),
            ambientAudioUrl: rewrite(stringValue(doc, 'ambientAudioUrl', 'ambient_audio_url')),
            content: rewrite(normalizeJsonArray(doc.content)),
            scrollySections: rewrite(normalizeJsonArray(doc.scrolly_sections ?? doc.scrollySections)),
            date: stringValue(doc, 'date'),
            readTime: stringValue(doc, 'read_time', 'readTime'),
            seriesSlug: stringValue(doc, 'series_slug', 'seriesSlug'),
            seriesPart: numberValue(doc, 'series_part', 'seriesPart'),
            isFeatured: booleanValue(doc, 'is_featured', 'isFeatured'),
            lockedBy: null,
            versionLog: parseJson(doc.version_log ?? doc.versionLog, []),
            tags: normalizeStringArray(doc.tags),
            sources: rewrite(normalizeJsonArray(doc.sources)),
            footnotes: rewrite(normalizeJsonArray(doc.footnotes)),
            related: rewrite(normalizeJsonArray(doc.related)),
            seo: rewrite(normalizeJsonObject(doc.seo)),
            revisionSnapshots: rewrite(normalizeJsonArray(doc.revision_snapshots ?? doc.revisionSnapshots)),
            publishedAt,
            scheduledAt: toDate(doc.scheduled_at ?? doc.scheduledAt),
            createdAt: timestamp(doc, 'createdAt', '$createdAt'),
            updatedAt: timestamp(doc, 'updatedAt', '$updatedAt'),
        };

        if (!DRY_RUN) {
            const [saved] = await db
                .insert(stories)
                .values(values)
                .onConflictDoUpdate({ target: stories.slug, set: values })
                .returning({ id: stories.id });
            if (saved) storyMap.set(doc.$id, saved.id);
        } else {
            storyMap.set(doc.$id, doc.$id);
        }
        counts.stories += 1;
    }

    logger.info({ count: counts.stories }, 'stories migrated');
    return storyMap;
}

async function migrateSubscribers() {
    if (!enabled('subscribers')) return;
    const docs = await listDocuments(COLLECTIONS.subscribers);

    for (const doc of docs) {
        const email = stringValue(doc, 'email')?.toLowerCase();
        if (!email) {
            counts.skipped += 1;
            continue;
        }
        const values = {
            email,
            status: stringValue(doc, 'status') || 'active',
            subscribedAt: timestamp(doc, 'subscribedAt', '$createdAt'),
        };
        if (!DRY_RUN) {
            await db.insert(subscribers).values(values).onConflictDoUpdate({
                target: subscribers.email,
                set: { status: values.status },
            });
        }
        counts.subscribers += 1;
    }
    logger.info({ count: counts.subscribers }, 'subscribers migrated');
}

async function migrateSettings() {
    if (!enabled('settings')) return;
    const docs = await listDocuments(COLLECTIONS.configs);
    const doc = docs[0];
    if (!doc) {
        logger.info('no legacy config document found; keeping default settings');
        return;
    }

    const values = {
        siteName: stringValue(doc, 'site_name', 'siteName') || 'Explainer',
        maintenanceMode: booleanValue(doc, 'maintenance_mode', 'maintenanceMode'),
        breakingNewsActive: booleanValue(doc, 'breaking_news_active', 'breakingNewsActive'),
        updatedAt: timestamp(doc, 'updatedAt', '$updatedAt'),
    };

    if (!DRY_RUN) {
        await db
            .insert(settings)
            .values({ id: 1, ...values })
            .onConflictDoUpdate({ target: settings.id, set: values });
    }
    counts.settings += 1;
    logger.info('settings migrated');
}

async function migrateCampaigns(rewrite: ReturnType<typeof makeRewriter>) {
    if (!enabled('campaigns')) return;
    const docs = await listDocuments(COLLECTIONS.campaigns);

    for (const doc of docs) {
        const subject = stringValue(doc, 'subject');
        if (!subject) {
            counts.skipped += 1;
            continue;
        }
        const sentAt = toDate(doc.sentAt);
        const existing = sentAt
            ? await db
                  .select({ id: campaigns.id })
                  .from(campaigns)
                  .where(and(eq(campaigns.subject, subject), eq(campaigns.sentAt, sentAt)))
                  .limit(1)
            : await db.select({ id: campaigns.id }).from(campaigns).where(eq(campaigns.subject, subject)).limit(1);

        if (existing[0]) {
            counts.skipped += 1;
            continue;
        }

        if (!DRY_RUN) {
            await db.insert(campaigns).values({
                subject: rewrite(subject),
                html: rewrite(stringValue(doc, 'html')),
                text: stringValue(doc, 'text'),
                status: stringValue(doc, 'status') === 'completed' ? 'sent' : (stringValue(doc, 'status') || 'draft'),
                totalRecipients: numberValue(doc, 'totalRecipients') ?? 0,
                sentCount: numberValue(doc, 'sentCount') ?? 0,
                failedCount: numberValue(doc, 'failedCount') ?? 0,
                openCount: numberValue(doc, 'openCount') ?? 0,
                clickCount: numberValue(doc, 'clickCount') ?? 0,
                sentAt,
                createdAt: timestamp(doc, '$createdAt'),
            });
        }
        counts.campaigns += 1;
    }
    logger.info({ count: counts.campaigns }, 'campaigns migrated');
}

async function migrateComments(rewrite: ReturnType<typeof makeRewriter>, storyMap: Map<string, string>) {
    if (!enabled('comments')) return;
    const docs = await listDocuments(COLLECTIONS.comments);

    for (const doc of docs) {
        const legacyStoryId = stringValue(doc, 'storyId', 'story_id');
        const storyId = legacyStoryId ? storyMap.get(legacyStoryId) : null;
        const content = stringValue(doc, 'content');
        const blockId = stringValue(doc, 'blockId', 'block_id');
        if (!storyId || !content || !blockId) {
            counts.skipped += 1;
            continue;
        }
        const authorName = stringValue(doc, 'authorName', 'author_name') || 'Unknown';
        const existing = await db
            .select({ id: comments.id })
            .from(comments)
            .where(
                and(
                    eq(comments.storyId, storyId),
                    eq(comments.blockId, blockId),
                    eq(comments.content, content),
                    eq(comments.authorName, authorName),
                ),
            )
            .limit(1);
        if (existing[0]) {
            counts.skipped += 1;
            continue;
        }

        if (!DRY_RUN) {
            await db.insert(comments).values({
                storyId,
                blockId,
                content: rewrite(content),
                authorId: stringValue(doc, 'authorId', 'author_id') || 'legacy',
                authorName,
                authorEmail: stringValue(doc, 'authorEmail', 'author_email'),
                resolved: booleanValue(doc, 'resolved'),
                resolvedAt: toDate(doc.resolvedAt),
                resolvedById: stringValue(doc, 'resolvedById'),
                resolvedByName: stringValue(doc, 'resolvedByName'),
                replies: normalizeJsonArray(doc.replies),
                createdAt: timestamp(doc, 'createdAt', '$createdAt'),
            });
        }
        counts.comments += 1;
    }
    logger.info({ count: counts.comments }, 'comments migrated');
}

async function migrateAssignments(storyMap: Map<string, string>) {
    if (!enabled('assignments')) return;
    const docs = await listDocuments(COLLECTIONS.assignments);

    for (const doc of docs) {
        const legacyStoryId = stringValue(doc, 'storyId', 'story_id');
        const storyId = legacyStoryId ? storyMap.get(legacyStoryId) : null;
        const storyTitle = stringValue(doc, 'storyTitle', 'story_title');
        const assignedToId = stringValue(doc, 'assignedToId', 'assigned_to_id');
        if (!storyId || !storyTitle || !assignedToId) {
            counts.skipped += 1;
            continue;
        }
        const deadline = toDate(doc.deadline) ?? timestamp(doc, '$createdAt');
        const existing = await db
            .select({ id: assignments.id })
            .from(assignments)
            .where(
                and(
                    eq(assignments.storyId, storyId),
                    eq(assignments.assignedToId, assignedToId),
                    eq(assignments.deadline, deadline),
                ),
            )
            .limit(1);
        if (existing[0]) {
            counts.skipped += 1;
            continue;
        }

        if (!DRY_RUN) {
            await db.insert(assignments).values({
                storyId,
                storyTitle,
                assignedToId,
                assignedToName: stringValue(doc, 'assignedToName', 'assigned_to_name') || 'Unknown',
                assignedById: stringValue(doc, 'assignedById'),
                assignedByName: stringValue(doc, 'assignedByName'),
                deadline,
                status: stringValue(doc, 'status') || 'assigned',
                notes: stringValue(doc, 'notes'),
                createdAt: timestamp(doc, 'createdAt', '$createdAt'),
                completedAt: toDate(doc.completedAt),
            });
        }
        counts.assignments += 1;
    }
    logger.info({ count: counts.assignments }, 'assignments migrated');
}

async function migrateNotifications() {
    if (!enabled('notifications')) return;
    const docs = await listDocuments(COLLECTIONS.notifications);

    for (const doc of docs) {
        const userId = stringValue(doc, 'userId', 'user_id');
        const title = stringValue(doc, 'title');
        const type = stringValue(doc, 'type');
        if (!userId || !title || !type) {
            counts.skipped += 1;
            continue;
        }
        const createdAt = timestamp(doc, 'createdAt', '$createdAt');
        const existing = await db
            .select({ id: notifications.id })
            .from(notifications)
            .where(
                and(
                    eq(notifications.userId, userId),
                    eq(notifications.title, title),
                    eq(notifications.createdAt, createdAt),
                ),
            )
            .limit(1);
        if (existing[0]) {
            counts.skipped += 1;
            continue;
        }

        if (!DRY_RUN) {
            await db.insert(notifications).values({
                userId,
                type,
                title,
                message: stringValue(doc, 'message'),
                link: stringValue(doc, 'link'),
                read: booleanValue(doc, 'read'),
                readAt: toDate(doc.readAt),
                createdAt,
            });
        }
        counts.notifications += 1;
    }
    logger.info({ count: counts.notifications }, 'notifications migrated');
}

async function migrateActivity(storyMap: Map<string, string>) {
    if (!enabled('activity')) return;
    const docs = await listDocuments(COLLECTIONS.activity);

    for (const doc of docs) {
        const type = stringValue(doc, 'type');
        if (!type) {
            counts.skipped += 1;
            continue;
        }
        const legacyStoryId = stringValue(doc, 'storyId', 'story_id');
        const timestampValue = timestamp(doc, 'timestamp', 'createdAt', '$createdAt');
        const userId = stringValue(doc, 'userId', 'user_id');
        const userName = stringValue(doc, 'userName', 'user_name');
        const existing = await db
            .select({ id: activityLog.id })
            .from(activityLog)
            .where(
                and(
                    eq(activityLog.type, type),
                    eq(activityLog.timestamp, timestampValue),
                    userId ? eq(activityLog.userId, userId) : isNull(activityLog.userId),
                ),
            )
            .limit(1);
        if (existing[0]) {
            counts.skipped += 1;
            continue;
        }

        if (!DRY_RUN) {
            await db.insert(activityLog).values({
                type,
                storyId: legacyStoryId ? storyMap.get(legacyStoryId) ?? null : null,
                userId,
                userName,
                details: normalizeJsonObject(doc.details),
                timestamp: timestampValue,
            });
        }
        counts.activity += 1;
    }
    logger.info({ count: counts.activity }, 'activity migrated');
}

async function run() {
    requireAppwriteConfig();

    if (DRY_RUN) logger.info('dry run: no database writes and no media downloads');

    const manifest = await loadManifest();
    const cachedUrls = new Map<string, string>();
    for (const [fileId, entry] of Object.entries(manifest)) {
        cachedUrls.set(fileId, entry.url);
    }

    const mediaUrls = enabled('media') && !SKIP_MEDIA ? await migrateMedia(makeRewriter(new Map())) : new Map<string, string>();
    const rewrite = makeRewriter(new Map([...cachedUrls, ...mediaUrls]));

    await migrateCategories(rewrite);
    await migrateSettings();
    const authorMap = await migrateAuthors(rewrite);
    const storyMap = await migrateStories(rewrite, authorMap);
    await migrateSubscribers();
    await migrateCampaigns(rewrite);
    await migrateComments(rewrite, storyMap);
    await migrateAssignments(storyMap);
    await migrateNotifications();
    await migrateActivity(storyMap);

    logger.info({ counts, dryRun: DRY_RUN }, 'migration complete');
    logger.warn(
        'User accounts are not migrated: Better Auth owns credentials. Re-invite editors or create accounts via /admin/login, then set profile roles.',
    );
}

run()
    .then(async () => {
        await closeDatabase();
        process.exit(0);
    })
    .catch(async (error) => {
        logger.error({ message: (error as Error).message }, 'migration failed');
        console.error((error as Error).stack ?? error);
        await closeDatabase();
        process.exit(1);
    });

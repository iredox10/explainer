import { eq, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { authors, categories } from '../db/schema.js';
import { slugify, slugifyOrFallback, uniqueSuffix } from './slug.js';

export type CategoryRow = typeof categories.$inferSelect;
export type AuthorRow = typeof authors.$inferSelect;

const DEFAULT_CATEGORY_COLOR = '#000000';
const MAX_SLUG_ATTEMPTS = 3;

function isUniqueViolation(error: unknown): boolean {
    return (
        typeof error === 'object' &&
        error !== null &&
        (error as { code?: unknown }).code === '23505'
    );
}

/** Finds a category by exact name (case-insensitive), then by slug. */
export async function findCategory(name: string): Promise<CategoryRow | null> {
    const trimmed = name.trim();
    if (!trimmed) return null;

    const [byName] = await db
        .select()
        .from(categories)
        .where(sql`lower(${categories.name}) = lower(${trimmed})`)
        .limit(1);
    if (byName) return byName;

    const slug = slugify(trimmed);
    if (!slug) return null;

    const [bySlug] = await db
        .select()
        .from(categories)
        .where(eq(categories.slug, slug))
        .limit(1);
    return bySlug ?? null;
}

/**
 * Returns the category record for a free-text story category, creating it when
 * it does not exist yet. Returns null for blank names.
 */
export async function ensureCategory(name: string): Promise<CategoryRow | null> {
    const trimmed = name.trim();
    if (!trimmed) return null;

    const existing = await findCategory(trimmed);
    if (existing) return existing;

    let slug = slugifyOrFallback(trimmed, 'category');
    for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt += 1) {
        try {
            const [created] = await db
                .insert(categories)
                .values({ name: trimmed, slug, color: DEFAULT_CATEGORY_COLOR })
                .returning();
            return created ?? null;
        } catch (error) {
            if (!isUniqueViolation(error)) throw error;
            slug = `${slugifyOrFallback(trimmed, 'category')}-${uniqueSuffix()}`;
        }
    }

    throw new Error(`Could not create category "${trimmed}" after ${MAX_SLUG_ATTEMPTS} attempts`);
}

/** Finds an author by exact name (case-insensitive), then by slug. */
export async function findAuthor(name: string): Promise<AuthorRow | null> {
    const trimmed = name.trim();
    if (!trimmed) return null;

    const [byName] = await db
        .select()
        .from(authors)
        .where(sql`lower(${authors.name}) = lower(${trimmed})`)
        .limit(1);
    if (byName) return byName;

    const slug = slugify(trimmed);
    if (!slug) return null;

    const [bySlug] = await db
        .select()
        .from(authors)
        .where(eq(authors.slug, slug))
        .limit(1);
    return bySlug ?? null;
}

/**
 * Returns the author record for a free-text story byline, creating it when it
 * does not exist yet. Returns null for blank names.
 */
export async function ensureAuthor(name: string): Promise<AuthorRow | null> {
    const trimmed = name.trim();
    if (!trimmed) return null;

    const existing = await findAuthor(trimmed);
    if (existing) return existing;

    let slug = slugifyOrFallback(trimmed, 'author');
    for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt += 1) {
        try {
            const [created] = await db
                .insert(authors)
                .values({ name: trimmed, slug })
                .returning();
            return created ?? null;
        } catch (error) {
            if (!isUniqueViolation(error)) throw error;
            slug = `${slugifyOrFallback(trimmed, 'author')}-${uniqueSuffix()}`;
        }
    }

    throw new Error(`Could not create author "${trimmed}" after ${MAX_SLUG_ATTEMPTS} attempts`);
}

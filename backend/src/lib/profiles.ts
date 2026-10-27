import { and, eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { authors, profiles } from '../db/schema.js';
import { slugifyOrFallback, uniqueSuffix } from './slug.js';

type ProfileInput = {
    userId: string;
    email: string;
    name: string;
    role?: string;
    status?: string;
    categories?: string[];
};

export async function ensureProfile(input: ProfileInput) {
    const values = {
        userId: input.userId,
        email: input.email,
        name: input.name,
        role: input.role ?? 'staff_writer',
        status: input.status ?? 'active',
        categories: input.categories ?? [],
    };

    const [profile] = await db
        .insert(profiles)
        .values(values)
        .onConflictDoUpdate({
            target: profiles.userId,
            set: {
                email: values.email,
                name: values.name,
                updatedAt: new Date(),
            },
        })
        .returning();

    if (!profile) {
        throw new Error(`Failed to create profile for ${input.userId}`);
    }

    return profile;
}

export async function ensureAuthor(input: { name: string; email: string; role?: string }) {
    const existing = await db
        .select()
        .from(authors)
        .where(eq(authors.email, input.email))
        .limit(1);

    if (existing[0]) return existing[0];

    const baseSlug = slugifyOrFallback(input.name, 'author');
    let slug = baseSlug;
    const collision = await db.select({ id: authors.id }).from(authors).where(eq(authors.slug, slug)).limit(1);
    if (collision.length > 0) slug = `${baseSlug}-${uniqueSuffix()}`;

    const [author] = await db
        .insert(authors)
        .values({
            name: input.name,
            email: input.email,
            role: input.role?.replace(/_/g, ' ').toUpperCase(),
            slug,
            bio: 'Editorial team member at EXPLAINER.',
        })
        .onConflictDoNothing({ target: authors.email })
        .returning();

    if (author) return author;

    const [fallback] = await db
        .select()
        .from(authors)
        .where(and(eq(authors.email, input.email)))
        .limit(1);
    return fallback ?? null;
}

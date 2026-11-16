import { and, eq, lte } from 'drizzle-orm';
import { db } from '../db/index.js';
import { stories } from '../db/schema.js';

export async function publishScheduledStories(now: Date = new Date()) {
    const due = await db
        .select({ id: stories.id, headline: stories.headline, slug: stories.slug })
        .from(stories)
        .where(and(eq(stories.status, 'Scheduled'), lte(stories.scheduledAt, now)));

    const published: typeof due = [];
    const failed: Array<{ id: string; error: string }> = [];

    for (const story of due) {
        try {
            await db
                .update(stories)
                .set({
                    status: 'Published',
                    workflowStatus: 'published',
                    publishedAt: now,
                    updatedAt: now,
                })
                .where(eq(stories.id, story.id));
            published.push(story);
        } catch (error) {
            failed.push({ id: story.id, error: (error as Error).message });
        }
    }

    return { published, failed, total: due.length };
}

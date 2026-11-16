import { closeDatabase, db } from '../src/db/index.js';
import { stories } from '../src/db/schema.js';
import { logger } from '../src/lib/logger.js';
import { ensureAuthor, findAuthor } from '../src/lib/taxonomy.js';

/**
 * Creates an author record for every distinct non-empty stories.author value.
 * Safe to re-run: existing names (case-insensitive) are left untouched.
 */
async function run(): Promise<void> {
    const rows = await db.selectDistinct({ author: stories.author }).from(stories);

    // De-duplicate case-insensitively, keeping the first spelling seen.
    const names = new Map<string, string>();
    for (const { author } of rows) {
        const trimmed = author?.trim();
        if (!trimmed) continue;
        const key = trimmed.toLowerCase();
        if (!names.has(key)) names.set(key, trimmed);
    }

    let created = 0;
    let existing = 0;

    for (const name of names.values()) {
        const found = await findAuthor(name);
        if (found) {
            existing += 1;
            continue;
        }

        const row = await ensureAuthor(name);
        if (!row) continue;
        created += 1;
        logger.info({ id: row.id, name: row.name, slug: row.slug }, 'author created');
    }

    logger.info({ distinct: names.size, created, existing }, 'author backfill complete');
}

run()
    .then(async () => {
        await closeDatabase();
        process.exit(0);
    })
    .catch(async (error) => {
        logger.error({ message: (error as Error).message }, 'author backfill failed');
        console.error((error as Error).stack ?? error);
        await closeDatabase();
        process.exit(1);
    });

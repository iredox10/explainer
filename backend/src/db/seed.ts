import { eq } from 'drizzle-orm';
import { auth } from '../auth/index.js';
import { ensureAuthor, ensureProfile } from '../lib/profiles.js';
import { logger } from '../lib/logger.js';
import { closeDatabase, db } from './index.js';
import { settings, user } from './schema.js';

async function seed() {
    await db.insert(settings).values({ id: 1 }).onConflictDoNothing();

    const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.SEED_ADMIN_PASSWORD;
    const name = process.env.SEED_ADMIN_NAME?.trim() || 'Newsroom Admin';

    if (!email || !password) {
        logger.info('SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD not set; skipped admin seed');
        return;
    }

    const [existing] = await db.select().from(user).where(eq(user.email, email)).limit(1);
    let userId = existing?.id;

    if (!existing) {
        const result = await auth.api.signUpEmail({ body: { email, password, name } });
        userId = result.user.id;
    }

    if (!userId) throw new Error('Could not resolve seeded admin user');

    await db.update(user).set({ role: 'superadmin' }).where(eq(user.id, userId));
    await ensureProfile({ userId, email, name, role: 'superadmin', status: 'active' });
    await ensureAuthor({ name, email, role: 'superadmin' });

    logger.info({ email }, 'seed admin ready');
}

seed()
    .then(async () => {
        await closeDatabase();
        process.exit(0);
    })
    .catch(async (error) => {
        logger.error({ error }, 'seed failed');
        await closeDatabase();
        process.exit(1);
    });

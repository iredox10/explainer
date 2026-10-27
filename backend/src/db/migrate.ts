import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db, closeDatabase } from './index.js';
import { logger } from '../lib/logger.js';

const migrationsFolder = process.env.MIGRATIONS_FOLDER ?? './drizzle';

export async function runMigrations(): Promise<void> {
    await migrate(db, { migrationsFolder });
    logger.info({ migrationsFolder }, 'migrations applied');
}

if (import.meta.url === `file://${process.argv[1]}`) {
    runMigrations()
        .then(() => closeDatabase())
        .catch(async (error) => {
            logger.error({ error }, 'migration failed');
            await closeDatabase();
            process.exit(1);
        });
}

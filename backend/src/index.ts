import { serve } from '@hono/node-server';
import { app } from './app.js';
import { bootstrapDatabase, closeDatabase } from './db/index.js';
import { runMigrations } from './db/migrate.js';
import { env } from './env.js';
import { logger } from './lib/logger.js';

async function start() {
    try {
        await runMigrations();
        await bootstrapDatabase();
        logger.info('database ready');
    } catch (error) {
        logger.error({ error }, 'database initialization failed');
        process.exit(1);
    }

    const server = serve({ fetch: app.fetch, port: env.PORT }, (info) => {
        logger.info({ port: info.port, env: env.NODE_ENV }, 'explainer api listening');
    });

    const shutdown = async (signal: string) => {
        logger.info({ signal }, 'shutting down');
        server.close();
        await closeDatabase();
        process.exit(0);
    };

    process.on('SIGINT', () => void shutdown('SIGINT'));
    process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

void start();

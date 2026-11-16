import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '../env.js';
import * as schema from './schema.js';

// Heroku Postgres requires TLS but injects DATABASE_URL without sslmode.
const databaseUrl =
    process.env.DYNO && !/[?&]sslmode=/.test(env.DATABASE_URL)
        ? `${env.DATABASE_URL}${env.DATABASE_URL.includes('?') ? '&' : '?'}sslmode=require`
        : env.DATABASE_URL;

export const sql = postgres(databaseUrl, {
    max: 10,
    idle_timeout: 20,
    prepare: false,
});

export const db = drizzle(sql, { schema });

export async function closeDatabase(): Promise<void> {
    await sql.end({ timeout: 5 });
}

/**
 * Idempotent pieces that drizzle-kit cannot express (extension, expression
 * indexes, singleton row). Safe to run on every boot after migrations.
 */
export async function bootstrapDatabase(): Promise<void> {
    await sql`CREATE EXTENSION IF NOT EXISTS pg_trgm`;
    await sql`
        CREATE INDEX IF NOT EXISTS stories_search_trgm_idx
        ON stories USING GIN ((headline || ' ' || coalesce(subhead, '')) gin_trgm_ops)
    `;
    await sql`INSERT INTO settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING`;
}

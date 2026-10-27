import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '../env.js';
import * as schema from './schema.js';

export const sql = postgres(env.DATABASE_URL, {
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

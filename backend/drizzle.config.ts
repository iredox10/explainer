import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

const configuredUrl = process.env.DATABASE_URL;
if (!configuredUrl) {
    throw new Error('DATABASE_URL is required to run drizzle-kit');
}

// Heroku Postgres requires TLS but injects DATABASE_URL without sslmode.
const databaseUrl =
    process.env.DYNO && !/[?&]sslmode=/.test(configuredUrl)
        ? `${configuredUrl}${configuredUrl.includes('?') ? '&' : '?'}sslmode=require`
        : configuredUrl;

export default defineConfig({
    schema: './src/db/schema.ts',
    out: './drizzle',
    dialect: 'postgresql',
    dbCredentials: {
        url: databaseUrl,
    },
    strict: true,
    verbose: true,
});

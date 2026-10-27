import 'dotenv/config';
import { z } from 'zod';

const envSchema = z
    .object({
        NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
        PORT: z.coerce.number().int().positive().default(8787),
        LOG_LEVEL: z.string().default('info'),

        DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

        BETTER_AUTH_SECRET: z.string().min(32, 'BETTER_AUTH_SECRET must be at least 32 characters'),
        BETTER_AUTH_URL: z.string().url(),
        FRONTEND_URL: z.string().url().default('http://localhost:4321'),
        TRUSTED_ORIGINS: z.string().optional(),

        STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
        UPLOAD_DIR: z.string().default('./uploads'),
        MEDIA_PUBLIC_BASE_URL: z.string().url().optional(),
        S3_ENDPOINT: z.string().url().optional(),
        S3_REGION: z.string().default('auto'),
        S3_BUCKET: z.string().optional(),
        S3_ACCESS_KEY_ID: z.string().optional(),
        S3_SECRET_ACCESS_KEY: z.string().optional(),
        S3_PUBLIC_URL: z.string().url().optional(),

        RESEND_API_KEY: z.string().optional(),
        EMAIL_FROM: z.string().default('news@explainer.africa'),
        CRON_SECRET: z.string().optional(),
        INTERNAL_API_KEY: z.string().optional(),

        APPWRITE_ENDPOINT: z.string().url().optional(),
        APPWRITE_PROJECT_ID: z.string().optional(),
        APPWRITE_API_KEY: z.string().optional(),
        APPWRITE_DATABASE_ID: z.string().default('vox_cms'),
        APPWRITE_BUCKET_ID: z.string().default('media'),
    })
    .superRefine((value, ctx) => {
        if (value.STORAGE_DRIVER !== 's3') return;
        for (const key of ['S3_BUCKET', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY'] as const) {
            if (!value[key]) {
                ctx.addIssue({ code: 'custom', path: [key], message: `${key} is required when STORAGE_DRIVER=s3` });
            }
        }
    });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error('[ENV] Invalid configuration:');
    for (const issue of parsed.error.issues) {
        console.error(`  - ${issue.path.join('.') || 'root'}: ${issue.message}`);
    }
    process.exit(1);
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === 'production';
export const trustedOrigins = Array.from(
    new Set([
        env.FRONTEND_URL,
        ...(env.TRUSTED_ORIGINS?.split(',').map((origin) => origin.trim()).filter(Boolean) ?? []),
        ...(env.NODE_ENV === 'development' ? ['http://localhost:4321', 'http://127.0.0.1:4321'] : []),
    ]),
);

import { randomUUID } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
    DeleteObjectCommand,
    GetObjectCommand,
    PutObjectCommand,
    S3Client,
} from '@aws-sdk/client-s3';
import { env } from '../env.js';
import { logger } from './logger.js';
import { slugify } from './slug.js';

const MAX_BYTES = 50 * 1024 * 1024;
const ALLOWED_MIME = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/avif',
    'image/svg+xml',
    'video/mp4',
    'video/webm',
    'audio/mpeg',
    'audio/wav',
    'application/pdf',
]);

let s3: S3Client | null = null;

function s3Client(): S3Client {
    if (s3) return s3;
    s3 = new S3Client({
        region: env.S3_REGION,
        endpoint: env.S3_ENDPOINT,
        forcePathStyle: Boolean(env.S3_ENDPOINT),
        credentials: {
            accessKeyId: env.S3_ACCESS_KEY_ID ?? '',
            secretAccessKey: env.S3_SECRET_ACCESS_KEY ?? '',
        },
    });
    return s3;
}

function buildKey(filename: string): string {
    const now = new Date();
    const folder = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
    const extension = path.extname(filename).toLowerCase().replace(/[^a-z0-9.]/g, '') || '';
    const base = slugify(path.basename(filename, path.extname(filename))).slice(0, 60) || 'file';
    return `${folder}/${randomUUID()}-${base}${extension}`;
}

export function validateUpload(file: File): void {
    if (file.size <= 0) throw new Error('Empty file');
    if (file.size > MAX_BYTES) throw new Error('File exceeds the 50MB limit');
    if (file.type && !ALLOWED_MIME.has(file.type)) {
        throw new Error(`Unsupported file type: ${file.type}`);
    }
}

export function publicUrlFor(key: string): string {
    if (env.STORAGE_DRIVER === 's3' && env.S3_PUBLIC_URL) {
        return `${env.S3_PUBLIC_URL.replace(/\/$/, '')}/${key}`;
    }
    const base = (env.MEDIA_PUBLIC_BASE_URL ?? env.BETTER_AUTH_URL).replace(/\/$/, '');
    return `${base}/media/${key}`;
}

export async function putObject(file: File, requestedName?: string): Promise<{ key: string; url: string }> {
    const key = buildKey(requestedName || file.name || 'upload');
    const buffer = Buffer.from(await file.arrayBuffer());

    if (env.STORAGE_DRIVER === 's3') {
        await s3Client().send(
            new PutObjectCommand({
                Bucket: env.S3_BUCKET,
                Key: key,
                Body: buffer,
                ContentType: file.type || 'application/octet-stream',
                CacheControl: 'public, max-age=31536000, immutable',
            }),
        );
    } else {
        const target = path.join(path.resolve(env.UPLOAD_DIR), key);
        await mkdir(path.dirname(target), { recursive: true });
        await writeFile(target, buffer);
    }

    return { key, url: publicUrlFor(key) };
}

export async function deleteObject(key: string): Promise<void> {
    if (env.STORAGE_DRIVER === 's3') {
        await s3Client().send(new DeleteObjectCommand({ Bucket: env.S3_BUCKET, Key: key }));
        return;
    }

    const target = safeLocalPath(key);
    await unlink(target).catch((error) => {
        logger.warn({ key, error: (error as Error).message }, 'local media delete failed');
    });
}

export async function readObject(key: string): Promise<{ data: Uint8Array; contentType?: string } | null> {
    if (env.STORAGE_DRIVER === 's3') {
        try {
            const response = await s3Client().send(
                new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: key }),
            );
            if (!response.Body) return null;
            const data = await response.Body.transformToByteArray();
            return { data, contentType: response.ContentType };
        } catch {
            return null;
        }
    }

    try {
        const data = await readFile(safeLocalPath(key));
        return { data };
    } catch {
        return null;
    }
}

export function safeLocalPath(key: string): string {
    if (!/^[A-Za-z0-9/_-]+\.[A-Za-z0-9]+$/.test(key)) {
        throw new Error('Invalid media key');
    }
    const root = path.resolve(env.UPLOAD_DIR);
    const target = path.resolve(root, key);
    if (!target.startsWith(`${root}${path.sep}`)) {
        throw new Error('Invalid media key');
    }
    return target;
}

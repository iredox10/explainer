import { randomBytes } from 'node:crypto';

export function slugify(input: string): string {
    return input
        .normalize('NFKD')
        .toLowerCase()
        .trim()
        .replace(/['"]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .replace(/-{2,}/g, '-');
}

export function slugifyOrFallback(input: string, fallback: string): string {
    return slugify(input) || `${fallback}-${randomBytes(3).toString('hex')}`;
}

export function uniqueSuffix(): string {
    return randomBytes(3).toString('hex');
}

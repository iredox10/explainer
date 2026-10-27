import type { Context } from 'hono';
import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { profiles } from '../db/schema.js';
import { auth } from './index.js';

export type AuthUser = {
    id: string;
    email: string;
    name: string;
    role?: string | null;
    banned?: boolean | null;
};

export type Profile = typeof profiles.$inferSelect;

export type AppEnv = {
    Variables: {
        user: AuthUser;
        profile: Profile | null;
    };
};

export const ROLES = ['superadmin', 'editor', 'staff_writer'] as const;
export type Role = (typeof ROLES)[number];

export function isRole(value: unknown): value is Role {
    return typeof value === 'string' && (ROLES as readonly string[]).includes(value);
}

export async function authenticate(c: Context<AppEnv>) {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) {
        throw new HTTPException(401, { message: 'Unauthorized' });
    }

    const user = session.user as AuthUser;
    const [profile] = await db
        .select()
        .from(profiles)
        .where(eq(profiles.userId, user.id))
        .limit(1);

    if (user.banned || profile?.status === 'suspended') {
        throw new HTTPException(403, { message: 'Account suspended' });
    }

    c.set('user', user);
    c.set('profile', profile ?? null);
    return { user, profile: profile ?? null };
}

export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
    await authenticate(c);
    await next();
});

export function requireRole(...roles: Role[]) {
    return createMiddleware<AppEnv>(async (c, next) => {
        if (!c.get('user')) {
            await authenticate(c);
        }
        const user = c.get('user');
        const profile = c.get('profile');
        const role = profile?.role ?? user?.role ?? 'staff_writer';
        if (!roles.includes(role as Role)) {
            throw new HTTPException(403, { message: 'Insufficient permissions' });
        }
        await next();
    });
}

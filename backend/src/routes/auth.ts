import { createHash } from 'node:crypto';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { zValidator } from '@hono/zod-validator';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { auth } from '../auth/index.js';
import { requireAuth, type AppEnv } from '../auth/middleware.js';
import { db } from '../db/index.js';
import { invites, profiles, user } from '../db/schema.js';
import { ensureAuthor, ensureProfile } from '../lib/profiles.js';
import { serializeRow } from '../lib/http.js';

export const authRoutes = new Hono<AppEnv>();

const acceptInviteSchema = z.object({
    token: z.string().min(10),
    password: z.string().min(8),
    name: z.string().min(1).max(120).optional(),
});

function hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
}

authRoutes.get('/me', requireAuth, async (c) => {
    const user = c.get('user');
    let profile = c.get('profile');

    if (!profile) {
        profile = await ensureProfile({
            userId: user.id,
            email: user.email,
            name: user.name || user.email.split('@')[0] || 'Editor',
            role: user.role ?? 'staff_writer',
        });
    }

    return c.json({
        user: {
            id: user.id,
            name: profile.name,
            email: profile.email,
            role: profile.role,
            status: profile.status,
            categories: profile.categories,
        },
        profile: profile ? serializeRow(profile as unknown as Record<string, unknown>) : null,
    });
});

authRoutes.post('/accept-invite', zValidator('json', acceptInviteSchema), async (c) => {
    const { token, password, name } = c.req.valid('json');
    const tokenHash = hashToken(token);

    const [invite] = await db
        .select()
        .from(invites)
        .where(
            and(
                eq(invites.tokenHash, tokenHash),
                isNull(invites.acceptedAt),
                gt(invites.expiresAt, new Date()),
            ),
        )
        .limit(1);

    if (!invite) {
        throw new HTTPException(400, { message: 'Invitation is invalid or has expired' });
    }

    const [existing] = await db
        .select({ id: user.id })
        .from(user)
        .where(eq(user.email, invite.email.toLowerCase()))
        .limit(1);

    if (existing) {
        throw new HTTPException(409, { message: 'An account with this email already exists' });
    }

    const displayName = name?.trim() || invite.name;
    const result = await auth.api.signUpEmail({
        body: { email: invite.email.toLowerCase(), password, name: displayName },
    });

    const created = result.user;
    await db.update(user).set({ role: invite.role }).where(eq(user.id, created.id));
    await ensureProfile({
        userId: created.id,
        email: invite.email.toLowerCase(),
        name: displayName,
        role: invite.role,
        categories: invite.categories,
    });
    await ensureAuthor({ name: displayName, email: invite.email.toLowerCase(), role: invite.role });
    await db.update(invites).set({ acceptedAt: new Date() }).where(eq(invites.id, invite.id));

    return c.json({
        token: result.token,
        user: { id: created.id, email: created.email, name: created.name },
    });
});

authRoutes.get('/profile', requireAuth, async (c) => {
    const profile = c.get('profile');
    return c.json({ profile: profile ? serializeRow(profile as unknown as Record<string, unknown>) : null });
});

export async function buildProfileForUser(userId: string) {
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
    return profile ?? null;
}

import { createHash, randomBytes } from 'node:crypto';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { zValidator } from '@hono/zod-validator';
import { and, eq, gt, isNull, or } from 'drizzle-orm';
import { z } from 'zod';
import { ROLES, isRole, requireAuth, requireRole, type AppEnv } from '../auth/middleware.js';
import { db } from '../db/index.js';
import { invites, profiles, session, user } from '../db/schema.js';
import { emailShell, sendEmail } from '../lib/email.js';
import { normalizeStringArray, serializeRow } from '../lib/http.js';

const inviteInput = z.object({
    email: z.string().email().max(320),
    name: z.string().min(1).max(160),
    role: z.string().max(40).optional(),
    categories: z.unknown().optional(),
});

const statusInput = z.object({
    status: z.enum(['active', 'suspended']),
});

const roleInput = z.object({
    role: z.enum(ROLES),
});

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function findProfile(id: string) {
    const condition = UUID_RE.test(id)
        ? or(eq(profiles.id, id), eq(profiles.userId, id))
        : eq(profiles.userId, id);
    const [profile] = await db.select().from(profiles).where(condition).limit(1);
    return profile ?? null;
}

function membership(profile: typeof profiles.$inferSelect) {
    return {
        ...serializeRow(profile as unknown as Record<string, unknown>),
        userId: profile.userId,
        userName: profile.name,
        userEmail: profile.email,
        roles: [profile.role, ...profile.categories.map((category) => `s_${category}`)],
        status: profile.status,
    };
}

export const adminUsers = new Hono<AppEnv>();

adminUsers.get('/', async (c) => {
    const rows = await db.select().from(profiles).orderBy(profiles.name);
    return c.json({
        documents: rows.map((row) => serializeRow(row as unknown as Record<string, unknown>)),
        total: rows.length,
    });
});

adminUsers.get('/team', async (c) => {
    const rows = await db.select().from(profiles).orderBy(profiles.name);
    const pending = await db
        .select()
        .from(invites)
        .where(and(isNull(invites.acceptedAt), gt(invites.expiresAt, new Date())));

    const members = rows.map(membership);
    const invitations = pending.map((invite) => ({
        ...serializeRow(invite as unknown as Record<string, unknown>),
        userId: null,
        userName: invite.name,
        userEmail: invite.email,
        roles: [invite.role, ...invite.categories.map((category) => `s_${category}`)],
        status: 'invited',
        kind: 'invite',
    }));

    return c.json({ memberships: [...members, ...invitations], total: members.length + invitations.length });
});

adminUsers.post(
    '/invite',
    requireAuth,
    requireRole('superadmin'),
    zValidator('json', inviteInput),
    async (c) => {
        const body = c.req.valid('json');
        const email = body.email.trim().toLowerCase();
        const role = isRole(body.role) ? body.role : 'staff_writer';
        const categories = normalizeStringArray(body.categories);

        const [existing] = await db.select({ id: user.id }).from(user).where(eq(user.email, email)).limit(1);
        if (existing) throw new HTTPException(409, { message: 'A user with this email already exists' });

        const token = randomBytes(32).toString('hex');
        const tokenHash = createHash('sha256').update(token).digest('hex');
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        const [invite] = await db
            .insert(invites)
            .values({
                email,
                name: body.name,
                role,
                categories,
                tokenHash,
                invitedBy: c.get('user')?.id ?? null,
                expiresAt,
            })
            .returning();

        const url = `${process.env.FRONTEND_URL}/admin/login?inviteToken=${token}`;
        await sendEmail({
            to: email,
            subject: 'You are invited to the Explainer newsroom',
            html: emailShell(
                'Join the newsroom',
                `<p>Hi ${body.name},</p><p>You have been invited to write and edit for Explainer as <strong>${role.replace(/_/g, ' ')}</strong>. Choose a password to activate your account.</p>`,
                { label: 'Accept invitation', url },
            ),
            text: `Accept your Explainer invitation: ${url}`,
        });

        return c.json({ success: true, invite: serializeRow(invite as unknown as Record<string, unknown>) }, 201);
    },
);

adminUsers.patch('/:id/status', requireRole('superadmin'), zValidator('json', statusInput), async (c) => {
    const profile = await findProfile(c.req.param('id'));
    if (!profile) throw new HTTPException(404, { message: 'Profile not found' });
    if (profile.userId === c.get('user')?.id) {
        throw new HTTPException(400, { message: 'You cannot change your own status' });
    }

    const { status } = c.req.valid('json');
    const [updated] = await db
        .update(profiles)
        .set({ status, updatedAt: new Date() })
        .where(eq(profiles.id, profile.id))
        .returning();

    await db
        .update(user)
        .set({
            banned: status === 'suspended',
            banReason: status === 'suspended' ? 'Suspended by a newsroom administrator' : null,
        })
        .where(eq(user.id, profile.userId));

    if (status === 'suspended') {
        await db.delete(session).where(eq(session.userId, profile.userId));
    }

    return c.json(serializeRow(updated as unknown as Record<string, unknown>));
});

adminUsers.patch('/:id/role', requireRole('superadmin'), zValidator('json', roleInput), async (c) => {
    const profile = await findProfile(c.req.param('id'));
    if (!profile) throw new HTTPException(404, { message: 'Profile not found' });

    const { role } = c.req.valid('json');
    const [updated] = await db
        .update(profiles)
        .set({ role, updatedAt: new Date() })
        .where(eq(profiles.id, profile.id))
        .returning();
    await db.update(user).set({ role }).where(eq(user.id, profile.userId));

    return c.json(serializeRow(updated as unknown as Record<string, unknown>));
});

adminUsers.delete('/invites/:id', requireRole('superadmin'), async (c) => {
    const [deleted] = await db
        .delete(invites)
        .where(eq(invites.id, c.req.param('id')))
        .returning({ id: invites.id });

    if (!deleted) throw new HTTPException(404, { message: 'Invitation not found' });
    return c.json({ success: true, id: deleted.id });
});

adminUsers.delete('/:id', requireRole('superadmin'), async (c) => {
    const profile = await findProfile(c.req.param('id'));
    if (!profile) throw new HTTPException(404, { message: 'Profile not found' });
    if (profile.userId === c.get('user')?.id) {
        throw new HTTPException(400, { message: 'You cannot delete your own account' });
    }

    await db.delete(user).where(eq(user.id, profile.userId));
    return c.json({ success: true, id: profile.id });
});

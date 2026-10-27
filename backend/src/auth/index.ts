import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin, bearer } from 'better-auth/plugins';
import { createAccessControl } from 'better-auth/plugins/access';
import { db } from '../db/index.js';
import * as schema from '../db/schema.js';
import { env, trustedOrigins } from '../env.js';
import { emailShell, sendEmail } from '../lib/email.js';

const statement = {
    story: ['create', 'read', 'update', 'delete', 'publish'],
    category: ['create', 'read', 'update', 'delete'],
    author: ['create', 'read', 'update', 'delete'],
    media: ['create', 'read', 'update', 'delete'],
    user: ['create', 'read', 'update', 'delete'],
    settings: ['read', 'update'],
    analytics: ['read'],
    campaign: ['create', 'read', 'send'],
} as const;

const ac = createAccessControl(statement);

const editorialRoles = {
    superadmin: ac.newRole({
        story: ['create', 'read', 'update', 'delete', 'publish'],
        category: ['create', 'read', 'update', 'delete'],
        author: ['create', 'read', 'update', 'delete'],
        media: ['create', 'read', 'update', 'delete'],
        user: ['create', 'read', 'update', 'delete'],
        settings: ['read', 'update'],
        analytics: ['read'],
        campaign: ['create', 'read', 'send'],
    }),
    editor: ac.newRole({
        story: ['create', 'read', 'update', 'delete', 'publish'],
        category: ['create', 'read', 'update', 'delete'],
        author: ['create', 'read', 'update', 'delete'],
        media: ['create', 'read', 'update', 'delete'],
        settings: ['read'],
        analytics: ['read'],
        campaign: ['create', 'read', 'send'],
    }),
    staff_writer: ac.newRole({
        story: ['create', 'read', 'update'],
        category: ['read'],
        author: ['read'],
        media: ['create', 'read'],
        analytics: ['read'],
    }),
};

export const auth = betterAuth({
    appName: 'Explainer',
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins,
    database: drizzleAdapter(db, {
        provider: 'pg',
        schema: {
            user: schema.user,
            session: schema.session,
            account: schema.account,
            verification: schema.verification,
        },
    }),
    emailAndPassword: {
        enabled: true,
        minPasswordLength: 8,
        sendResetPassword: async ({ user, token }) => {
            const url = `${env.FRONTEND_URL}/admin/login?resetToken=${encodeURIComponent(token)}`;
            await sendEmail({
                to: user.email,
                subject: 'Reset your Explainer password',
                html: emailShell(
                    'Reset your password',
                    `<p>Hi ${user.name || 'there'},</p><p>Use the button below to choose a new password. The link expires in one hour.</p>`,
                    { label: 'Reset password', url },
                ),
                text: `Reset your Explainer password: ${url}`,
            });
        },
    },
    session: {
        expiresIn: 60 * 60 * 24 * 7,
        updateAge: 60 * 60 * 24,
    },
    plugins: [
        admin({
            defaultRole: 'staff_writer',
            adminRoles: ['superadmin'],
            ac,
            roles: editorialRoles,
        }),
        bearer(),
    ],
});

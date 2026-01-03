import { account, teams, databases, DB_ID, COLLECTIONS } from './appwrite';
import { Query } from 'appwrite';

export const ROLES = {
    ADMIN: 'superadmin',
    EDITOR: 'editor',
    WRITER: 'staff_writer'
};

const TEAM_ID = import.meta.env.PUBLIC_APPWRITE_TEAM_ID;

// This now returns a PROMISE to be used in useEffects
export const fetchSyncUser = async () => {
    if (typeof window === 'undefined') return null;

    try {
        const user = await account.get();

        // 1. Fetch user's teams to verify membership
        const userTeams = await teams.list();
        const editorialTeam = userTeams.teams.find(t => t.$id === TEAM_ID);

        if (!editorialTeam) {
            console.warn("User is not a member of the editorial team.");
            localStorage.removeItem('explainer_admin_user');
            try { await account.deleteSession('current'); } catch (e) { }
            return null;
        }

        // 1.B Fetch Membership Roles for the current user
        let userRoles = [];
        try {
            const memberships = await teams.listMemberships(TEAM_ID);
            const myMembership = memberships.memberships.find(m => m.userId === user.$id);
            userRoles = myMembership?.roles || [];
        } catch (e) {
            console.error("Membership fetch error:", e);
        }

        // 2. Fetch User Profile from the 'profiles' collection (Step 5: Security check)
        // We query by userId to ensure they are active in our database
        let profile = null;
        try {
            const profileRes = await databases.listDocuments(DB_ID, 'profiles', [
                Query.equal('userId', user.$id)
            ]);
            profile = profileRes.documents[0];
        } catch (e) {
            console.error("Profile fetch error:", e);
        }

        // 3. ENFORCE KILL SWITCH (Step 5: Ghost Admin Protection)
        if (profile && profile.status === 'suspended') {
            console.error("CRITICAL: User is suspended.");
            localStorage.removeItem('explainer_admin_user');
            try { await account.deleteSession('current'); } catch (e) { }
            window.location.href = '/admin/login?error=suspended';
            return null;
        }

        // Map roles: Priority 1: Profile Role, Priority 2: Membership Role Labels
        let internalRole = profile?.role || (
            userRoles.includes('admin') ? 'superadmin' :
                userRoles.includes('editor') ? 'editor' : 'staff_writer'
        );

        // 4. SELF-HEALING: If no profile exists, create one!
        if (!profile) {
            try {
                await databases.createDocument(DB_ID, 'profiles', 'unique()', {
                    userId: user.$id,
                    email: user.email,
                    name: user.name || user.email.split('@')[0],
                    role: internalRole,
                    status: 'active'
                });
                console.log("Self-healed: Profile created for", user.email);
            } catch (e) {
                console.warn("Profile self-healing failed:", e.message);
            }
        }

        // 5. AUTHOR SYNC: Ensure every staff member has an Author record for article credits
        try {
            const authorRes = await databases.listDocuments(DB_ID, 'authors', [
                Query.equal('email', user.email)
            ]);

            if (authorRes.total === 0) {
                const authorName = user.name || user.email.split('@')[0];
                await databases.createDocument(DB_ID, 'authors', 'unique()', {
                    name: authorName,
                    email: user.email,
                    role: internalRole.replace('_', ' ').toUpperCase(),
                    slug: authorName.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''),
                    bio: `Editorial team member at EXPLAINER.`
                });
                console.log("Author record auto-created for", user.email);
            }
        } catch (authErr) {
            console.warn("Author sync failed:", authErr.message);
        }

        const sessionUser = {
            id: user.$id,
            name: user.name || user.email.split('@')[0],
            role: internalRole,
            email: user.email,
            status: profile?.status || 'active',
            categories: user.prefs?.categories || []
        };

        localStorage.setItem('explainer_admin_user', JSON.stringify(sessionUser));
        return sessionUser;
    } catch (e) {
        localStorage.removeItem('explainer_admin_user');
        return null;
    }
};

// Periodic Security Pulse (Step 5: Active Ghost Admin Protection)
if (typeof window !== 'undefined') {
    setInterval(async () => {
        const user = getCurrentUser();
        if (user) {
            try {
                // Fetch JUST the profile status to be lightweight
                const profileRes = await databases.listDocuments(DB_ID, 'profiles', [
                    Query.equal('userId', user.id),
                    Query.select(['status'])
                ]);
                const profile = profileRes.documents[0];
                if (profile && profile.status === 'suspended') {
                    console.error("Security Pulse: User suspended. Revoking access.");
                    localStorage.removeItem('explainer_admin_user');
                    try { await account.deleteSession('current'); } catch (e) { }
                    window.location.href = '/admin/login?error=suspended';
                }
            } catch (e) {
                // If network fails, don't kick them out immediately, just wait for next pulse
            }
        }
    }, 60000 * 5); // Every 5 minutes
}

export const loginWithEmail = async (email, password) => {
    try {
        // Attempt to clear any existing "orphan" session before creating a new one
        // This prevents the "Creation of a session is prohibited when a session is active" error
        try {
            await account.deleteSession('current');
        } catch (e) {
            // No active session, ignore
        }

        await account.createEmailPasswordSession(email, password);
        return await fetchSyncUser();
    } catch (error) {
        console.error("Login error:", error);
        throw error;
    }
};

export const acceptInvite = async (teamId, membershipId, userId, secret) => {
    try {
        await teams.updateMembershipStatus(teamId, membershipId, userId, secret);
        return true;
    } catch (error) {
        console.error("Invite acceptance error:", error);
        throw error;
    }
};

export const requestPasswordReset = async (email) => {
    try {
        const url = `${window.location.origin}/admin/login`;
        return await account.createRecovery(email, url);
    } catch (error) {
        console.error("Password reset request error:", error);
        throw error;
    }
};

export const completePasswordReset = async (userId, secret, password) => {
    try {
        return await account.updateRecovery(userId, secret, password);
    } catch (error) {
        console.error("Password reset completion error:", error);
        throw error;
    }
};

export const getCurrentUser = () => {
    if (typeof window === 'undefined') return null;
    const saved = localStorage.getItem('explainer_admin_user');
    return saved ? JSON.parse(saved) : null;
};

export const logout = async () => {
    if (typeof window === 'undefined') return;
    try {
        await account.deleteSession('current');
    } catch (e) { }
    localStorage.removeItem('explainer_admin_user');
    window.location.href = '/admin/login';
};

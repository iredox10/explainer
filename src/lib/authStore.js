import {
    apiFetch,
    clearAuthToken,
    getAuthToken,
    setAuthToken,
} from './api';

export const ROLES = {
    ADMIN: 'superadmin',
    EDITOR: 'editor',
    WRITER: 'staff_writer',
};

const USER_KEY = 'explainer_admin_user';
const SUSPENSION_POLL_MS = 5 * 60 * 1000;

function storeUser(user) {
    if (typeof window === 'undefined') return;
    if (user) window.localStorage.setItem(USER_KEY, JSON.stringify(user));
    else window.localStorage.removeItem(USER_KEY);
}

function forceSignOut(redirectTo = '/admin/login?error=suspended') {
    clearAuthToken();
    storeUser(null);
    if (typeof window !== 'undefined') window.location.href = redirectTo;
}

export const fetchSyncUser = async () => {
    if (typeof window === 'undefined') return null;
    if (!getAuthToken()) {
        storeUser(null);
        return null;
    }

    try {
        const payload = await apiFetch('/api/auth/me');
        const user = payload?.user;
        if (!user) {
            clearAuthToken();
            storeUser(null);
            return null;
        }

        const sessionUser = {
            id: user.id,
            name: user.name,
            role: user.role,
            email: user.email,
            status: user.status,
            categories: user.categories || [],
        };

        if (sessionUser.status === 'suspended') {
            forceSignOut();
            return null;
        }

        storeUser(sessionUser);
        return sessionUser;
    } catch (error) {
        if (error.status === 401 || error.status === 403) {
            clearAuthToken();
            storeUser(null);
        }
        return null;
    }
};

if (typeof window !== 'undefined') {
    setInterval(async () => {
        if (!getCurrentUser() || !getAuthToken()) return;
        try {
            const payload = await apiFetch('/api/auth/me');
            if (payload?.user?.status === 'suspended') {
                forceSignOut();
            }
        } catch (error) {
            if (error.status === 401 || error.status === 403) {
                forceSignOut('/admin/login');
            }
        }
    }, SUSPENSION_POLL_MS);
}

export const loginWithEmail = async (email, password) => {
    try {
        const { data, response } = await apiFetch('/api/auth/sign-in/email', {
            method: 'POST',
            auth: false,
            body: { email, password },
            returnResponse: true,
        });

        const token = response.headers.get('set-auth-token') || data?.token;
        if (!token) {
            throw new Error('Authentication succeeded but no session token was returned.');
        }

        setAuthToken(token);
        return await fetchSyncUser();
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
};

export const acceptInvite = async (token, password, name) => {
    try {
        return await apiFetch('/api/auth/accept-invite', {
            method: 'POST',
            auth: false,
            body: { token, password, name },
        });
    } catch (error) {
        console.error('Invite acceptance error:', error);
        throw error;
    }
};

export const requestPasswordReset = async (email) => {
    try {
        return await apiFetch('/api/auth/request-password-reset', {
            method: 'POST',
            auth: false,
            body: {
                email,
                redirectTo: `${window.location.origin}/admin/login`,
            },
        });
    } catch (error) {
        console.error('Password reset request error:', error);
        throw error;
    }
};

export const completePasswordReset = async (token, newPassword) => {
    try {
        const result = await apiFetch('/api/auth/reset-password', {
            method: 'POST',
            auth: false,
            body: { token, newPassword },
        });
        clearAuthToken();
        storeUser(null);
        return result;
    } catch (error) {
        console.error('Password reset completion error:', error);
        throw error;
    }
};

export const getCurrentUser = () => {
    if (typeof window === 'undefined') return null;
    const saved = window.localStorage.getItem(USER_KEY);
    return saved ? JSON.parse(saved) : null;
};

export const logout = async () => {
    if (typeof window === 'undefined') return;
    try {
        await apiFetch('/api/auth/sign-out', { method: 'POST', body: {} });
    } catch (error) {
        // The local session is cleared regardless of the network result.
    }
    clearAuthToken();
    storeUser(null);
    window.location.href = '/admin/login';
};

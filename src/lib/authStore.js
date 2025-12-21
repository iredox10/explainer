import { account } from './appwrite';

export const ROLES = {
    ADMIN: 'Super Admin',
    EDITOR: 'Editor',
    CONTRIBUTOR: 'Contributor'
};

// This now returns a PROMISE to be used in useEffects
export const fetchSyncUser = async () => {
    if (typeof window === 'undefined') return null;
    
    try {
        const user = await account.get();
        // Construct user object with role and categories from Appwrite Preferences
        const sessionUser = {
            id: user.$id,
            name: user.name || user.email.split('@')[0],
            role: user.prefs.role || ROLES.CONTRIBUTOR,
            email: user.email,
            categories: user.prefs.categories || []
        };
        localStorage.setItem('vox_admin_user', JSON.stringify(sessionUser));
        return sessionUser;
    } catch (e) {
        localStorage.removeItem('vox_admin_user');
        return null;
    }
};

export const getCurrentUser = () => {
    if (typeof window === 'undefined') return null;
    const saved = localStorage.getItem('vox_admin_user');
    return saved ? JSON.parse(saved) : null;
};

export const logout = async () => {
    if (typeof window === 'undefined') return;
    try {
        await account.deleteSession('current');
    } catch (e) {}
    localStorage.removeItem('vox_admin_user');
    window.location.href = '/admin/login';
};

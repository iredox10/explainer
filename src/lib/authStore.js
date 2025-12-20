// Simple utility to simulate auth state across the admin panel
export const getCurrentUser = () => {
    if (typeof window === 'undefined') return null;
    
    const saved = localStorage.getItem('vox_admin_user');
    return saved ? JSON.parse(saved) : null;
};

export const setCurrentUser = (user) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('vox_admin_user', JSON.stringify(user));
    window.dispatchEvent(new Event('storage'));
};

export const logout = () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('vox_admin_user');
    window.location.href = '/admin/login';
};

export const ROLES = {
    ADMIN: 'Super Admin',
    EDITOR: 'Editor',
    CONTRIBUTOR: 'Contributor'
};
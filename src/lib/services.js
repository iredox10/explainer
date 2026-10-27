import { apiFetch, mediaUrl, unwrapDocuments, withQuery } from './api';
export { analyticsService, useAnalytics } from './analytics';
export { mediaService, useImageOptimizer } from './media';
export { emailService, emailTemplates } from './email';
export { commentService, assignmentService, notificationService, activityService, activityTypes } from './collaboration';
export { seoService, useSeoChecklist } from './seo';

const PAGE_SIZE = 200;

function assertActiveUser() {
    const currentUser = JSON.parse(localStorage.getItem('explainer_admin_user') || '{}');
    if (currentUser.status === 'suspended') {
        throw new Error('Access Revoked: Your account is suspended and cannot perform this action.');
    }
}

async function fetchAll(path, params = {}) {
    const documents = [];
    let offset = 0;
    let total = Infinity;

    while (offset < total) {
        const payload = await apiFetch(withQuery(path, { ...params, limit: PAGE_SIZE, offset }));
        const page = unwrapDocuments(payload);
        documents.push(...page);
        total = Number(payload?.total ?? documents.length);
        if (page.length === 0) break;
        offset += page.length;
    }

    return documents;
}

function sanitizeStory(data) {
    const sanitized = { ...data };
    if (!sanitized.heroImage) delete sanitized.heroImage;
    if (!sanitized.videoUrl) delete sanitized.videoUrl;
    return sanitized;
}

export const storyService = {
    async uploadImage(file) {
        const form = new FormData();
        form.append('file', file);
        const payload = await apiFetch('/api/admin/media', { method: 'POST', body: form });
        return mediaUrl(payload.url);
    },

    async getAllStories() {
        try {
            return await fetchAll('/api/admin/stories', { sort: '-createdAt' });
        } catch (error) {
            console.error('Error fetching all stories:', error);
            return [];
        }
    },

    async getPublishedStories() {
        try {
            const payload = await apiFetch(withQuery('/api/stories', { limit: PAGE_SIZE, sort: '-publishedAt' }), { auth: false });
            return unwrapDocuments(payload);
        } catch (error) {
            console.error('Error fetching published stories:', error);
            return [];
        }
    },

    async getStoryBySlug(slug) {
        try {
            return await apiFetch(`/api/stories/${encodeURIComponent(slug)}`, { auth: false });
        } catch (error) {
            if (error.status !== 404) console.error('Error fetching story by slug:', error);
            return null;
        }
    },

    async getStoryById(id) {
        try {
            return await apiFetch(`/api/admin/stories/${encodeURIComponent(id)}`);
        } catch (error) {
            if (error.status !== 404) console.error('Error fetching story:', error);
            return null;
        }
    },

    async saveStory(id, data) {
        assertActiveUser();

        try {
            const finalData = sanitizeStory(data);
            if (id === 'new-story' || !id) {
                return await apiFetch('/api/admin/stories', { method: 'POST', body: finalData });
            }
            return await apiFetch(`/api/admin/stories/${encodeURIComponent(id)}`, { method: 'PATCH', body: finalData });
        } catch (error) {
            console.error('Error saving story:', error);
            throw error;
        }
    },

    async deleteStory(id) {
        assertActiveUser();

        try {
            await apiFetch(`/api/admin/stories/${encodeURIComponent(id)}`, { method: 'DELETE' });
            return true;
        } catch (error) {
            console.error('Error deleting story:', error);
            return false;
        }
    },

    async searchAllStories(queryText) {
        try {
            const payload = await apiFetch(withQuery('/api/admin/stories', { q: queryText, limit: 10 }));
            return unwrapDocuments(payload);
        } catch (error) {
            console.error('Error searching all stories:', error);
            return [];
        }
    },

    async searchStories(queryText) {
        try {
            const payload = await apiFetch(withQuery('/api/stories', { q: queryText, limit: 5 }), { auth: false });
            return unwrapDocuments(payload);
        } catch (error) {
            console.error('Error searching stories:', error);
            return [];
        }
    },

    calculateReadTime(content) {
        try {
            const blocks = typeof content === 'string' ? JSON.parse(content) : content;
            if (!Array.isArray(blocks)) return 1;
            const text = blocks.map((block) => block.text || '').join(' ');
            const wordsPerMinute = 225;
            const words = text.trim().split(/\s+/).filter(Boolean).length;
            return Math.ceil(words / wordsPerMinute) || 1;
        } catch (error) {
            return 1;
        }
    },
};

export const categoryService = {
    async getCategoriesCount() {
        try {
            const payload = await apiFetch('/api/categories', { auth: false });
            return Number(payload?.total ?? unwrapDocuments(payload).length);
        } catch (error) {
            console.error('Error fetching category count:', error);
            return 0;
        }
    },

    async getCategories() {
        try {
            const payload = await apiFetch('/api/categories', { auth: false });
            return unwrapDocuments(payload);
        } catch (error) {
            console.error('Error fetching categories:', error);
            return [];
        }
    },

    async saveCategory(id, data) {
        try {
            if (!id) {
                return await apiFetch('/api/admin/categories', { method: 'POST', body: data });
            }
            return await apiFetch(`/api/admin/categories/${encodeURIComponent(id)}`, { method: 'PATCH', body: data });
        } catch (error) {
            console.error('Error saving category:', error);
            throw error;
        }
    },

    async deleteCategory(id) {
        try {
            await apiFetch(`/api/admin/categories/${encodeURIComponent(id)}`, { method: 'DELETE' });
            return true;
        } catch (error) {
            console.error('Error deleting category:', error);
            return false;
        }
    },
};

export const authorService = {
    async getAuthorsCount() {
        try {
            const payload = await apiFetch('/api/authors', { auth: false });
            return Number(payload?.total ?? unwrapDocuments(payload).length);
        } catch (error) {
            console.error('Error fetching author count:', error);
            return 0;
        }
    },

    async getAuthors() {
        try {
            const payload = await apiFetch('/api/authors', { auth: false });
            return unwrapDocuments(payload);
        } catch (error) {
            console.error('Error fetching authors:', error);
            return [];
        }
    },

    async saveAuthor(id, data) {
        try {
            const sanitizedData = { ...data };
            if (!sanitizedData.imageUrl) delete sanitizedData.imageUrl;

            if (!id) {
                return await apiFetch('/api/admin/authors', { method: 'POST', body: sanitizedData });
            }
            return await apiFetch(`/api/admin/authors/${encodeURIComponent(id)}`, { method: 'PATCH', body: sanitizedData });
        } catch (error) {
            console.error('Error saving author:', error);
            throw error;
        }
    },

    async deleteAuthor(id) {
        try {
            await apiFetch(`/api/admin/authors/${encodeURIComponent(id)}`, { method: 'DELETE' });
            return true;
        } catch (error) {
            console.error('Error deleting author:', error);
            return false;
        }
    },
};

export const teamService = {
    async getTeamMembers() {
        try {
            const payload = await apiFetch('/api/admin/users/team');
            return payload?.memberships ?? [];
        } catch (error) {
            console.error('Error fetching team members:', error);
            return [];
        }
    },

    async inviteMember(email, name, role, categories = []) {
        try {
            return await apiFetch('/api/admin/users/invite', {
                method: 'POST',
                body: { email, name, role, categories },
            });
        } catch (error) {
            console.error('Error inviting member:', error);
            throw error;
        }
    },

    async removeMember(membershipId) {
        try {
            try {
                await apiFetch(`/api/admin/users/${encodeURIComponent(membershipId)}`, { method: 'DELETE' });
            } catch (error) {
                if (error.status !== 404) throw error;
                await apiFetch(`/api/admin/users/invites/${encodeURIComponent(membershipId)}`, { method: 'DELETE' });
            }
            return true;
        } catch (error) {
            console.error('Error removing member:', error);
            return false;
        }
    },
};

export const adminService = {
    async getProfiles() {
        try {
            return await fetchAll('/api/admin/users');
        } catch (error) {
            console.error('Error fetching profiles:', error);
            return [];
        }
    },

    async updateProfileStatus(id, status) {
        try {
            return await apiFetch(`/api/admin/users/${encodeURIComponent(id)}/status`, {
                method: 'PATCH',
                body: { status },
            });
        } catch (error) {
            console.error('Error updating profile status:', error);
            throw error;
        }
    },

    async getSettings() {
        try {
            return await apiFetch('/api/admin/settings');
        } catch (error) {
            console.error('Error fetching config:', error);
            return null;
        }
    },

    async updateSettings(id, data) {
        try {
            return await apiFetch('/api/admin/settings', { method: 'PATCH', body: data });
        } catch (error) {
            console.error('Error updating config:', error);
            throw error;
        }
    },
};

export const logService = {
    async getSystemLogs() {
        try {
            const payload = await apiFetch('/api/admin/logs?limit=100');
            return payload?.logs ?? [];
        } catch (error) {
            console.error('Error fetching system logs:', error);
            return [];
        }
    },
};

export const newsletterService = {
    async getSubscribers(limit = 500) {
        try {
            const payload = await apiFetch(withQuery('/api/admin/subscribers', { limit }));
            return {
                documents: unwrapDocuments(payload),
                total: Number(payload?.total ?? 0),
            };
        } catch (error) {
            console.error('Error fetching subscribers:', error);
            return { documents: [], total: 0 };
        }
    },

    async deleteSubscriber(id) {
        try {
            await apiFetch(`/api/admin/subscribers/${encodeURIComponent(id)}`, { method: 'DELETE' });
            return true;
        } catch (error) {
            console.error('Error deleting subscriber:', error);
            return false;
        }
    },

    async getSubscribersCount() {
        try {
            const payload = await apiFetch('/api/admin/subscribers?limit=1');
            return Number(payload?.total ?? 0);
        } catch (error) {
            console.error('Error fetching subscriber count:', error);
            return 0;
        }
    },

    async subscribe(email) {
        try {
            return await apiFetch('/api/subscribers', {
                method: 'POST',
                auth: false,
                body: { email },
            });
        } catch (error) {
            console.error('Newsletter subscription error:', error);
            throw error;
        }
    },
};

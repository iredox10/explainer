// Server-side Appwrite client using API key for authenticated operations
import { Client, Databases, Query, Users, Teams, ID } from 'node-appwrite';

// DEFENSIVE: Retrieve environment variables with fallbacks
const ENDPOINT = import.meta.env.PUBLIC_APPWRITE_ENDPOINT || process.env.PUBLIC_APPWRITE_ENDPOINT;
const PROJECT_ID = import.meta.env.PUBLIC_APPWRITE_PROJECT_ID || process.env.PUBLIC_APPWRITE_PROJECT_ID;
const API_KEY = import.meta.env.APPWRITE_API_KEY || process.env.APPWRITE_API_KEY;
const DB_ID = import.meta.env.PUBLIC_APPWRITE_DATABASE_ID || process.env.PUBLIC_APPWRITE_DATABASE_ID || 'vox_cms';

// Module-level client initialization
let client;
let serverDatabases;
let serverUsers;
let serverTeams;

try {
    if (ENDPOINT && PROJECT_ID && API_KEY) {
        client = new Client()
            .setEndpoint(ENDPOINT)
            .setProject(PROJECT_ID)
            .setKey(API_KEY);
        serverDatabases = new Databases(client);
        serverUsers = new Users(client);
        serverTeams = new Teams(client);
    } else {
        const missing = [];
        if (!ENDPOINT) missing.push('ENDPOINT');
        if (!PROJECT_ID) missing.push('PROJECT_ID');
        if (!API_KEY) missing.push('API_KEY');
        console.warn(`[SERVER-APPWRITE] Incomplete configuration (${missing.join(', ')}). Check your environment variables.`);
    }
} catch (e) {
    console.error('[SERVER-APPWRITE] Fatal initialization error:', e.message);
}

export const COLLECTIONS = {
    STORIES: 'stories',
    AUTHORS: 'authors',
    CATEGORIES: 'categories',
    PROFILES: 'profiles',
    CONFIGS: 'configs'
};

export const serverAuthService = {
    async onboardInvitedUser(userId, teamId, membershipId, secret, password) {
        if (!serverTeams || !serverUsers || !serverDatabases) throw new Error('Appwrite services not initialized');
        
        try {
            // 1. Accept the membership
            await serverTeams.updateMembershipStatus(teamId, membershipId, userId, secret);
            
            // 2. Fetch membership to get assigned roles (sections)
            const membership = await serverTeams.getMembership(teamId, membershipId);
            const assignedCategorySlugs = membership.roles
                .filter(r => r.startsWith('s_'))
                .map(r => r.replace('s_', ''));

            const baseRole = membership.roles.find(r => !r.startsWith('s_')) || 'staff_writer';

            // Resolve slugs to names for internal filtering
            let assignedCategoryNames = [];
            if (assignedCategorySlugs.length > 0) {
                try {
                    const catRes = await serverDatabases.listDocuments(DB_ID, COLLECTIONS.CATEGORIES, [
                        Query.equal('slug', assignedCategorySlugs)
                    ]);
                    assignedCategoryNames = catRes.documents.map(c => c.name);
                } catch (catErr) {
                    console.warn('Failed to resolve category names during onboarding:', catErr.message);
                    // Fallback to capitalized slugs if lookup fails
                    assignedCategoryNames = assignedCategorySlugs.map(s => s.charAt(0).toUpperCase() + s.slice(1));
                }
            }

            // 3. Update the password
            await serverUsers.updatePassword(userId, password);
            
            // 4. Update user preferences with assigned category names
            await serverUsers.updatePrefs(userId, {
                categories: assignedCategoryNames
            });

            // 5. Get user details
            const user = await serverUsers.get(userId);

            // 6. Create or update profile document
            try {
                const profileRes = await serverDatabases.listDocuments(DB_ID, COLLECTIONS.PROFILES, [
                    Query.equal('userId', userId)
                ]);

                const profileData = {
                    userId: userId,
                    email: user.email,
                    name: user.name || user.email.split('@')[0],
                    role: baseRole === 'admin' ? 'superadmin' : baseRole,
                    status: 'active',
                    categories: assignedCategoryNames
                };

                if (profileRes.total > 0) {
                    await serverDatabases.updateDocument(DB_ID, COLLECTIONS.PROFILES, profileRes.documents[0].$id, profileData);
                } else {
                    await serverDatabases.createDocument(DB_ID, COLLECTIONS.PROFILES, ID.unique(), profileData);
                }
            } catch (profileErr) {
                console.warn('Profile sync during onboarding failed:', profileErr.message);
            }
            
            return {
                success: true,
                email: user.email
            };
        } catch (error) {
            console.error('Onboarding error:', error);
            throw error;
        }
    }
};


export const serverStoryService = {
    async getStoryById(id) {
        if (!serverDatabases) return null;
        try {
            return await serverDatabases.getDocument(DB_ID, COLLECTIONS.STORIES, id);
        } catch (error) {
            console.error('Server Appwrite error fetching story by ID:', error);
            return null;
        }
    },

    async getStoryBySlug(slug) {
        if (!serverDatabases) return null;
        try {
            const response = await serverDatabases.listDocuments(DB_ID, COLLECTIONS.STORIES, [
                Query.equal('slug', slug),
                Query.limit(1)
            ]);
            return response.documents[0] || null;
        } catch (error) {
            console.error('Server Appwrite error fetching story by slug:', error);
            return null;
        }
    },

    async getPublishedStories() {
        if (!serverDatabases) return [];
        try {
            const response = await serverDatabases.listDocuments(DB_ID, COLLECTIONS.STORIES, [
                Query.equal('status', 'Published'),
                Query.orderDesc('publishedAt')
            ]);
            return response.documents;
        } catch (error) {
            console.error('Server Appwrite error fetching published stories:', error);
            return [];
        }
    },

    async getAllStories() {
        if (!serverDatabases) return [];
        try {
            const response = await serverDatabases.listDocuments(DB_ID, COLLECTIONS.STORIES, [
                Query.orderDesc('$createdAt')
            ]);
            return response.documents;
        } catch (error) {
            console.error('Server Appwrite error fetching all stories:', error);
            return [];
        }
    },

    calculateReadTime(content) {
        try {
            const blocks = typeof content === 'string' ? JSON.parse(content) : content;
            const text = blocks.map(b => b.text || '').join(' ');
            const wordsPerMinute = 225;
            const words = text.trim().split(/\s+/).length;
            const minutes = Math.ceil(words / wordsPerMinute);
            return minutes || 1;
        } catch (e) {
            return 1;
        }
    }
};

// In-memory cache for system settings to prevent middleware timeouts
let _settingsCache = null;
let _lastFetchTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const serverAdminService = {
    async getSettings() {
        if (!serverDatabases) return _settingsCache;

        const now = Date.now();
        // Return cached version if still valid
        if (_settingsCache && (now - _lastFetchTime < CACHE_TTL)) {
            return _settingsCache;
        }

        try {
            const response = await serverDatabases.listDocuments(DB_ID, COLLECTIONS.CONFIGS, [Query.limit(1)]);
            const settings = response.documents[0] || null;

            if (settings) {
                _settingsCache = settings;
                _lastFetchTime = now;
            }

            return settings;
        } catch (error) {
            console.error('Server Appwrite error fetching settings:', error.message);

            // GRACEFUL FALLBACK: 
            // 1. If we have an expired cache, use it anyway (better than failing)
            if (_settingsCache) {
                console.warn('[SERVER-APPWRITE] Using expired settings cache due to fetch failure');
                return _settingsCache;
            }

            // 2. Return safe defaults if fetch fails and no cache exists
            return { maintenance_mode: false };
        }
    }
};

export const serverCategoryService = {
    async getCategories() {
        if (!serverDatabases) return [];
        try {
            const response = await serverDatabases.listDocuments(DB_ID, COLLECTIONS.CATEGORIES);
            return response.documents;
        } catch (error) {
            console.error('Server Appwrite error fetching categories:', error);
            return [];
        }
    },
    async getCategoryBySlug(slug) {
        if (!serverDatabases) return null;
        try {
            const response = await serverDatabases.listDocuments(DB_ID, COLLECTIONS.CATEGORIES, [
                Query.equal('slug', slug),
                Query.limit(1)
            ]);
            return response.documents[0] || null;
        } catch (error) {
            console.error('Server Appwrite error fetching category by slug:', error);
            return null;
        }
    }
};

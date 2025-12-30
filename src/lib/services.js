import { databases, storage, teams, DB_ID, COLLECTIONS, MEDIA_BUCKET_ID } from './appwrite';
import { Query, ID } from 'appwrite';

export const storyService = {
    async uploadImage(file) {
        try {
            const uploadedFile = await storage.createFile(MEDIA_BUCKET_ID, ID.unique(), file);
            const fileUrl = `${import.meta.env.PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${MEDIA_BUCKET_ID}/files/${uploadedFile.$id}/view?project=${import.meta.env.PUBLIC_APPWRITE_PROJECT_ID}`;
            return fileUrl;
        } catch (error) {
            console.error('Appwrite error uploading image:', error);
            throw error;
        }
    },

    async getAllStories() {
        try {
            const response = await databases.listDocuments(DB_ID, COLLECTIONS.STORIES, [
                Query.orderDesc('$createdAt')
            ]);
            return response.documents;
        } catch (error) {
            console.error('Appwrite error fetching all stories:', error);
            return [];
        }
    },

    async getPublishedStories() {
        try {
            const response = await databases.listDocuments(DB_ID, COLLECTIONS.STORIES, [
                Query.equal('status', 'Published'),
                Query.orderDesc('publishedAt')
            ]);
            return response.documents;
        } catch (error) {
            console.error('Appwrite error fetching published stories:', error);
            return [];
        }
    },

    async getStoryBySlug(slug) {
        try {
            const response = await databases.listDocuments(DB_ID, COLLECTIONS.STORIES, [
                Query.equal('slug', slug),
                Query.limit(1)
            ]);
            return response.documents[0] || null;
        } catch (error) {
            console.error('Appwrite error fetching story by slug:', error);
            return null;
        }
    },

    async getStoryById(id) {
        try {
            return await databases.getDocument(DB_ID, COLLECTIONS.STORIES, id);
        } catch (error) {
            console.error('Appwrite error fetching story:', error);
            return null;
        }
    },

    async saveStory(id, data) {
        try {
            // Sanitize data: remove empty strings for URL/Email fields as they cause validation errors
            const sanitizedData = { ...data };
            if (!sanitizedData.heroImage) delete sanitizedData.heroImage;
            if (!sanitizedData.videoUrl) delete sanitizedData.videoUrl;

            const slug = sanitizedData.slug || (sanitizedData.headline ? sanitizedData.headline.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') : ID.unique());

            const finalData = {
                ...sanitizedData,
                slug,
                publishedAt: sanitizedData.status === 'Published' && !sanitizedData.publishedAt ? new Date().toISOString() : sanitizedData.publishedAt
            };

            if (id === 'new-story' || !id) {
                return await databases.createDocument(DB_ID, COLLECTIONS.STORIES, ID.unique(), finalData);
            } else {
                return await databases.updateDocument(DB_ID, COLLECTIONS.STORIES, id, finalData);
            }
        } catch (error) {
            console.error('Appwrite error saving story:', error);
            throw error;
        }
    },

    async deleteStory(id) {
        try {
            await databases.deleteDocument(DB_ID, COLLECTIONS.STORIES, id);
            return true;
        } catch (error) {
            console.error('Appwrite error deleting story:', error);
            return false;
        }
    },

    async searchAllStories(queryText) {
        try {
            const response = await databases.listDocuments(DB_ID, COLLECTIONS.STORIES, [
                Query.search('headline', queryText),
                Query.limit(10)
            ]);
            return response.documents;
        } catch (error) {
            console.error('Appwrite error searching all stories:', error);
            return [];
        }
    },
    async searchStories(queryText) {
        try {
            const response = await databases.listDocuments(DB_ID, COLLECTIONS.STORIES, [
                Query.search('headline', queryText),
                Query.equal('status', 'Published'),
                Query.limit(5)
            ]);
            return response.documents;
        } catch (error) {
            console.error('Appwrite error searching stories:', error);
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

export const categoryService = {
    async getCategoriesCount() {
        try {
            const response = await databases.listDocuments(DB_ID, COLLECTIONS.CATEGORIES, [Query.limit(1)]);
            return response.total;
        } catch (error) {
            console.error('Error fetching category count:', error);
            return 0;
        }
    },
    async getCategories() {
        try {
            const response = await databases.listDocuments(DB_ID, COLLECTIONS.CATEGORIES);
            return response.documents;
        } catch (error) {
            console.error('Appwrite error fetching categories:', error);
            return [];
        }
    },
    async saveCategory(id, data) {
        try {
            const finalData = {
                ...data,
                slug: data.slug || data.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '')
            };
            if (!id) {
                return await databases.createDocument(DB_ID, COLLECTIONS.CATEGORIES, ID.unique(), finalData);
            }
            return await databases.updateDocument(DB_ID, COLLECTIONS.CATEGORIES, id, finalData);
        } catch (error) {
            console.error('Appwrite error saving category:', error);
            throw error;
        }
    },
    async deleteCategory(id) {
        try {
            await databases.deleteDocument(DB_ID, COLLECTIONS.CATEGORIES, id);
            return true;
        } catch (error) {
            console.error('Appwrite error deleting category:', error);
            return false;
        }
    }
};

export const authorService = {
    async getAuthorsCount() {
        try {
            const response = await databases.listDocuments(DB_ID, COLLECTIONS.AUTHORS, [Query.limit(1)]);
            return response.total;
        } catch (error) {
            console.error('Error fetching author count:', error);
            return 0;
        }
    },
    async getAuthors() {
        try {
            const response = await databases.listDocuments(DB_ID, COLLECTIONS.AUTHORS);
            return response.documents;
        } catch (error) {
            console.error('Appwrite error fetching authors:', error);
            return [];
        }
    },
    async saveAuthor(id, data) {
        try {
            const sanitizedData = { ...data };
            if (!sanitizedData.imageUrl) delete sanitizedData.imageUrl;

            const finalData = {
                ...sanitizedData,
                slug: sanitizedData.slug || sanitizedData.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '')
            };
            if (!id) {
                return await databases.createDocument(DB_ID, COLLECTIONS.AUTHORS, ID.unique(), finalData);
            }
            return await databases.updateDocument(DB_ID, COLLECTIONS.AUTHORS, id, finalData);
        } catch (error) {
            console.error('Appwrite error saving author:', error);
            throw error;
        }
    },
    async deleteAuthor(id) {
        try {
            await databases.deleteDocument(DB_ID, COLLECTIONS.AUTHORS, id);
            return true;
        } catch (error) {
            console.error('Appwrite error deleting author:', error);
            return false;
        }
    }
};

export const teamService = {
    async getTeamMembers() {
        try {
            const teamId = import.meta.env.PUBLIC_APPWRITE_TEAM_ID;
            const response = await teams.listMemberships(teamId);
            return response.memberships;
        } catch (error) {
            console.error('Appwrite error fetching team members:', error);
            return [];
        }
    },
    async inviteMember(email, name, role) {
        try {
            const teamId = import.meta.env.PUBLIC_APPWRITE_TEAM_ID;
            return await teams.createMembership({
                teamId,
                roles: [role.toLowerCase()],
                url: `${window.location.origin}/admin/login`,
                email,
                name
            });
        } catch (error) {
            console.error('Appwrite error inviting member:', error);
            throw error;
        }
    },
    async removeMember(membershipId) {
        try {
            const teamId = import.meta.env.PUBLIC_APPWRITE_TEAM_ID;
            await teams.deleteMembership(teamId, membershipId);
            return true;
        } catch (error) {
            console.error('Appwrite error removing member:', error);
            return false;
        }
    }
};

export const adminService = {
    async getProfiles() {
        try {
            const response = await databases.listDocuments(DB_ID, COLLECTIONS.PROFILES);
            return response.documents;
        } catch (error) {
            console.error('Error fetching profiles:', error);
            return [];
        }
    },
    async updateProfileStatus(id, status) {
        try {
            return await databases.updateDocument(DB_ID, COLLECTIONS.PROFILES, id, { status });
        } catch (error) {
            console.error('Error updating profile status:', error);
            throw error;
        }
    },
    async getSettings() {
        try {
            const response = await databases.listDocuments(DB_ID, COLLECTIONS.CONFIGS, [Query.limit(1)]);
            return response.documents[0] || null;
        } catch (error) {
            console.error('Error fetching config:', error);
            return null;
        }
    },
    async updateSettings(id, data) {
        try {
            if (!id) return await databases.createDocument(DB_ID, COLLECTIONS.CONFIGS, ID.unique(), data);
            return await databases.updateDocument(DB_ID, COLLECTIONS.CONFIGS, id, data);
        } catch (error) {
            console.error('Error updating config:', error);
            throw error;
        }
    }
};

export const logService = {
    async getSystemLogs() {
        try {
            const { account } = await import('./appwrite');
            const response = await account.listLogs();
            return response.logs;
        } catch (error) {
            console.error('Error fetching system logs:', error);
            return [];
        }
    }
};

export const newsletterService = {
    async getSubscribersCount() {
        try {
            const response = await databases.listDocuments(DB_ID, 'subscribers', [Query.limit(1)]);
            return response.total;
        } catch (error) {
            console.error('Error fetching subscriber count:', error);
            return 0;
        }
    },
    async subscribe(email) {
        try {
            return await databases.createDocument(DB_ID, 'subscribers', ID.unique(), {
                email,
                subscribedAt: new Date().toISOString(),
                status: 'active'
            });
        } catch (error) {
            console.error('Newsletter subscription error:', error);
            throw error;
        }
    }
};
import { databases, storage, DB_ID, COLLECTIONS, MEDIA_BUCKET_ID } from './appwrite';
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

    // Get all stories (filtered by role in component)
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

    // Get published stories for frontend
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
            // Fallback to mock logic if needed or return null
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
            if (id === 'new-story' || !id) {
                return await databases.createDocument(DB_ID, COLLECTIONS.STORIES, ID.unique(), {
                    ...data,
                    publishedAt: data.status === 'Published' ? new Date().toISOString() : null
                });
            } else {
                return await databases.updateDocument(DB_ID, COLLECTIONS.STORIES, id, {
                    ...data,
                    publishedAt: data.status === 'Published' && !data.publishedAt ? new Date().toISOString() : data.publishedAt
                });
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
    }
};

export const categoryService = {
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
            if (!id) {
                return await databases.createDocument(DB_ID, COLLECTIONS.CATEGORIES, ID.unique(), data);
            }
            return await databases.updateDocument(DB_ID, COLLECTIONS.CATEGORIES, id, data);
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
            if (!id) {
                return await databases.createDocument(DB_ID, COLLECTIONS.AUTHORS, ID.unique(), data);
            }
            return await databases.updateDocument(DB_ID, COLLECTIONS.AUTHORS, id, data);
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
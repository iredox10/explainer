// Server-side Appwrite client using API key for authenticated operations
import { Client, Databases, Query, ID } from 'node-appwrite';

const client = new Client()
    .setEndpoint(import.meta.env.PUBLIC_APPWRITE_ENDPOINT)
    .setProject(import.meta.env.PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(import.meta.env.APPWRITE_API_KEY);

export const serverDatabases = new Databases(client);

export const DB_ID = import.meta.env.PUBLIC_APPWRITE_DATABASE_ID || 'vox_cms';
export const COLLECTIONS = {
    STORIES: 'stories',
    AUTHORS: 'authors',
    CATEGORIES: 'categories',
    PROFILES: 'profiles',
    CONFIGS: 'configs'
};

export const serverStoryService = {
    async getStoryById(id) {
        try {
            return await serverDatabases.getDocument(DB_ID, COLLECTIONS.STORIES, id);
        } catch (error) {
            console.error('Server Appwrite error fetching story by ID:', error);
            return null;
        }
    },

    async getStoryBySlug(slug) {
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
        try {
            const response = await serverDatabases.listDocuments(DB_ID, COLLECTIONS.STORIES, [
                Query.orderDesc('$createdAt')
            ]);
            return response.documents;
        } catch (error) {
            console.error('Server Appwrite error fetching all stories:', error);
            return [];
        }
    }
};

export const serverAdminService = {
    async getSettings() {
        try {
            const response = await serverDatabases.listDocuments(DB_ID, COLLECTIONS.CONFIGS, [Query.limit(1)]);
            return response.documents[0] || null;
        } catch (error) {
            console.error('Server Appwrite error fetching settings:', error);
            return null;
        }
    }
};

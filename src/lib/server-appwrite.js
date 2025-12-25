// Server-side Appwrite client using API key for authenticated operations
import { Client, Databases, Query } from 'node-appwrite';

// DEFENSIVE: Retrieve environment variables with fallbacks
const ENDPOINT = import.meta.env.PUBLIC_APPWRITE_ENDPOINT || process.env.PUBLIC_APPWRITE_ENDPOINT;
const PROJECT_ID = import.meta.env.PUBLIC_APPWRITE_PROJECT_ID || process.env.PUBLIC_APPWRITE_PROJECT_ID;
const API_KEY = import.meta.env.APPWRITE_API_KEY || process.env.APPWRITE_API_KEY;
const DB_ID = import.meta.env.PUBLIC_APPWRITE_DATABASE_ID || process.env.PUBLIC_APPWRITE_DATABASE_ID || 'vox_cms';

// Module-level client initialization
let client;
let serverDatabases;

try {
    if (ENDPOINT && PROJECT_ID && API_KEY) {
        client = new Client()
            .setEndpoint(ENDPOINT)
            .setProject(PROJECT_ID)
            .setKey(API_KEY);
        serverDatabases = new Databases(client);
    } else {
        console.warn('[SERVER-APPWRITE] Incomplete configuration. Check your environment variables.');
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
    }
};

export const serverAdminService = {
    async getSettings() {
        if (!serverDatabases) return null;
        try {
            const response = await serverDatabases.listDocuments(DB_ID, COLLECTIONS.CONFIGS, [Query.limit(1)]);
            return response.documents[0] || null;
        } catch (error) {
            console.error('Server Appwrite error fetching settings:', error);
            return null;
        }
    }
};

import { databases, DB_ID, COLLECTIONS } from './appwrite';
import { VOX_HOME_DATA, AUTHORS } from '../data/mock';
import { Query } from 'appwrite';

const IS_APPWRITE_CONFIGURED = !!(DB_ID && import.meta.env.PUBLIC_APPWRITE_PROJECT_ID);

export const storyService = {
    // Get all published stories
    async getPublishedStories() {
        if (!IS_APPWRITE_CONFIGURED) {
            // Fallback to mock data
            return [...VOX_HOME_DATA.latest, ...VOX_HOME_DATA.politics, ...VOX_HOME_DATA.culture];
        }
        try {
            const response = await databases.listDocuments(DB_ID, COLLECTIONS.STORIES, [
                Query.equal('status', 'Published'),
                Query.orderDesc('publishedAt')
            ]);
            return response.documents;
        } catch (error) {
            console.error('Appwrite error fetching stories:', error);
            return VOX_HOME_DATA.latest;
        }
    },

    // Get a single story by slug
    async getStoryBySlug(slug) {
        if (!IS_APPWRITE_CONFIGURED) {
            // Check mock articles
            if (slug === 'giant-wakes') return { ...VOX_HOME_DATA.hero, layout: 'scrolly' };
            return VOX_HOME_DATA.latest.find(s => s.slug === slug);
        }
        try {
            const response = await databases.listDocuments(DB_ID, COLLECTIONS.STORIES, [
                Query.equal('slug', slug),
                Query.limit(1)
            ]);
            return response.documents[0];
        } catch (error) {
            console.error('Appwrite error fetching story:', error);
            return null;
        }
    }
};

export const authorService = {
    async getAuthors() {
        return AUTHORS; // Currently sticking to mock for simple authors
    },
    async getAuthorBySlug(slug) {
        return AUTHORS.find(a => a.slug === slug);
    }
};

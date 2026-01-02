import { Client, Databases, Account, Storage, Teams } from 'appwrite';

const ENDPOINT = import.meta.env.PUBLIC_APPWRITE_ENDPOINT;
const PROJECT_ID = import.meta.env.PUBLIC_APPWRITE_PROJECT_ID;

export const client = new Client();

if (ENDPOINT && PROJECT_ID) {
    client
        .setEndpoint(ENDPOINT)
        .setProject(PROJECT_ID);
} else {
    console.warn('[APPWRITE] Missing configuration. Client not initialized.');
}

export const databases = new Databases(client);
export const account = new Account(client);
export const storage = new Storage(client);
export const teams = new Teams(client);

export const DB_ID = import.meta.env.PUBLIC_APPWRITE_DATABASE_ID;
export const MEDIA_BUCKET_ID = 'media';
export const COLLECTIONS = {
    STORIES: 'stories',
    AUTHORS: 'authors',
    CATEGORIES: 'categories',
    PROFILES: 'profiles',
    CONFIGS: 'configs',
    SUBSCRIBERS: 'subscribers'
};
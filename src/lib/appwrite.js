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

export const DB_ID = import.meta.env.PUBLIC_APPWRITE_DATABASE_ID || 'vox_cms';
export const MEDIA_BUCKET_ID = 'media';
export const COLLECTIONS = {
    STORIES: 'stories',
    AUTHORS: 'authors',
    CATEGORIES: 'categories',
    PROFILES: 'profiles',
    CONFIGS: 'configs',
    SUBSCRIBERS: 'subscribers',
    ANALYTICS: '69931680003c12f94673',
    SCROLL_DEPTH: '6993168600025ad85f2e',
    MEDIA: '69931689000ed9172485',
    COMMENTS: '6993168d003721c2a818',
    ACTIVITY_LOG: '69931692002b481e1f65',
    NOTIFICATIONS: '6993169700368e51c1bb',
    ASSIGNMENTS: '6993169d00183f5e36ea',
    CAMPAIGNS: '699316a700375a018328'
};
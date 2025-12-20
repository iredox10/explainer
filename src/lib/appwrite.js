import { Client, Databases, Account } from 'appwrite';

export const client = new Client();

client
    .setEndpoint(import.meta.env.PUBLIC_APPWRITE_ENDPOINT)
    .setProject(import.meta.env.PUBLIC_APPWRITE_PROJECT_ID);

export const databases = new Databases(client);
export const account = new Account(client);

export const DB_ID = import.meta.env.PUBLIC_APPWRITE_DATABASE_ID;
export const COLLECTIONS = {
    STORIES: 'stories',
    AUTHORS: 'authors',
    CATEGORIES: 'categories'
};

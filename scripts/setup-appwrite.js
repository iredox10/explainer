import { Client, Databases, ID } from 'node-appwrite';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const client = new Client()
    .setEndpoint(process.env.PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

const DB_NAME = 'vox_cms';
const COLLECTIONS = {
    STORIES: 'stories',
    AUTHORS: 'authors',
    CATEGORIES: 'categories'
};

async function setup() {
    console.log('🚀 Starting Appwrite Setup...');

    // 1. Create Database
    let dbId;
    try {
        const db = await databases.create(ID.unique(), DB_NAME);
        dbId = db.$id;
        console.log(`✅ Database created: ${dbId}`);
    } catch (e) {
        // If it might already exist, we'd need a way to find it, but the SDK create throws if ID conflicts. 
        // For simplicity, let's assume we are listing to find it or creating new.
        // Actually, listing databases to find 'vox_cms' is safer if we want idempotency.
        const dbs = await databases.list();
        const existing = dbs.databases.find(d => d.name === DB_NAME);
        if (existing) {
            dbId = existing.$id;
            console.log(`ℹ️ Database '${DB_NAME}' already exists (${dbId})`);
        } else {
            console.error('❌ Failed to create database and it was not found.');
            console.error(e);
            return;
        }
    }

    // 2. Create Collections & Attributes
    await setupStoriesCollection(dbId);
    await setupAuthorsCollection(dbId);
    await setupCategoriesCollection(dbId);

    console.log('🎉 Appwrite Setup Complete!');
    console.log(`
Add this to your .env file:
PUBLIC_APPWRITE_DATABASE_ID=${dbId}`);
}

async function setupStoriesCollection(dbId) {
    let colId;
    try {
        // Check if exists
        const list = await databases.listCollections(dbId);
        const existing = list.collections.find(c => c.name === COLLECTIONS.STORIES);
        
        if (existing) {
            colId = existing.$id;
            console.log(`ℹ️ Collection '${COLLECTIONS.STORIES}' already exists.`);
        } else {
            const col = await databases.createCollection(dbId, ID.unique(), COLLECTIONS.STORIES);
            colId = col.$id;
            console.log(`✅ Collection '${COLLECTIONS.STORIES}' created.`);

            // Define Attributes
            await databases.createStringAttribute(dbId, colId, 'headline', 255, true);
            await databases.createStringAttribute(dbId, colId, 'subhead', 1000, false);
            await databases.createStringAttribute(dbId, colId, 'category', 100, true);
            await databases.createStringAttribute(dbId, colId, 'author', 100, true);
            await databases.createStringAttribute(dbId, colId, 'status', 50, true, 'Draft'); // Draft, Pending Review, Published
            await databases.createUrlAttribute(dbId, colId, 'heroImage', false);
            await databases.createEnumAttribute(dbId, colId, 'layout', ['standard', 'scrolly'], true, 'standard');
            // Content is complex (JSON), so we store as stringified JSON for now
            await databases.createStringAttribute(dbId, colId, 'content', 100000, false); 
            await databases.createStringAttribute(dbId, colId, 'scrollySections', 100000, false);
            await databases.createDatetimeAttribute(dbId, colId, 'publishedAt', false);
            
            console.log(`✅ Attributes for '${COLLECTIONS.STORIES}' created.`);
        }
    } catch (e) {
        console.error(`❌ Error setting up ${COLLECTIONS.STORIES}:`, e);
    }
}

async function setupAuthorsCollection(dbId) {
    let colId;
    try {
        const list = await databases.listCollections(dbId);
        const existing = list.collections.find(c => c.name === COLLECTIONS.AUTHORS);
        
        if (existing) {
            colId = existing.$id;
            console.log(`ℹ️ Collection '${COLLECTIONS.AUTHORS}' already exists.`);
        } else {
            const col = await databases.createCollection(dbId, ID.unique(), COLLECTIONS.AUTHORS);
            colId = col.$id;
            console.log(`✅ Collection '${COLLECTIONS.AUTHORS}' created.`);

            await databases.createStringAttribute(dbId, colId, 'name', 100, true);
            await databases.createStringAttribute(dbId, colId, 'role', 100, false);
            await databases.createEmailAttribute(dbId, colId, 'email', true);
            await databases.createStringAttribute(dbId, colId, 'bio', 1000, false);
            await databases.createStringAttribute(dbId, colId, 'slug', 100, true);
            
            console.log(`✅ Attributes for '${COLLECTIONS.AUTHORS}' created.`);
        }
    } catch (e) {
        console.error(`❌ Error setting up ${COLLECTIONS.AUTHORS}:`, e);
    }
}

async function setupCategoriesCollection(dbId) {
    let colId;
    try {
        const list = await databases.listCollections(dbId);
        const existing = list.collections.find(c => c.name === COLLECTIONS.CATEGORIES);
        
        if (existing) {
            colId = existing.$id;
            console.log(`ℹ️ Collection '${COLLECTIONS.CATEGORIES}' already exists.`);
        } else {
            const col = await databases.createCollection(dbId, ID.unique(), COLLECTIONS.CATEGORIES);
            colId = col.$id;
            console.log(`✅ Collection '${COLLECTIONS.CATEGORIES}' created.`);

            await databases.createStringAttribute(dbId, colId, 'name', 100, true);
            await databases.createStringAttribute(dbId, colId, 'slug', 100, true);
            await databases.createStringAttribute(dbId, colId, 'color', 20, false, '#000000');
            
            console.log(`✅ Attributes for '${COLLECTIONS.CATEGORIES}' created.`);
        }
    } catch (e) {
        console.error(`❌ Error setting up ${COLLECTIONS.CATEGORIES}:`, e);
    }
}

setup();

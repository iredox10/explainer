import { Client, Databases, ID, Permission, Role, Storage } from 'node-appwrite';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const client = new Client()
    .setEndpoint(process.env.PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const storage = new Storage(client);

const DB_NAME = 'vox_cms';
const DB_ID = 'vox_cms';
const BUCKET_ID = 'media';
const COLLECTIONS = {
    STORIES: 'stories',
    AUTHORS: 'authors',
    CATEGORIES: 'categories'
};

async function setup() {
    console.log('🚀 Starting Appwrite Setup & Permissions Config...');

    // 1. Create Database
    try {
        await databases.create(DB_ID, DB_NAME);
        console.log(`✅ Database created: ${DB_ID}`);
    } catch (e) {
        if (e.code === 409) {
            console.log(`ℹ️ Database '${DB_NAME}' already exists.`);
        } else {
            console.error('❌ Failed to create database.', e.message);
            return;
        }
    }

    // 2. Create Storage Bucket
    try {
        await storage.createBucket(BUCKET_ID, 'Media', [
            Permission.read(Role.any()),
            Permission.create(Role.users()),
            Permission.update(Role.users()),
            Permission.delete(Role.users()),
        ], false);
        console.log(`✅ Storage Bucket '${BUCKET_ID}' created.`);
    } catch (e) {
        if (e.code === 409) {
            console.log(`ℹ️ Storage Bucket '${BUCKET_ID}' already exists.`);
        } else {
            console.error('❌ Failed to create storage bucket.', e.message);
        }
    }

    // 3. Create Collections with Permissions
    const permissions = [
        Permission.read(Role.any()),
        Permission.create(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users()),
    ];

    await setupStoriesCollection(DB_ID, permissions);
    await setupAuthorsCollection(DB_ID, permissions);
    await setupCategoriesCollection(DB_ID, permissions);

    console.log('🎉 Appwrite Setup Complete!');
}

async function setupStoriesCollection(dbId, permissions) {
    const colId = COLLECTIONS.STORIES;
    try {
        await databases.createCollection(dbId, colId, 'Stories', permissions);
        console.log(`✅ Collection '${colId}' created with permissions.`);

        // Define Attributes
        await databases.createStringAttribute(dbId, colId, 'headline', 255, true);
        await databases.createStringAttribute(dbId, colId, 'subhead', 1000, false);
        await databases.createStringAttribute(dbId, colId, 'category', 100, true);
        await databases.createStringAttribute(dbId, colId, 'author', 100, true);
        await databases.createStringAttribute(dbId, colId, 'status', 50, false, 'Draft');
        await databases.createUrlAttribute(dbId, colId, 'heroImage', false);
        await databases.createEnumAttribute(dbId, colId, 'layout', ['standard', 'scrolly'], false, 'standard');
        await databases.createStringAttribute(dbId, colId, 'content', 100000, false);
        await databases.createStringAttribute(dbId, colId, 'scrollySections', 100000, false);
        await databases.createStringAttribute(dbId, colId, 'workflow_status', 50, false, 'draft');
        await databases.createStringAttribute(dbId, colId, 'videoUrl', 1000, false);
        await databases.createDatetimeAttribute(dbId, colId, 'publishedAt', false);
        await databases.createStringAttribute(dbId, colId, 'slug', 100, true);
        await databases.createBooleanAttribute(dbId, colId, 'isFeatured', false, false);
        await databases.createStringAttribute(dbId, colId, 'author_id', 50, false);
        await databases.createStringAttribute(dbId, colId, 'locked_by', 50, false);
        await databases.createStringAttribute(dbId, colId, 'version_log', 10000, false);

        console.log(`✅ Attributes for '${colId}' created.`);
    } catch (e) {
        if (e.code === 409) {
            console.log(`ℹ️ Collection '${colId}' already exists. Updating permissions...`);
            await databases.updateCollection(dbId, colId, 'Stories', permissions);
        } else {
            console.error(`❌ Error setting up ${colId}:`, e.message);
        }
    }
}

async function setupAuthorsCollection(dbId, permissions) {
    const colId = COLLECTIONS.AUTHORS;
    try {
        await databases.createCollection(dbId, colId, 'Authors', permissions);
        console.log(`✅ Collection '${colId}' created with permissions.`);

        await databases.createStringAttribute(dbId, colId, 'name', 100, true);
        await databases.createStringAttribute(dbId, colId, 'role', 100, false);
        await databases.createEmailAttribute(dbId, colId, 'email', true);
        await databases.createStringAttribute(dbId, colId, 'bio', 1000, false);
        await databases.createStringAttribute(dbId, colId, 'slug', 100, true);
        await databases.createUrlAttribute(dbId, colId, 'imageUrl', false);

        console.log(`✅ Attributes for '${colId}' created.`);
    } catch (e) {
        if (e.code === 409) {
            console.log(`ℹ️ Collection '${colId}' already exists. Updating permissions...`);
            await databases.updateCollection(dbId, colId, 'Authors', permissions);
        } else {
            console.error(`❌ Error setting up ${colId}:`, e.message);
        }
    }
}

async function setupCategoriesCollection(dbId, permissions) {
    const colId = COLLECTIONS.CATEGORIES;
    try {
        await databases.createCollection(dbId, colId, 'Categories', permissions);
        console.log(`✅ Collection '${colId}' created with permissions.`);

        await databases.createStringAttribute(dbId, colId, 'name', 100, true);
        await databases.createStringAttribute(dbId, colId, 'slug', 100, true);
        await databases.createStringAttribute(dbId, colId, 'color', 20, false, '#000000');

        console.log(`✅ Attributes for '${colId}' created.`);
    } catch (e) {
        if (e.code === 409) {
            console.log(`ℹ️ Collection '${colId}' already exists. Updating permissions...`);
            await databases.updateCollection(dbId, colId, 'Categories', permissions);
        } else {
            console.error(`❌ Error setting up ${colId}:`, e.message);
        }
    }
}

setup();

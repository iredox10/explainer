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

    } catch (e) {
        if (e.code === 409) {
            console.log(`ℹ️ Collection '${colId}' already exists. Updating permissions...`);
            await databases.updateCollection(dbId, colId, 'Stories', permissions);
        } else {
            console.error(`❌ Error setting up ${colId}:`, e.message);
            return;
        }
    }

    await ensureStoryAttributes(dbId, colId);
}

async function ensureStoryAttributes(dbId, colId) {
    await createStringAttribute(dbId, colId, 'headline', 255, true);
    await createStringAttribute(dbId, colId, 'subhead', 1000, false);
    await createStringAttribute(dbId, colId, 'category', 100, true);
    await createStringAttribute(dbId, colId, 'author', 100, true);
    await createStringAttribute(dbId, colId, 'status', 50, false, 'Draft');
    await createUrlAttribute(dbId, colId, 'heroImage', false);
    await createEnumAttribute(dbId, colId, 'layout', ['standard', 'scrolly'], false, 'standard');
    await createStringAttribute(dbId, colId, 'content', 100000, false);
    await createStringAttribute(dbId, colId, 'scrollySections', 100000, false);
    await createStringAttribute(dbId, colId, 'workflow_status', 50, false, 'draft');
    await createStringAttribute(dbId, colId, 'videoUrl', 1000, false);
    await createDatetimeAttribute(dbId, colId, 'publishedAt', false);
    await createStringAttribute(dbId, colId, 'slug', 100, true);
    await createBooleanAttribute(dbId, colId, 'isFeatured', false, false);
    await createStringAttribute(dbId, colId, 'author_id', 50, false);
    await createStringAttribute(dbId, colId, 'locked_by', 50, false);
    await createStringAttribute(dbId, colId, 'version_log', 10000, false);
    await createStringAttribute(dbId, colId, 'tags', 1000, false);
    await createStringAttribute(dbId, colId, 'sources', 20000, false);
    await createStringAttribute(dbId, colId, 'footnotes', 20000, false);
    await createDatetimeAttribute(dbId, colId, 'scheduledAt', false);
    await createStringAttribute(dbId, colId, 'seo', 10000, false);
    await createStringAttribute(dbId, colId, 'revisionSnapshots', 50000, false);

    console.log(`✅ Attributes for '${colId}' ensured.`);
}

async function setupAuthorsCollection(dbId, permissions) {
    const colId = COLLECTIONS.AUTHORS;
    try {
        await databases.createCollection(dbId, colId, 'Authors', permissions);
        console.log(`✅ Collection '${colId}' created with permissions.`);
    } catch (e) {
        if (e.code === 409) {
            console.log(`ℹ️ Collection '${colId}' already exists. Updating permissions...`);
            await databases.updateCollection(dbId, colId, 'Authors', permissions);
        } else {
            console.error(`❌ Error setting up ${colId}:`, e.message);
            return;
        }
    }

    await ensureAuthorAttributes(dbId, colId);
}

async function ensureAuthorAttributes(dbId, colId) {
    await createStringAttribute(dbId, colId, 'name', 100, true);
    await createStringAttribute(dbId, colId, 'role', 100, false);
    await createEmailAttribute(dbId, colId, 'email', true);
    await createStringAttribute(dbId, colId, 'bio', 1000, false);
    await createStringAttribute(dbId, colId, 'slug', 100, true);
    await createUrlAttribute(dbId, colId, 'imageUrl', false);

    console.log(`✅ Attributes for '${colId}' ensured.`);
}

async function setupCategoriesCollection(dbId, permissions) {
    const colId = COLLECTIONS.CATEGORIES;
    try {
        await databases.createCollection(dbId, colId, 'Categories', permissions);
        console.log(`✅ Collection '${colId}' created with permissions.`);
    } catch (e) {
        if (e.code === 409) {
            console.log(`ℹ️ Collection '${colId}' already exists. Updating permissions...`);
            await databases.updateCollection(dbId, colId, 'Categories', permissions);
        } else {
            console.error(`❌ Error setting up ${colId}:`, e.message);
            return;
        }
    }

    await ensureCategoryAttributes(dbId, colId);
}

async function ensureCategoryAttributes(dbId, colId) {
    await createStringAttribute(dbId, colId, 'name', 100, true);
    await createStringAttribute(dbId, colId, 'slug', 100, true);
    await createStringAttribute(dbId, colId, 'color', 20, false, '#000000');

    console.log(`✅ Attributes for '${colId}' ensured.`);
}

async function createStringAttribute(dbId, colId, key, size, required, defaultValue) {
    try {
        await databases.createStringAttribute(dbId, colId, key, size, required, defaultValue);
    } catch (e) {
        if (e.code !== 409) console.error(`❌ Failed to ensure attribute '${key}':`, e.message);
    }
}

async function createUrlAttribute(dbId, colId, key, required, defaultValue) {
    try {
        await databases.createUrlAttribute(dbId, colId, key, required, defaultValue);
    } catch (e) {
        if (e.code !== 409) console.error(`❌ Failed to ensure attribute '${key}':`, e.message);
    }
}

async function createEnumAttribute(dbId, colId, key, values, required, defaultValue) {
    try {
        await databases.createEnumAttribute(dbId, colId, key, values, required, defaultValue);
    } catch (e) {
        if (e.code !== 409) console.error(`❌ Failed to ensure attribute '${key}':`, e.message);
    }
}

async function createDatetimeAttribute(dbId, colId, key, required, defaultValue) {
    try {
        await databases.createDatetimeAttribute(dbId, colId, key, required, defaultValue);
    } catch (e) {
        if (e.code !== 409) console.error(`❌ Failed to ensure attribute '${key}':`, e.message);
    }
}

async function createBooleanAttribute(dbId, colId, key, required, defaultValue) {
    try {
        await databases.createBooleanAttribute(dbId, colId, key, required, defaultValue);
    } catch (e) {
        if (e.code !== 409) console.error(`❌ Failed to ensure attribute '${key}':`, e.message);
    }
}

async function createEmailAttribute(dbId, colId, key, required, defaultValue) {
    try {
        await databases.createEmailAttribute(dbId, colId, key, required, defaultValue);
    } catch (e) {
        if (e.code !== 409) console.error(`❌ Failed to ensure attribute '${key}':`, e.message);
    }
}

setup();

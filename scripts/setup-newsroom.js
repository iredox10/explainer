import { Client, Databases, ID, Permission, Role, Storage } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client()
    .setEndpoint(process.env.PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const storage = new Storage(client);

const DB_ID = 'vox_cms';
const BUCKET_ID = 'media';
const COLLECTIONS = {
    STORIES: 'stories',
    PROFILES: 'profiles',
    CATEGORIES: 'categories',
    CONFIGS: 'configs'
};

async function setup() {
    console.log('🏗️  Initializing Advanced Newsroom Schema...');

    // 1. Create Profiles Collection (Custom User Metadata)
    try {
        await databases.createCollection(DB_ID, COLLECTIONS.PROFILES, 'User Profiles', [
            Permission.read(Role.any()),
            Permission.create(Role.users()),
            Permission.update(Role.users()),
            Permission.delete(Role.users()),
        ]);
        await databases.createStringAttribute(DB_ID, COLLECTIONS.PROFILES, 'userId', 36, true);
        await databases.createStringAttribute(DB_ID, COLLECTIONS.PROFILES, 'email', 255, true);
        await databases.createEnumAttribute(DB_ID, COLLECTIONS.PROFILES, 'role', ['superadmin', 'editor', 'staff_writer'], true);
        await databases.createEnumAttribute(DB_ID, COLLECTIONS.PROFILES, 'status', ['active', 'suspended'], false, 'active');
        await databases.createStringAttribute(DB_ID, COLLECTIONS.PROFILES, 'name', 100, true);
        console.log('✅ Profiles Schema created.');
    } catch (e) { console.log('ℹ️ Profiles skip:', e.message); }

    // 2. Update Stories Collection (Workflow Aware)
    try {
        // Adding workflow fields to existing stories
        await databases.createStringAttribute(DB_ID, COLLECTIONS.STORIES, 'author_id', 36, false);
        await databases.createStringAttribute(DB_ID, COLLECTIONS.STORIES, 'editor_id', 36, false);
        await databases.createStringAttribute(DB_ID, COLLECTIONS.STORIES, 'locked_by', 36, false);
        await databases.createEnumAttribute(DB_ID, COLLECTIONS.STORIES, 'workflow_status', ['draft', 'pending_review', 'scheduled', 'published'], false, 'draft');
        console.log('✅ Stories Schema updated with workflow fields.');
    } catch (e) { console.log('ℹ️ Stories update skip:', e.message); }

    // 3. Create Configs Collection (Singleton)
    try {
        await databases.createCollection(DB_ID, COLLECTIONS.CONFIGS, 'Site Configuration', [
            Permission.read(Role.any()),
            Permission.update(Role.label('admin')), // Only superadmins via label
        ]);
        await databases.createStringAttribute(DB_ID, COLLECTIONS.CONFIGS, 'site_name', 100, true, 'Explainer');
        await databases.createBooleanAttribute(DB_ID, COLLECTIONS.CONFIGS, 'maintenance_mode', true, false);
        await databases.createBooleanAttribute(DB_ID, COLLECTIONS.CONFIGS, 'breaking_news_active', true, false);
        console.log('✅ Configs Schema created.');
    } catch (e) { console.log('ℹ️ Configs skip:', e.message); }

    console.log('🚀 Schema Foundation Step 1 Complete!');
}

setup();

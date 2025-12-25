import { Client, Databases, Permission, Role } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client()
    .setEndpoint(process.env.PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

const DB_ID = process.env.PUBLIC_APPWRITE_DATABASE_ID;
const COLLECTIONS = {
    PROFILES: 'profiles',
    CONFIGS: 'configs'
};

async function fixPermissions() {
    console.log('🛠 Starting permission repairs...');

    const permissions = [
        Permission.read(Role.any()),
        Permission.create(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users()),
    ];

    // PROFILES
    try {
        await databases.createCollection(DB_ID, COLLECTIONS.PROFILES, 'Profiles', permissions);
        console.log('✅ Created Profiles collection');
        await databases.createStringAttribute(DB_ID, COLLECTIONS.PROFILES, 'userId', 100, true);
        await databases.createEmailAttribute(DB_ID, COLLECTIONS.PROFILES, 'email', true);
        await databases.createStringAttribute(DB_ID, COLLECTIONS.PROFILES, 'name', 100, true);
        await databases.createStringAttribute(DB_ID, COLLECTIONS.PROFILES, 'role', 50, true);
        await databases.createStringAttribute(DB_ID, COLLECTIONS.PROFILES, 'status', 20, false, 'active');
    } catch (e) {
        if (e.code === 409) {
            console.log('ℹ️ Profiles collection exists, updating permissions...');
            await databases.updateCollection(DB_ID, COLLECTIONS.PROFILES, 'Profiles', permissions);
        } else {
            console.error('❌ Profiles error:', e.message);
        }
    }

    // CONFIGS
    try {
        await databases.createCollection(DB_ID, COLLECTIONS.CONFIGS, 'Configs', permissions);
        console.log('✅ Created Configs collection');
        await databases.createStringAttribute(DB_ID, COLLECTIONS.CONFIGS, 'site_name', 100, true);
        await databases.createBooleanAttribute(DB_ID, COLLECTIONS.CONFIGS, 'maintenance_mode', false, false);
        await databases.createBooleanAttribute(DB_ID, COLLECTIONS.CONFIGS, 'breaking_news_active', false, false);
    } catch (e) {
        if (e.code === 409) {
            console.log('ℹ️ Configs collection exists, updating permissions...');
            await databases.updateCollection(DB_ID, COLLECTIONS.CONFIGS, 'Configs', permissions);
        } else {
            console.error('❌ Configs error:', e.message);
        }
    }

    console.log('🎉 Permissions repaired!');
}

fixPermissions();

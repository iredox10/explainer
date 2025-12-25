import { Client, Databases, Permission, Role } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client()
    .setEndpoint(process.env.PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DB_ID = process.env.PUBLIC_APPWRITE_DATABASE_ID;
const COL_ID = 'subscribers';

async function setupNewsletter() {
    console.log('📬 Provisioning Newsletter Infrastructure...');

    try {
        // 1. Create Collection with Public 'Create' permission
        await databases.createCollection(DB_ID, COL_ID, 'Newsletter Subscribers', [
            Permission.read(Role.users()), // Admins can see
            Permission.create(Role.any()),  // ANYONE can subscribe
        ]);
        console.log(`✅ Collection '${COL_ID}' established.`);

        // 2. Define Attributes
        await databases.createEmailAttribute(DB_ID, COL_ID, 'email', true);
        await databases.createDatetimeAttribute(DB_ID, COL_ID, 'subscribedAt', false);
        await databases.createStringAttribute(DB_ID, COL_ID, 'status', 20, false, 'active');

        console.log(`✅ Subscriber attributes synchronized.`);
        console.log(`🎉 Newsletter system is ready for broadcast.`);
    } catch (e) {
        if (e.code === 409) {
            console.log('ℹ️ Newsletter infrastructure already exists.');
        } else {
            console.error('❌ Setup failed:', e.message);
        }
    }
}

setupNewsletter();

import { Client, Databases } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client()
    .setEndpoint(process.env.PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DB_ID = process.env.PUBLIC_APPWRITE_DATABASE_ID || 'vox_cms';

async function updateSchema() {
    console.log('Updating Stories Schema with Popularity Engine...');
    try {
        await databases.createIntegerAttribute(DB_ID, 'stories', 'viewCount', false, 0);
        console.log('✅ Added viewCount attribute.');
    } catch (e) {
        if (e.message.includes('already exists')) {
            console.log('ℹ️ viewCount attribute already exists.');
        } else {
            console.error('❌ Failed to add viewCount:', e.message);
        }
    }
}

updateSchema();

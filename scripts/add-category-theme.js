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
    console.log('Adding Category Theme Colors...');
    try {
        await databases.createStringAttribute(DB_ID, 'categories', 'themeColor', 7, false, '#FAFF00');
        console.log('✅ Added themeColor attribute.');
    } catch (e) {
        if (e.message.includes('already exists')) {
            console.log('ℹ️ themeColor attribute already exists.');
        } else {
            console.error('❌ Failed to add themeColor:', e.message);
        }
    }
}

updateSchema();

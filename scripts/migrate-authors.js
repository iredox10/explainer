import { Client, Databases } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client()
    .setEndpoint(process.env.PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

async function migrate() {
    try {
        await databases.createUrlAttribute('vox_cms', 'authors', 'imageUrl', false);
        console.log('✅ Added imageUrl attribute to authors collection');
    } catch (e) {
        console.error('❌ Failed:', e.message);
    }
}

migrate();

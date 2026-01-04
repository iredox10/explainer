import { Client, Databases } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client()
    .setEndpoint(process.env.PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DB_ID = process.env.PUBLIC_APPWRITE_DATABASE_ID || 'vox_cms';

async function listAttributes() {
    try {
        const result = await databases.listAttributes(DB_ID, 'stories');
        console.log('Current Attributes:');
        let totalSize = 0;
        result.attributes.forEach(attr => {
            console.log(`- ${attr.key}: type=${attr.type}, size=${attr.size || 0}`);
            if (attr.size) totalSize += attr.size;
        });
        console.log(`Total Size estimate: ${totalSize}`);
    } catch (e) {
        console.error('Error:', e.message);
    }
}

listAttributes();

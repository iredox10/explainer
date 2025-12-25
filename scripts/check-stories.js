import { Client, Databases } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client()
    .setEndpoint(process.env.PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

async function checkStories() {
    try {
        const stories = await databases.listDocuments(
            process.env.PUBLIC_APPWRITE_DATABASE_ID || 'vox_cms',
            'stories'
        );
        console.log('Total Stories:', stories.total);
        stories.documents.forEach(s => {
            console.log(`- Headline: ${s.headline}, Layout: ${s.layout}, ID: ${s.$id}`);
        });
    } catch (e) {
        console.error('Error fetching stories:', e.message);
    }
}

checkStories();

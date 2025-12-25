import { Client, Databases } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client()
    .setEndpoint(process.env.PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

async function checkProfiles() {
    try {
        const profiles = await databases.listDocuments(
            process.env.PUBLIC_APPWRITE_DATABASE_ID || 'vox_cms',
            'profiles'
        );
        console.log('Total Profiles:', profiles.total);
        profiles.documents.forEach(p => {
            console.log(`- UserID: ${p.userId}, Role: ${p.role}, Status: ${p.status}`);
        });
    } catch (e) {
        console.error('Error fetching profiles:', e.message);
    }
}

checkProfiles();

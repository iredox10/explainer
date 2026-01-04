import { Client, Databases } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client()
    .setEndpoint(process.env.PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DB_ID = process.env.PUBLIC_APPWRITE_DATABASE_ID || 'vox_cms';
const COLLECTION_ID = 'stories';

async function extendSchema() {
    console.log('🏗 Extending Stories Schema...');

    try {
        // Add version_log attribute
        try {
            await databases.createStringAttribute(DB_ID, COLLECTION_ID, 'version_log', 10000, false);
            console.log('✅ Added: version_log (Size: 10000)');
        } catch (e) {
            if (e.code === 409) {
                console.log('ℹ️ Skip: version_log already exists');
            } else {
                throw e;
            }
        }

        // Add editorial_comments attribute
        try {
            await databases.createStringAttribute(DB_ID, COLLECTION_ID, 'editorial_comments', 10000, false, '[]');
            console.log('✅ Added: editorial_comments (Size: 10000)');
        } catch (e) {
            if (e.code === 409) {
                console.log('ℹ️ Skip: editorial_comments already exists');
            } else {
                throw e;
            }
        }

        console.log('🎉 Schema extension complete!');
        console.log('⚠️ Note: Appwrite may take a few seconds to index the new field.');
    } catch (error) {
        console.error('❌ Error extending schema:', error.message);
    }
}

extendSchema();

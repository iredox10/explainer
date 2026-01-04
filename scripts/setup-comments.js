import { Client, Databases, ID } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client()
    .setEndpoint(process.env.PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DB_ID = process.env.PUBLIC_APPWRITE_DATABASE_ID || 'vox_cms';

async function setupComments() {
    console.log('Setting up Editorial Comments Collection...');
    try {
        // 1. Create collection
        try {
            await databases.createCollection(DB_ID, 'editorial_comments', 'Editorial Comments');
            console.log('✅ Created editorial_comments collection.');
        } catch (e) {
            if (e.code === 409) console.log('ℹ️ Collection already exists.');
            else throw e;
        }

        // 2. Add attributes
        const attrs = [
            { key: 'storyId', type: 'string', size: 36, required: true },
            { key: 'userId', type: 'string', size: 36, required: true },
            { key: 'userName', type: 'string', size: 100, required: true },
            { key: 'text', type: 'string', size: 5000, required: true },
            { key: 'timestamp', type: 'string', size: 50, required: true }
        ];

        for (const attr of attrs) {
            try {
                if (attr.type === 'string') {
                    await databases.createStringAttribute(DB_ID, 'editorial_comments', attr.key, attr.size, attr.required);
                } else if (attr.type === 'datetime') {
                    await databases.createDatetimeAttribute(DB_ID, 'editorial_comments', attr.key, attr.required);
                }
                console.log(`✅ Added attribute: ${attr.key}`);
            } catch (e) {
                if (e.code === 409) console.log(`ℹ️ Attribute ${attr.key} already exists.`);
                else console.error(`❌ Error adding ${attr.key}:`, e.message);
            }
        }

        // 3. Create index
        try {
            await databases.createIndex(DB_ID, 'editorial_comments', 'story_idx', 'key', ['storyId']);
            console.log('✅ Created index on storyId.');
        } catch (e) {
            if (e.code === 409) console.log('ℹ️ Index already exists.');
        }

        console.log('🎉 Comments infrastructure ready.');
    } catch (error) {
        console.error('❌ Setup failed:', error.message);
    }
}

setupComments();

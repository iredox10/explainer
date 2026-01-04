import { Client, Databases, Permission, Role, ID } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client()
    .setEndpoint(process.env.PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DB_ID = process.env.PUBLIC_APPWRITE_DATABASE_ID || 'vox_cms';

async function setupArchive() {
    console.log('Setting up Newsroom Archive Infrastructure...');
    try {
        // 1. Create collection for newsletters
        try {
            await databases.createCollection(DB_ID, 'newsletters', 'Newsletter Archive', [
                Permission.read(Role.any()), // EVERYONE can read dispatches
            ]);
            console.log('✅ Created newsletters collection.');
        } catch (e) {
            if (e.code === 409) console.log('ℹ️ Collection newsletters already exists.');
            else throw e;
        }

        // 2. Add attributes
        const attrs = [
            { key: 'subject', type: 'string', size: 500, required: true },
            { key: 'content', type: 'string', size: 10000, required: true },
            { key: 'sentAt', type: 'string', size: 50, required: true },
            { key: 'author', type: 'string', size: 100, required: true }
        ];

        for (const attr of attrs) {
            try {
                await databases.createStringAttribute(DB_ID, 'newsletters', attr.key, attr.size, attr.required);
                console.log(`✅ Added attribute: ${attr.key}`);
            } catch (e) {
                if (e.code === 409) console.log(`ℹ️ Attribute ${attr.key} already exists.`);
                else console.error(`❌ Error adding ${attr.key}:`, e.message);
            }
        }

        console.log('🎉 Newsroom Archive ready.');
    } catch (error) {
        console.error('❌ Setup failed:', error.message);
    }
}

setupArchive();

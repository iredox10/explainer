import { Client, Databases } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client()
    .setEndpoint(process.env.PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

const DB_ID = process.env.PUBLIC_APPWRITE_DATABASE_ID;
const COLLECTION_ID = 'configs';

async function checkConfigs() {
    console.log('🧐 Inspecting Infrastructure Configs...');
    try {
        const response = await databases.listDocuments(DB_ID, COLLECTION_ID);
        console.log(`📊 Found ${response.total} configuration documents.`);

        response.documents.forEach((doc, i) => {
            console.log(`[${i}] ID: ${doc.$id}, Maint: ${doc.maintenance_mode}, Site: ${doc.site_name}`);
        });

        if (response.total > 1) {
            console.log('⚠️ CRITICAL: Multiple configs detected. This causes state sync issues.');
            console.log('🧹 Cleaning up... Keeping the newest one.');

            // Sort by $createdAt desc
            const sorted = response.documents.sort((a, b) => new Date(b.$createdAt) - new Date(a.$createdAt));
            const keep = sorted[0];
            const toDelete = sorted.slice(1);

            for (const doc of toDelete) {
                await databases.deleteDocument(DB_ID, COLLECTION_ID, doc.$id);
                console.log(`🗑 Deleted stale config: ${doc.$id}`);
            }
            console.log(`✅ Kept active config: ${keep.$id}`);
        } else if (response.total === 0) {
            console.log('🆕 No config found. Creating industrial default...');
            await databases.createDocument(DB_ID, COLLECTION_ID, 'unique()', {
                site_name: 'VOX.AFRICA',
                maintenance_mode: false,
                breaking_news_active: false
            });
            console.log('✅ Default config established.');
        }
    } catch (e) {
        console.error('❌ Diagnostic failed:', e.message);
    }
}

checkConfigs();

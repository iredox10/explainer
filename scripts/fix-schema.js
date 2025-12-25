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

async function fixSchema() {
    console.log('🏗 Modernizing System Config Schema...');

    try {
        // Force create attributes if they don't exist
        try {
            await databases.createStringAttribute(DB_ID, COLLECTION_ID, 'site_name', 100, true);
            console.log('✅ Added: site_name');
        } catch (e) { console.log('ℹ️ Skip: site_name already exists'); }

        try {
            await databases.createBooleanAttribute(DB_ID, COLLECTION_ID, 'maintenance_mode', false, false);
            console.log('✅ Added: maintenance_mode');
        } catch (e) { console.log('ℹ️ Skip: maintenance_mode already exists'); }

        try {
            await databases.createBooleanAttribute(DB_ID, COLLECTION_ID, 'breaking_news_active', false, false);
            console.log('✅ Added: breaking_news_active');
        } catch (e) { console.log('ℹ️ Skip: breaking_news_active already exists'); }

        console.log('🎉 Schema modernization complete!');
        console.log('⚠️ Note: Appwrite may take 30-60 seconds to index these new fields.');
    } catch (error) {
        console.error('❌ Critical Schema Error:', error.message);
    }
}

fixSchema();

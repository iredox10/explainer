import { Client, Databases } from 'node-appwrite';
import 'dotenv/config';

const client = new Client()
    .setEndpoint(process.env.PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DB_ID = process.env.PUBLIC_APPWRITE_DATABASE_ID || 'vox_cms';

async function fixBooleanAttributes() {
    console.log('🔧 Fixing boolean attributes...\n');

    try {
        console.log('Adding "resolved" to comments collection...');
        await databases.createBooleanAttribute(
            DB_ID, 
            '6993168d003721c2a818', 
            'resolved', 
            false,  
            false
        );
        console.log('✅ Added "resolved" attribute');
    } catch (e) {
        if (e.message?.includes('already exists')) {
            console.log('⚠️  "resolved" already exists');
        } else {
            console.log('❌ Error:', e.message);
        }
    }

    try {
        console.log('Adding "read" to notifications collection...');
        await databases.createBooleanAttribute(
            DB_ID, 
            '6993169700368e51c1bb', 
            'read', 
            false, 
            false
        );
        console.log('✅ Added "read" attribute');
    } catch (e) {
        if (e.message?.includes('already exists')) {
            console.log('⚠️  "read" already exists');
        } else {
            console.log('❌ Error:', e.message);
        }
    }

    console.log('\n🎉 Done!');
}

fixBooleanAttributes().catch(console.error);
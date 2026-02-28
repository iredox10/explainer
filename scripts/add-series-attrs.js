import { Client, Databases } from 'node-appwrite';
import * as dotenv from 'dotenv';
dotenv.config();

const client = new Client()
    .setEndpoint(process.env.PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.NODE_APPWRITE_KEY || process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DB_ID = process.env.PUBLIC_APPWRITE_DB_ID || process.env.APPWRITE_DB_ID;
const STORIES_COLLECTION = process.env.PUBLIC_APPWRITE_COLLECTION_STORIES || 'stories';

async function setup() {
    console.log("Adding attributes using DB:", DB_ID, "Collection:", STORIES_COLLECTION);
    try {
        await databases.createStringAttribute(DB_ID, STORIES_COLLECTION, 'seriesSlug', 100, false);
        console.log("Added seriesSlug");
    } catch (e) {
        console.log("seriesSlug:", e.message);
    }
    
    try {
        await databases.createIntegerAttribute(DB_ID, STORIES_COLLECTION, 'seriesPart', false);
        console.log("Added seriesPart");
    } catch (e) {
        console.log("seriesPart:", e.message);
    }
}
setup();

import { Client, Databases, ID, Permission, Role } from 'node-appwrite';
import 'dotenv/config';

const client = new Client()
    .setEndpoint(process.env.PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DB_ID = process.env.PUBLIC_APPWRITE_DATABASE_ID || 'vox_cms';

const COLLECTIONS_TO_CREATE = {
    analytics: {
        name: 'Analytics',
        attributes: [
            { key: 'storyId', type: 'string', size: 255, required: false },
            { key: 'visitorId', type: 'string', size: 255, required: true },
            { key: 'path', type: 'string', size: 500, required: true },
            { key: 'referrer', type: 'string', size: 500, required: false },
            { key: 'device', type: 'string', size: 50, required: false },
            { key: 'userAgent', type: 'string', size: 1000, required: false },
            { key: 'timestamp', type: 'string', size: 255, required: true },
            { key: 'date', type: 'string', size: 20, required: true },
            { key: 'timeOnPage', type: 'integer', required: false }
        ],
        indexes: [
            { key: 'storyId_index', type: 'key', attributes: ['storyId'] },
            { key: 'visitorId_index', type: 'key', attributes: ['visitorId'] },
            { key: 'timestamp_index', type: 'key', attributes: ['timestamp'] },
            { key: 'date_index', type: 'key', attributes: ['date'] }
        ]
    },
    scroll_depth: {
        name: 'Scroll Depth',
        attributes: [
            { key: 'storyId', type: 'string', size: 255, required: true },
            { key: 'visitorId', type: 'string', size: 255, required: true },
            { key: 'maxDepth', type: 'integer', required: true },
            { key: 'currentStep', type: 'integer', required: false },
            { key: 'totalSteps', type: 'integer', required: false },
            { key: 'viewport', type: 'string', size: 50, required: false },
            { key: 'timestamp', type: 'string', size: 255, required: true }
        ],
        indexes: [
            { key: 'storyId_index', type: 'key', attributes: ['storyId'] },
            { key: 'visitorId_index', type: 'key', attributes: ['visitorId'] }
        ]
    },
    media_library: {
        name: 'Media Library',
        attributes: [
            { key: 'fileId', type: 'string', size: 255, required: true },
            { key: 'filename', type: 'string', size: 500, required: true },
            { key: 'originalName', type: 'string', size: 500, required: false },
            { key: 'mimeType', type: 'string', size: 100, required: false },
            { key: 'size', type: 'integer', required: false },
            { key: 'url', type: 'string', size: 1000, required: true },
            { key: 'tags', type: 'string', size: 5000, array: true, required: false },
            { key: 'usage', type: 'string', size: 5000, array: true, required: false },
            { key: 'caption', type: 'string', size: 1000, required: false },
            { key: 'altText', type: 'string', size: 500, required: false },
            { key: 'uploadedAt', type: 'string', size: 255, required: true },
            { key: 'dimensions', type: 'string', size: 255, required: false }
        ],
        indexes: [
            { key: 'tags_index', type: 'fulltext', attributes: ['tags'] },
            { key: 'uploadedAt_index', type: 'key', attributes: ['uploadedAt'] }
        ]
    },
    comments: {
        name: 'Editorial Comments',
        attributes: [
            { key: 'storyId', type: 'string', size: 255, required: true },
            { key: 'blockId', type: 'string', size: 255, required: true },
            { key: 'content', type: 'string', size: 5000, required: true },
            { key: 'authorId', type: 'string', size: 255, required: true },
            { key: 'authorName', type: 'string', size: 255, required: true },
            { key: 'authorEmail', type: 'string', size: 255, required: false },
            { key: 'resolved', type: 'boolean', required: true, default: false },
            { key: 'resolvedAt', type: 'string', size: 255, required: false },
            { key: 'resolvedById', type: 'string', size: 255, required: false },
            { key: 'resolvedByName', type: 'string', size: 255, required: false },
            { key: 'replies', type: 'string', size: 50000, required: false },
            { key: 'createdAt', type: 'string', size: 255, required: true }
        ],
        indexes: [
            { key: 'storyId_index', type: 'key', attributes: ['storyId'] },
            { key: 'blockId_index', type: 'key', attributes: ['blockId'] },
            { key: 'resolved_index', type: 'key', attributes: ['resolved'] }
        ]
    },
    activity_log: {
        name: 'Activity Log',
        attributes: [
            { key: 'type', type: 'string', size: 100, required: true },
            { key: 'storyId', type: 'string', size: 255, required: false },
            { key: 'userId', type: 'string', size: 255, required: false },
            { key: 'userName', type: 'string', size: 255, required: false },
            { key: 'details', type: 'string', size: 5000, required: false },
            { key: 'timestamp', type: 'string', size: 255, required: true }
        ],
        indexes: [
            { key: 'type_index', type: 'key', attributes: ['type'] },
            { key: 'storyId_index', type: 'key', attributes: ['storyId'] },
            { key: 'userId_index', type: 'key', attributes: ['userId'] },
            { key: 'timestamp_index', type: 'key', attributes: ['timestamp'] }
        ]
    },
    notifications: {
        name: 'Notifications',
        attributes: [
            { key: 'userId', type: 'string', size: 255, required: true },
            { key: 'type', type: 'string', size: 100, required: true },
            { key: 'title', type: 'string', size: 255, required: true },
            { key: 'message', type: 'string', size: 1000, required: false },
            { key: 'link', type: 'string', size: 500, required: false },
            { key: 'read', type: 'boolean', required: true, default: false },
            { key: 'readAt', type: 'string', size: 255, required: false },
            { key: 'createdAt', type: 'string', size: 255, required: true }
        ],
        indexes: [
            { key: 'userId_index', type: 'key', attributes: ['userId'] },
            { key: 'read_index', type: 'key', attributes: ['read'] }
        ]
    },
    assignments: {
        name: 'Assignments',
        attributes: [
            { key: 'storyId', type: 'string', size: 255, required: true },
            { key: 'storyTitle', type: 'string', size: 500, required: true },
            { key: 'assignedToId', type: 'string', size: 255, required: true },
            { key: 'assignedToName', type: 'string', size: 255, required: true },
            { key: 'assignedById', type: 'string', size: 255, required: false },
            { key: 'assignedByName', type: 'string', size: 255, required: false },
            { key: 'deadline', type: 'string', size: 255, required: true },
            { key: 'status', type: 'string', size: 50, required: true },
            { key: 'notes', type: 'string', size: 2000, required: false },
            { key: 'createdAt', type: 'string', size: 255, required: true },
            { key: 'completedAt', type: 'string', size: 255, required: false }
        ],
        indexes: [
            { key: 'storyId_index', type: 'key', attributes: ['storyId'] },
            { key: 'assignedToId_index', type: 'key', attributes: ['assignedToId'] },
            { key: 'deadline_index', type: 'key', attributes: ['deadline'] },
            { key: 'status_index', type: 'key', attributes: ['status'] }
        ]
    },
    campaigns: {
        name: 'Email Campaigns',
        attributes: [
            { key: 'subject', type: 'string', size: 500, required: true },
            { key: 'html', type: 'string', size: 100000, required: false },
            { key: 'text', type: 'string', size: 50000, required: false },
            { key: 'status', type: 'string', size: 50, required: true },
            { key: 'totalRecipients', type: 'integer', required: true },
            { key: 'sentCount', type: 'integer', required: true, default: 0 },
            { key: 'failedCount', type: 'integer', required: true, default: 0 },
            { key: 'openCount', type: 'integer', required: true, default: 0 },
            { key: 'clickCount', type: 'integer', required: true, default: 0 },
            { key: 'sentAt', type: 'string', size: 255, required: true }
        ],
        indexes: [
            { key: 'sentAt_index', type: 'key', attributes: ['sentAt'] },
            { key: 'status_index', type: 'key', attributes: ['status'] }
        ]
    }
};

async function createCollections() {
    console.log('🚀 Setting up new collections for Explainer admin features...\n');

    for (const [key, config] of Object.entries(COLLECTIONS_TO_CREATE)) {
        try {
            console.log(`📦 Creating collection: ${config.name}...`);
            
            const collection = await databases.createCollection(
                DB_ID,
                ID.unique(),
                config.name,
                [
                    Permission.read(Role.any()),
                    Permission.create(Role.team(process.env.PUBLIC_APPWRITE_TEAM_ID || 'editors')),
                    Permission.update(Role.team(process.env.PUBLIC_APPWRITE_TEAM_ID || 'editors')),
                    Permission.delete(Role.team(process.env.PUBLIC_APPWRITE_TEAM_ID || 'editors'))
                ]
            );

            console.log(`   ✅ Collection created: ${collection.$id}`);

            for (const attr of config.attributes) {
                try {
                    if (attr.type === 'string') {
                        if (attr.array) {
                            await databases.createStringAttribute(
                                DB_ID, collection.$id, attr.key, attr.size, attr.required, attr.default, true
                            );
                        } else {
                            await databases.createStringAttribute(
                                DB_ID, collection.$id, attr.key, attr.size, attr.required, attr.default
                            );
                        }
                    } else if (attr.type === 'integer') {
                        await databases.createIntegerAttribute(
                            DB_ID, collection.$id, attr.key, attr.required, attr.default
                        );
                    } else if (attr.type === 'boolean') {
                        await databases.createBooleanAttribute(
                            DB_ID, collection.$id, attr.key, attr.required, attr.default
                        );
                    }
                    console.log(`   ✅ Attribute: ${attr.key}`);
                } catch (attrError) {
                    if (attrError.message?.includes('already exists')) {
                        console.log(`   ⚠️  Attribute already exists: ${attr.key}`);
                    } else {
                        console.error(`   ❌ Failed to create attribute ${attr.key}:`, attrError.message);
                    }
                }
            }

            for (const index of config.indexes) {
                try {
                    await databases.createIndex(
                        DB_ID, collection.$id, index.key, index.type, index.attributes
                    );
                    console.log(`   ✅ Index: ${index.key}`);
                } catch (indexError) {
                    if (indexError.message?.includes('already exists')) {
                        console.log(`   ⚠️  Index already exists: ${index.key}`);
                    } else {
                        console.error(`   ❌ Failed to create index ${index.key}:`, indexError.message);
                    }
                }
            }

            console.log(`   📝 Collection ID: ${collection.$id}`);
            console.log(`   📝 Add to COLLECTIONS: ${key}: '${collection.$id}'\n`);
        } catch (error) {
            if (error.message?.includes('already exists')) {
                console.log(`   ⚠️  Collection "${config.name}" already exists\n`);
            } else {
                console.error(`   ❌ Failed to create collection "${config.name}":`, error.message, '\n');
            }
        }
    }

    console.log('\n🎉 Setup complete!');
    console.log('\n⚠️  IMPORTANT: Update your COLLECTIONS object in src/lib/appwrite.js with the new collection IDs.');
}

createCollections().catch(console.error);
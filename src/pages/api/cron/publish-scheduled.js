import { Client, Databases } from 'node-appwrite';

const client = new Client()
    .setEndpoint(process.env.PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DB_ID = process.env.PUBLIC_APPWRITE_DATABASE_ID || 'vox_cms';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const authHeader = req.headers.authorization || '';
    const cronSecret = process.env.CRON_SECRET || 'scheduled-publish-secret';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const now = new Date().toISOString();
        
        const response = await databases.listDocuments(DB_ID, 'stories', [
            { method: 'equal', attribute: 'status', values: ['Scheduled'] },
            { method: 'lessThanEqual', attribute: 'scheduledAt', values: [now] }
        ]);

        const storiesToPublish = response.documents;
        const results = {
            published: [],
            failed: [],
            total: storiesToPublish.length
        };

        for (const story of storiesToPublish) {
            try {
                await databases.updateDocument(DB_ID, 'stories', story.$id, {
                    status: 'Published',
                    workflow_status: 'published',
                    publishedAt: now
                });
                
                results.published.push({
                    id: story.$id,
                    headline: story.headline,
                    slug: story.slug
                });

                console.log(`Published: ${story.headline} (${story.$id})`);
            } catch (error) {
                console.error(`Failed to publish ${story.$id}:`, error);
                results.failed.push({
                    id: story.$id,
                    error: error.message
                });
            }
        }

        res.status(200).json({
            success: true,
            timestamp: now,
            results
        });
    } catch (error) {
        console.error('Scheduled publish error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
}
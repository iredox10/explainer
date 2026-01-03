import { Client, Users } from 'node-appwrite';

export const POST = async ({ request }) => {
    try {
        const body = await request.json();
        const { userId } = body;

        if (!userId) {
            return new Response(JSON.stringify({ error: "Missing User ID" }), { status: 400 });
        }

        // Initialize Admin SDK
        const client = new Client()
            .setEndpoint(import.meta.env.PUBLIC_APPWRITE_ENDPOINT)
            .setProject(import.meta.env.PUBLIC_APPWRITE_PROJECT_ID)
            .setKey(import.meta.env.APPWRITE_API_KEY);

        const users = new Users(client);

        // Terminate all sessions for the suspended user immediately
        await users.deleteSessions(userId);

        return new Response(JSON.stringify({ 
            success: true, 
            message: `All sessions terminated for user ${userId}` 
        }), { status: 200 });

    } catch (error) {
        console.error("[SUSPENSION API]:", error);
        // Even if session deletion fails (e.g. user already has no sessions), 
        // we return 200 because the primary goal is REVOCATION.
        return new Response(JSON.stringify({ 
            success: false, 
            error: error.message 
        }), { status: 500 });
    }
};

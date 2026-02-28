import { serverNewsletterService } from "../../lib/server-appwrite.js";

export const POST = async ({ request }) => {
    try {
        const body = await request.json();

        if (!body.email || typeof body.email !== 'string' || !body.email.includes('@')) {
            return new Response(JSON.stringify({ error: "Please provide a valid email address." }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        await serverNewsletterService.subscribe(body.email);

        return new Response(JSON.stringify({ success: true, message: "Subscribed successfully" }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error("API error during subscription:", error);

        // Handle Appwrite specific "Document already exists" error
        if (error.code === 409 || (error.message && error.message.includes('Document already exists'))) {
            return new Response(JSON.stringify({ success: true, message: "You are already subscribed!" }), {
                status: 200, // Still return 200 since the user's intent is met
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({ error: "Failed to process subscription. Please try again." }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};

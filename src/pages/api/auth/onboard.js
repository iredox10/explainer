import { serverAuthService } from '../../../lib/server-appwrite';

export const POST = async ({ request }) => {
    try {
        const body = await request.json();
        const { userId, teamId, membershipId, secret, password } = body;

        if (!userId || !teamId || !secret || !password) {
            return new Response(JSON.stringify({
                error: "Missing required fields (userId, teamId, secret, or password)"
            }), { status: 400 });
        }

        const result = await serverAuthService.onboardInvitedUser(
            userId, 
            teamId, 
            membershipId, 
            secret, 
            password
        );

        return new Response(JSON.stringify(result), {
            status: 200,
            headers: {
                "Content-Type": "application/json"
            }
        });
    } catch (error) {
        console.error("[API Onboard Error]:", error);
        return new Response(JSON.stringify({
            error: error.message || "Failed to onboard user"
        }), { status: 500 });
    }
};

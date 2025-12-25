import { Client, Teams, Query } from 'node-appwrite';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * ELEVATION SCRIPT
 * This script uses the Appwrite Server SDK (Secret API Key) to elevate
 * a newsroom user to the 'owner' role. This is required for sending
 * invitations directly from the browser dashboard.
 */

const client = new Client()
    .setEndpoint(process.env.PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const teams = new Teams(client);
const TEAM_ID = process.env.PUBLIC_APPWRITE_TEAM_ID;
const TARGET_EMAIL = 'idreesadam200@gmail.com'; // Your superadmin email

async function elevateToOwner() {
    console.log(`🚀 Elevating ${TARGET_EMAIL} to Team Owner...`);

    if (!TEAM_ID) {
        console.error('❌ Error: PUBLIC_APPWRITE_TEAM_ID is not defined in .env');
        return;
    }

    try {
        // 1. Fetch all memberships for the team
        const response = await teams.listMemberships(TEAM_ID);
        const membership = response.memberships.find(m => m.userEmail === TARGET_EMAIL);

        if (!membership) {
            console.error(`❌ Error: User ${TARGET_EMAIL} is not a member of team ${TEAM_ID}`);
            return;
        }

        console.log(`✅ Found membership ID: ${membership.$id}`);
        console.log(`📡 Current roles: ${membership.roles.join(', ')}`);

        // 2. Update roles to include 'owner'
        // We preserve existing roles and add 'owner'
        const newRoles = [...new Set([...membership.roles, 'owner', 'admin'])];

        await teams.updateMembership(
            TEAM_ID,
            membership.$id,
            newRoles
        );

        console.log(`\n💎 SUCCESS: ${TARGET_EMAIL} is now an OWNER.`);
        console.log(`✨ New roles: ${newRoles.join(', ')}`);
        console.log('--------------------------------------------------');
        console.log('You can now use the "Invite Newsroom Staff" button in the dashboard.');

    } catch (error) {
        console.error('❌ Elevation failed:', error.message);
    }
}

elevateToOwner();

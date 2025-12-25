import { Client, Users, Teams, ID, Query, Databases } from 'node-appwrite';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const client = new Client()
    .setEndpoint(process.env.PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const users = new Users(client);
const teams = new Teams(client);
const databases = new Databases(client);
const DB_ID = process.env.PUBLIC_APPWRITE_DATABASE_ID || 'vox_cms';

// Configuration for the Superadmin
const ADMIN_NAME = 'Super Admin';
const ADMIN_EMAIL = 'idreesadam200@gmail.com'; // Change this
const ADMIN_PASSWORD = 'password123';   // Change this
const TEAM_NAME = 'Editorial Staff';

async function createSuperAdmin() {
    console.log('🛡️ Creating Superadmin and Editorial Team...');

    let teamId = process.env.PUBLIC_APPWRITE_TEAM_ID;

    // 1. Create or Get the Team
    try {
        if (!teamId) {
            const team = await teams.create(ID.unique(), TEAM_NAME);
            teamId = team.$id;
            console.log(`✅ Team '${TEAM_NAME}' created: ${teamId}`);
            console.log(`⚠️ ACTION REQUIRED: Add PUBLIC_APPWRITE_TEAM_ID=${teamId} to your .env file!`);
        } else {
            console.log(`ℹ️ Using existing Team ID: ${teamId}`);
        }
    } catch (e) {
        console.error('❌ Failed to handle team:', e.message);
        return;
    }

    // 2. Create the User
    let userId;
    try {
        const user = await users.create(ID.unique(), ADMIN_EMAIL, undefined, ADMIN_PASSWORD, ADMIN_NAME);
        userId = user.$id;
        console.log(`✅ User '${ADMIN_NAME}' created: ${userId}`);
    } catch (e) {
        if (e.code === 409) {
            console.log(`ℹ️ User with email ${ADMIN_EMAIL} already exists. Fetching user...`);
            const userList = await users.list([Query.equal('email', ADMIN_EMAIL)]);
            userId = userList.users.find(u => u.email === ADMIN_EMAIL).$id;
        } else {
            console.error('❌ Failed to create user:', e.message);
            return;
        }
    }

    try {
        await teams.createMembership(
            teamId,
            ['admin'], // Roles
            ADMIN_EMAIL, // Email
            userId, // UserId
            undefined, // Phone
            `${process.env.PUBLIC_APPWRITE_ENDPOINT}/auth/confirm`, // URL
            ADMIN_NAME // Name
        );
        console.log(`✅ User ${ADMIN_NAME} added to team with 'admin' label.`);
    } catch (e) {
        if (e.code === 409) {
            console.log('ℹ️ User is already a member of the team.');
        } else {
            console.error('❌ Failed to add user to team:', e.message);
        }
    }

    // 4. Create Profile (Source of Truth for Roles)
    try {
        const profileId = ID.unique();
        await databases.createDocument(DB_ID, 'profiles', profileId, {
            userId: userId,
            role: 'superadmin',
            status: 'active'
        });
        console.log('✅ Profile created with superadmin role.');
    } catch (e) {
        if (e.code === 409) {
            console.log('ℹ️ Profile already exists.');
            // Update it just in case
            try {
                const existing = await databases.listDocuments(DB_ID, 'profiles', [Query.equal('userId', userId)]);
                if (existing.total > 0) {
                    await databases.updateDocument(DB_ID, 'profiles', existing.documents[0].$id, {
                        role: 'superadmin',
                        status: 'active'
                    });
                    console.log('✅ Profile updated to superadmin.');
                }
            } catch (upErr) {
                console.error('❌ Failed to update existing profile:', upErr.message);
            }
        } else {
            console.error('❌ Failed to create profile:', e.message);
        }
    }

    console.log('\n🎉 Superadmin Setup Complete!');
    console.log(`📧 Email: ${ADMIN_EMAIL}`);
    console.log(`🔑 Password: ${ADMIN_PASSWORD}`);
    console.log('--------------------------------------------------');
}

createSuperAdmin();

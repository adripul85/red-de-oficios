export const prerender = false;

import type { APIRoute } from 'astro';
import { dbAdmin } from '../../firebase/admin';

export const DELETE: APIRoute = async ({ request }) => {
    try {
        const { campaignId } = await request.json();

        if (!campaignId) {
            return new Response(
                JSON.stringify({ error: "Campaign ID is required" }),
                { status: 400 }
            );
        }

        // Delete the campaign using Admin SDK (bypasses Firestore rules)
        await dbAdmin.collection("newsletter_campaigns").doc(campaignId).delete();

        return new Response(
            JSON.stringify({ success: true, message: "Campaign deleted successfully" }),
            { status: 200 }
        );
    } catch (error: any) {
        console.error("Error deleting campaign:", error);
        return new Response(
            JSON.stringify({ error: error.message || "Failed to delete campaign" }),
            { status: 500 }
        );
    }
};

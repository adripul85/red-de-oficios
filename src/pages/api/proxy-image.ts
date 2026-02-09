
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ request }) => {
    const url = new URL(request.url);
    const imageUrl = url.searchParams.get("url");

    if (!imageUrl) {
        return new Response("Missing URL", { status: 400 });
    }

    try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();

        return new Response(blob, {
            headers: {
                "Content-Type": response.headers.get("Content-Type") || "image/png",
                "Access-Control-Allow-Origin": "*",
                "Cache-Control": "public, max-age=31536000, immutable"
            }
        });

    } catch (error) {
        console.error("PROXY ERROR:", error);
        return new Response("Error fetching image", { status: 500 });
    }
};

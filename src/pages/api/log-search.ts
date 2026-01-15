// src/pages/api/log-search.ts
import type { APIRoute } from "astro";
import { db } from "../../firebase/client"; // Ajusta tu ruta de importación
import { doc, setDoc, increment } from "firebase/firestore";

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const term = body.term?.trim().toLowerCase(); // Normalizar a minúsculas

        if (!term || term.length < 3) {
            return new Response(null, { status: 400 });
        }

        // Usamos el término como ID del documento para evitar duplicados
        // Si existe, incrementa el contador. Si no, lo crea con valor 1.
        const trendRef = doc(db, "search_trends", term);

        await setDoc(trendRef, {
            term_display: body.term, // Guardamos como lo escribió el usuario para mostrarlo lindo (Mayuscula inicial)
            count: increment(1),
            last_searched: new Date()
        }, { merge: true });

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: "Error logging search" }), { status: 500 });
    }
};
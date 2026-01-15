import type { APIRoute } from "astro";
import { dbAdmin } from "../../firebase/admin";

export const POST: APIRoute = async ({ request }) => {
    try {
        const { uid } = await request.json();

        if (!uid) {
            return new Response(JSON.stringify({ error: "Falta uid" }), { status: 400 });
        }

        const profRef = dbAdmin.collection("profesionales").doc(uid);
        const doc = await profRef.get();

        if (!doc.exists) {
            return new Response(JSON.stringify({ error: "Profesional no encontrado" }), { status: 404 });
        }

        const data = doc.data();

        // Verificar si necesita reset mensual
        const ahora = new Date();
        const ultimoReset = data?.ultimo_reset_clicks?.toDate() || new Date(0);
        const mesActual = ahora.getMonth();
        const mesReset = ultimoReset.getMonth();

        let clicksMes = data?.clicks_mes || 0;

        if (mesActual !== mesReset) {
            // Nuevo mes, resetear contador
            clicksMes = 0;
        }

        // Incrementar contadores
        await profRef.update({
            clicks_contacto: (data?.clicks_contacto || 0) + 1,
            clicks_mes: clicksMes + 1,
            ultimo_reset_clicks: ahora,
        });

        return new Response(JSON.stringify({
            ok: true,
            clicks_mes: clicksMes + 1
        }), { status: 200 });

    } catch (error: any) {
        console.error("❌ Error tracking click:", error);
        return new Response(JSON.stringify({
            error: "Error tracking click",
            details: error?.message
        }), { status: 500 });
    }
};

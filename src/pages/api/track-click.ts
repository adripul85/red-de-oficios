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
        const plan = data?.plan || "semilla";

        // Verificar si necesita reset mensual
        const ahora = new Date();
        const ultimoReset = data?.ultimo_reset_clicks?.toDate() || new Date(0);
        const mesActual = ahora.getMonth();
        const mesReset = ultimoReset.getMonth();

        let clicksMes = data?.contactos_whatsapp_mes || 0;

        if (mesActual !== mesReset) {
            // Nuevo mes, resetear contador
            clicksMes = 0;
        }

        const nuevosClicks = clicksMes + 1;

        // Actualizar contadores
        const updateData: any = {
            contacto_clicks: (data?.contacto_clicks || 0) + 1,
            ultimo_reset_clicks: ahora,
        };

        if (plan === "semilla") {
            updateData.contactos_whatsapp_mes = nuevosClicks;
        }

        await profRef.update(updateData);

        // Lógica de respuesta basada en límites
        if (plan === "semilla") {
            if (nuevosClicks >= 60) {
                return new Response(JSON.stringify({
                    status: 'bloqueado',
                    clicks_mes: nuevosClicks,
                    message: 'Límite mensual alcanzado (60/60). Pásate a Premium para seguir recibiendo clientes.'
                }), { status: 403 });
            }

            if (nuevosClicks >= 50) {
                return new Response(JSON.stringify({
                    status: 'aviso',
                    clicks_mes: nuevosClicks,
                    quedan: 60 - nuevosClicks
                }), { status: 200 });
            }
        }

        return new Response(JSON.stringify({
            ok: true,
            status: 'ok',
            clicks_mes: nuevosClicks
        }), { status: 200 });

    } catch (error: any) {
        console.error("❌ Error tracking click:", error);
        return new Response(JSON.stringify({
            error: "Error tracking click",
            details: error?.message
        }), { status: 500 });
    }
};

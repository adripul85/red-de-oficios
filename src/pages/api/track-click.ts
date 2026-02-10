import type { APIRoute } from "astro";
import { dbAdmin } from "../../firebase/admin";
import admin from "firebase-admin";

export const POST: APIRoute = async ({ request }) => {
    try {
        const { uid, clienteId, clienteNombre } = await request.json();

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

        // --- REGISTRO DE CONTACTO ---
        try {
            await dbAdmin.collection("contactos").add({
                proId: uid,
                proNombre: data?.nombre || "Profesional",
                clienteId: clienteId || "anonimo",
                clienteNombre: clienteNombre || "Anonimo",
                fecha: new Date(),
                visto: false,
            });
        } catch (e) {
            console.error("⚠️ Error guardando log de contacto:", e);
        }

        // --- CONTADOR LIFETIME ---
        const totalActual = data?.contactos_whatsapp_total || 0;
        const nuevoTotal = totalActual + 1;

        // Si el usuario es gratuito (semilla/prueba) y ya llegó al límite, bloqueamos (403)
        const esGratuito = plan === "semilla" || plan === "prueba";

        if (esGratuito && totalActual >= 60) {
            return new Response(JSON.stringify({
                status: 'bloqueado',
                actual: totalActual,
                quedan: 0,
                message: 'Límite total alcanzado (60/60). Pásate a Premium para seguir recibiendo clientes.'
            }), { status: 403 });
        }

        const updateData: any = {
            contactos_whatsapp_total: admin.firestore.FieldValue.increment(1),
            ultima_interaccion: admin.firestore.FieldValue.serverTimestamp(),
        };

        await profRef.update(updateData);

        return new Response(JSON.stringify({
            status: 'ok',
            actual: nuevoTotal,
            quedan: Math.max(0, 60 - nuevoTotal)
        }), { status: 200 });

    } catch (error: any) {
        console.error("❌ Error tracking click:", error);
        return new Response(JSON.stringify({
            error: "Error tracking click",
            details: error?.message
        }), { status: 500 });
    }
};

import type { APIRoute } from 'astro';
import { dbAdmin } from "../../firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

export const POST: APIRoute = async ({ request, redirect }) => {
    const data = await request.json();

    const { profesionalId, profesionalNombre, motivo, descripcion, denuncianteUid, denuncianteEmail } = data;

    if (!profesionalId || !motivo) {
        return new Response(JSON.stringify({ error: "Faltan datos requeridos" }), { status: 400 });
    }

    try {
        // 1. Crear el reporte
        const reportsRef = dbAdmin.collection("denuncias");
        await reportsRef.add({
            profesionalId,
            profesionalNombre,
            motivo,
            descripcion,
            denuncianteUid: denuncianteUid || 'anonymous',
            denuncianteEmail: denuncianteEmail || 'anónimo',
            fecha: FieldValue.serverTimestamp(), // Server timestamp
            estado: 'pendiente'
        });

        // 2. SHADOWBAN LOGIC (3 STRIKES)
        const q = reportsRef.where("profesionalId", "==", profesionalId);
        const snapshot = await q.count().get();
        const count = snapshot.data().count;

        let shadowbanned = false;

        if (count >= 3) {
            // Aplicar Shadowban
            await dbAdmin.collection("profesionales").doc(profesionalId).update({
                shadowban: true,
                estado: 'suspendido', // Bloqueo preventivo
                shadowban_reason: 'Exceso de reportes automáticos'
            });
            console.log(`🚨 Usuario ${profesionalId} ha sido shadowbaneado automáticamente (Count: ${count}).`);
            shadowbanned = true;
        }

        return new Response(JSON.stringify({ success: true, count, shadowbanned }), { status: 200 });

    } catch (error) {
        console.error("Error reporting user:", error);
        return new Response(JSON.stringify({ error: "Error interno del servidor" }), { status: 500 });
    }
};

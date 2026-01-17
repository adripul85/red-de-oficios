export const prerender = false;

import { dbAdmin, messagingAdmin } from "../../firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST({ request }: { request: Request }) {
    try {
        const body = await request.json();
        const {
            clienteId,
            clienteNombre,
            clienteAvatar,
            rubro,
            zona,
            telefono,
            presupuesto,
            detalle,
            urgente,
        } = body;

        console.log("🚀 [API] Nueva solicitud recibida:", { rubro, zona });

        // 1. MATCHING: Buscar profesionales Premium en esa zona y rubro
        const prosRef = dbAdmin.collection("profesionales");
        const qPros = prosRef
            .where("rubro_principal", "==", rubro)
            .where("zona", "==", zona)
            .where("plan", "in", ["profesional", "experto"])
            .limit(10);

        const snapPros = await qPros.get();
        const candidatos = snapPros.docs.map((d) => d.id);

        if (candidatos.length === 0) {
            return new Response(
                JSON.stringify({
                    error: "No se encontraron profesionales en esta zona.",
                    candidatos: [],
                }),
                { status: 404 },
            );
        }

        // 2. CREAR LA SOLICITUD (LEAD)
        const docRef = await dbAdmin.collection("solicitudes").add({
            clienteId: clienteId || "anonimo",
            clienteNombre,
            clienteAvatar: clienteAvatar || "",
            rubro,
            zona,
            telefono,
            presupuesto,
            detalle,
            urgente,
            fecha: FieldValue.serverTimestamp(),
            candidatos,
            contactados: [],
            descartados: [],
            status: "nueva",
        });

        console.log("✅ [API] Solicitud creada con ID:", docRef.id);

        // 3. NOTIFICACIONES & PUSH (Crear alertas para cada profesional)
        const promises = candidatos.map(async (proId) => {
            // A. Notificación en DB (Dashboard)
            await dbAdmin
                .collection("profesionales")
                .doc(proId)
                .collection("notificaciones")
                .add({
                    tipo: "lead_nuevo",
                    titulo: urgente
                        ? "🚨 ¡URGENTE: Nueva solicitud!"
                        : "¡Nueva oportunidad de trabajo! 🤑",
                    mensaje: `Un cliente busca ${rubro} en ${zona}. Presupuesto: $${presupuesto || "A convenir"}`,
                    link: `/panel/oportunidades?id=${docRef.id}`,
                    leido: false,
                    fecha: FieldValue.serverTimestamp(),
                });

            // B. Push Notification (FCM)
            const tokensSnap = await dbAdmin
                .collection("profesionales")
                .doc(proId)
                .collection("fcmTokens")
                .get();

            if (!tokensSnap.empty) {
                const tokens = tokensSnap.docs.map((t) => t.data().token);
                // Filtrar duplicados y tokens inválidos si fuera necesario logicamente

                if (tokens.length > 0) {
                    await messagingAdmin.sendEachForMulticast({
                        tokens: tokens,
                        notification: {
                            title: urgente
                                ? "🚨 ¡URGENTE: Presupuesto Pedido!"
                                : "¡Nueva Oportunidad! 💰",
                            body: `Solicitud de ${rubro} en ${zona}. Toca para ver detalle.`,
                        },
                        webpush: {
                            fcmOptions: {
                                link: `/panel/oportunidades?id=${docRef.id}`, // Acción al hacer click
                            },
                        },
                        data: {
                            url: `/panel/oportunidades?id=${docRef.id}`,
                            solicitudId: docRef.id,
                        },
                    });
                    console.log(`📡 [FCM] Enviado a profesional ${proId} (${tokens.length} dispositivos)`);
                }
            }
        });

        await Promise.all(promises);

        return new Response(
            JSON.stringify({
                message: "Solicitud procesada con éxito",
                solicitudId: docRef.id,
                candidatosCount: candidatos.length,
            }),
            { status: 200 },
        );
    } catch (error) {
        console.error("❌ [API] Error creando solicitud:", error);
        return new Response(
            JSON.stringify({ error: "Error interno del servidor" }),
            { status: 500 },
        );
    }
}

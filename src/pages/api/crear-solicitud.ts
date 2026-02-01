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
            detalle,
            urgente,
        } = body;

        console.log("🚀 [API] Nueva solicitud recibida:", { rubro, zona });

        // 1. MATCHING: Buscar todos los profesionales Premium y filtrar en código
        const prosRef = dbAdmin.collection("profesionales");
        const qPros = prosRef
            .where("plan", "==", "experto");
        // Sin límite para obtener TODOS los profesionales premium

        const snapPros = await qPros.get();
        console.log(`📋 [API] Query retornó ${snapPros.docs.length} profesionales`);

        // Filtrar por rubro y zona (soporta múltiples nombres de campos)
        const candidatos = snapPros.docs
            .filter((doc) => {
                const data = doc.data();

                // Intentar diferentes nombres de campo para rubros
                const rubros = data.rubros || data.rubro || data.rubro_principal || [];
                const rubrosArray = Array.isArray(rubros) ? rubros : [rubros].filter(Boolean);

                // Intentar diferentes nombres de campo para zonas
                const zonas = data.zonas_trabajo || data.zonas || data.zona || [];
                const zonasArray = Array.isArray(zonas) ? zonas : [zonas].filter(Boolean);

                const matchR = rubrosArray.includes(rubro);
                const matchZ = zonasArray.includes(zona);

                console.log(`🔍 ${data.nombre || doc.id}: rubros=${JSON.stringify(rubrosArray)} zonas=${JSON.stringify(zonasArray)} matchR=${matchR} matchZ=${matchZ}`);

                return matchR && matchZ;
            })
            .slice(0, 10)
            .map((d) => d.id);

        console.log(`📊 [API] Encontrados ${candidatos.length} profesionales para ${rubro} en ${zona}`);
        console.log(`👥 [API] Candidatos:`, candidatos);

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
                    mensaje: `Un cliente busca ${rubro} en ${zona}.`,
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

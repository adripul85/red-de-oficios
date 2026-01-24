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

        // VALIDACIÓN DE CAMPOS OBLIGATORIOS
        if (!rubro || !zona) {
            console.warn("⚠️ [API] Faltan campos obligatorios:", { rubro, zona });
            return new Response(
                JSON.stringify({ error: "Rubro y zona son obligatorios" }),
                { status: 400 }
            );
        }

        console.log("🚀 [API] Nueva solicitud recibida:", { rubro, zona, clienteNombre });

        // 1. MATCHING: Buscar profesionales Premium que tengan el rubro
        // NOTA: Firestore NO permite múltiples 'array-contains' en una sola query.
        // Hacemos query por rubro y plan, y filtramos zona manualmente.
        const prosRef = dbAdmin.collection("profesionales");
        let candidatos: string[] = [];

        try {
            let qPros = prosRef
                .where("plan", "in", ["profesional", "experto"])
                .where("rubros", "array-contains", rubro);

            // 🔥 FILTRO URGENCIA: Solo pros ONLINE
            if (urgente) {
                console.log("🔥 [API] Filtrando solo profesionales ONLINE para urgencia");
                qPros = qPros.where("online", "==", true);
            }

            qPros = qPros.limit(20);

            const snapPros = await qPros.get();
            // Filtrar por zona manualmente
            candidatos = snapPros.docs
                .filter(d => {
                    const data = d.data();
                    return data.zonas && Array.isArray(data.zonas) && data.zonas.includes(zona);
                })
                .map(d => d.id);

            console.log(`🎯 [API] Coincidencias encontradas por arrays ${urgente ? '(ONLINE)' : ''}: ${candidatos.length}`);
        } catch (e: any) {
            console.warn("⚠️ Query por rubros falló (Posible falta de índice):", e.message);
        }

        // Fallback para campos legacy si no hubo resultados
        if (candidatos.length === 0) {
            console.log("⚠️ [API] No se hallaron coincidencias en arrays, intentando fallback legacy...");
            try {
                let qLegacy = prosRef
                    .where("rubro_principal", "==", rubro)
                    .where("zona", "==", zona)
                    .where("plan", "in", ["profesional", "experto"]);

                if (urgente) {
                    qLegacy = qLegacy.where("online", "==", true);
                }

                const snapLegacy = await qLegacy.limit(10).get();
                candidatos = snapLegacy.docs.map((d) => d.id);
                console.log(`🎯 [API] Coincidencias encontradas por legacy ${urgente ? '(ONLINE)' : ''}: ${candidatos.length}`);
            } catch (e: any) {
                console.error("❌ Error en fallback legacy:", e.message);
            }
        }

        // --- IMPORTANTE: CREAMOS LA SOLICITUD SIEMPRE ---
        // Aunque no haya profesionales ahora, queda el registro para el cliente y admin.

        // 2. CREAR LA SOLICITUD (LEAD)
        const leadData = {
            clienteId: clienteId || "anonimo",
            clienteNombre: clienteNombre || "Cliente",
            clienteEmail: body.clienteEmail || "", // Save email for notifications
            clienteAvatar: clienteAvatar || "",
            rubro,
            zona,
            telefono: telefono || "",
            presupuesto: presupuesto || "A convenir",
            detalle: detalle || "",
            urgente: !!urgente,
            fecha: FieldValue.serverTimestamp(),
            candidatos,
            contactados: [],
            descartados: [],
            status: "nueva",
        };

        const docRef = await dbAdmin.collection("solicitudes").add(leadData);
        console.log("✅ [API] Solicitud creada con ID:", docRef.id);

        // 3. NOTIFICACIONES & PUSH (Crear alertas para cada profesional)
        const promises = candidatos.map(async (proId) => {
            try {
                // Notificación en DB (Dashboard)
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

                // Push Notification (FCM)
                const tokensSnap = await dbAdmin
                    .collection("profesionales")
                    .doc(proId)
                    .collection("fcmTokens")
                    .get();

                if (!tokensSnap.empty) {
                    const tokens = tokensSnap.docs
                        .map((t) => t.data().token)
                        .filter((t) => typeof t === "string" && t.length > 0);

                    if (tokens.length > 0) {
                        await messagingAdmin.sendEachForMulticast({
                            tokens: tokens,
                            notification: {
                                title: urgente
                                    ? "🚨 ¡URGENTE: Presupuesto Pedido!"
                                    : "¡Nueva Oportunidad! 💰",
                                body: `Solicitud de ${rubro} en ${zona}. Toca para ver detalle.`,
                            },
                            data: {
                                url: `/panel/oportunidades?id=${docRef.id}`,
                                solicitudId: docRef.id,
                            },
                        });
                        console.log(`📡 [FCM] Enviado a profesional ${proId} (${tokens.length} dispositivos)`);
                    }
                }
            } catch (innerError: any) {
                console.warn(`⚠️ [API] Error notificando a profesional ${proId}:`, innerError.message);
                // No lanzamos error para que el resto de notificaciones se procesen
            }
        });

        // Esperar a que se procesen las notificaciones (aunque fallen algunas, la solicitud ya se creó)
        await Promise.allSettled(promises);

        return new Response(
            JSON.stringify({
                message: "Solicitud procesada con éxito",
                solicitudId: docRef.id,
                candidatosCount: candidatos.length,
            }),
            { status: 200 },
        );
    } catch (error: any) {
        console.error("❌ [API] Error crítico:", error);
        return new Response(
            JSON.stringify({
                error: "Error interno del servidor",
                details: error.message,
                stack: error.stack // Útil para debug en Vercel
            }),
            { status: 500 },
        );
    }
}

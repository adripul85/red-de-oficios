import type { APIRoute } from "astro";
import { dbAdmin } from "../../../firebase/admin";
import { Resend } from "resend";

export const POST: APIRoute = async ({ request }) => {
    try {
        const apiKey = import.meta.env.RESEND_API_KEY;
        if (!apiKey) {
            console.error("❌ [API validar-doc] RESEND_API_KEY no definida en .env");
            return new Response(JSON.stringify({ error: "Configuración de email faltante" }), { status: 500 });
        }

        const resend = new Resend(apiKey);

        const body = await request.clone().text();
        console.log("📥 [API validar-doc] Body crudo:", body);

        let payload;
        try {
            payload = JSON.parse(body);
        } catch (e) {
            console.error("❌ [API validar-doc] Error al parsear JSON:", e);
            return new Response(JSON.stringify({ error: "JSON inválido" }), { status: 400 });
        }

        const { uid, tipo, accion, motivo } = payload;
        console.log("📥 [API validar-doc] Datos:", { uid, tipo, accion, motivo });

        if (!uid || !tipo || !accion) {
            console.error("❌ [API validar-doc] Faltan datos obligatorios");
            return new Response(JSON.stringify({ error: "Faltan datos" }), {
                status: 400,
            });
        }

        const profRef = dbAdmin.collection("profesionales").doc(uid);
        console.log("🔍 [API validar-doc] Referencia a Firestore:", profRef.path);

        // 1. Obtenemos el perfil para sacar el email y el nombre
        const profDoc = await profRef.get();
        const profData = profDoc.data();

        if (!profData) {
            console.error("❌ [API validar-doc] Profesional no encontrado en Firestore para UID:", uid);
            return new Response(
                JSON.stringify({ error: "Profesional no encontrado" }),
                { status: 404 },
            );
        }

        console.log("👤 [API validar-doc] Datos del profesional encontrados:", {
            nombre: profData.nombre,
            email: profData.email
        });

        let updateData: any = {};

        // 2. Preparamos los datos a guardar
        if (tipo === "dni") {
            updateData = {
                estado_dni: accion,
                dni_verificado: accion === "aprobado",
                verificado: accion === "aprobado",
                motivo_rechazo_dni: accion === "rechazado" ? motivo : (profData.motivo_rechazo_dni || null),
            };
            if (accion === "rechazado") {
                updateData.rechazado_url_dni_frente = profData.url_dni_frente || profData.doc_dni || null;
                updateData.rechazado_url_dni_dorso = profData.url_dni_dorso || null;
            }
        } else if (tipo === "antecedentes") {
            updateData = {
                estado_antecedentes: accion,
                antecedentes_verificados: accion === "aprobado",
                motivo_rechazo_antecedentes: accion === "rechazado" ? motivo : (profData.motivo_rechazo_antecedentes || null),
            };
            if (accion === "rechazado") {
                updateData.rechazado_url_ant = profData.url_antecedentes || profData.doc_antecedentes || null;
            }
        }

        console.log("📤 [API validar-doc] Actualizando Firestore con:", updateData);

        // 3. Actualizamos Firestore
        await profRef.update(updateData);
        console.log("✅ [API validar-doc] Firestore actualizado correctamente");

        // 4. DISPARAMOS EL CORREO SI FUE RECHAZADO
        if (accion === "rechazado" && profData.email) {
            console.log("📧 [API validar-doc] Intentando enviar email de rechazo a:", profData.email);
            const nombreDocumento =
                tipo === "dni" ? "DNI" : "Certificado de Antecedentes Penales";

            try {
                const { data, error: emailError } = await resend.emails.send({
                    from: "DeOficios <onboarding@resend.dev>",
                    to: profData.email,
                    subject: `⚠️ Actualización sobre tu validación de ${nombreDocumento}`,
                    html: `
                        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
                            <h2 style="color: #ea580c; margin-top: 0;">Hola, ${profData.nombre}</h2>
                            <p style="color: #4b5563; line-height: 1.5;">
                                Recientemente revisamos el documento que subiste a tu perfil de <strong>DeOficios</strong> (${nombreDocumento}) y lamentablemente tuvimos que <strong>rechazarlo</strong>.
                            </p>
                            
                            <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 25px 0; border-radius: 0 8px 8px 0;">
                                <p style="margin: 0; color: #991b1b; font-size: 14px; font-weight: bold;">Motivo del rechazo:</p>
                                <p style="margin: 8px 0 0; color: #7f1d1d; font-style: italic;">"${motivo}"</p>
                            </div>
                            
                            <p style="color: #4b5563; line-height: 1.5;">
                                Para no perder tu medalla de confianza y seguir destacándote en las búsquedas, te pedimos que ingreses a tu panel y vuelvas a subir el documento corrigiendo este detalle.
                            </p>
                            
                            <div style="text-align: center; margin: 35px 0;">
                                <a href="https://deoficiosargentina.vercel.app/ingresar" style="background-color: #111827; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                                    Ir a mi Panel
                                </a>
                            </div>
                            
                            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
                            <p style="color: #9ca3af; font-size: 12px; text-align: center;">
                                El equipo de DeOficios. Si tenés dudas, respondé este correo.
                            </p>
                        </div>
                    `,
                });

                if (emailError) {
                    console.error("❌ [API validar-doc] Error de Resend:", emailError);
                } else {
                    console.log("✅ [API validar-doc] Email enviado:", data?.id);
                }
            } catch (err: any) {
                console.error("❌ [API validar-doc] Error enviando email:", err);
            }

            // 5. AGREGAR NOTIFICACIÓN INTERNA EN FIRESTORE
            try {
                await profRef.collection("notificaciones").add({
                    titulo: `Rechazo de ${tipo.toUpperCase()}`,
                    mensaje: `Tu ${nombreDocumento} fue rechazado. Motivo: "${motivo}". Por favor subilo de nuevo para validar tu perfil.`,
                    fecha: new Date(),
                    leido: false,
                    tipo: "alerta",
                    link: tipo === "dni" ? "/mi-perfil" : "/panel"
                });
                console.log("✅ [API validar-doc] Notificación interna creada");
            } catch (notifError) {
                console.error("❌ [API validar-doc] Error creando notificación:", notifError);
            }
        }

        return new Response(JSON.stringify({ status: "ok" }), { status: 200 });
    } catch (error: any) {
        console.error("💥 [API validar-doc] Error crítico:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
        });
    }
};

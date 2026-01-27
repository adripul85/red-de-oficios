import type { APIRoute } from "astro";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { dbAdmin } from "../../firebase/admin";

// Configurar con el nuevo token
const client = new MercadoPagoConfig({
    accessToken: import.meta.env.MP_ACCESS_TOKEN || "TEST-3723388313099209-010813-b29e24f815b6c621e0eb14af1a87935f-148630764"
});

export const POST: APIRoute = async ({ request }) => {
    try {
        // 1. Obtener parámetros de la URL (MercadoPago los manda así)
        const url = new URL(request.url);
        const type = url.searchParams.get("type") || url.searchParams.get("topic");
        const dataId = url.searchParams.get("data.id") || url.searchParams.get("id");

        console.log(`🔔 Webhook recibido: ${type} - ID: ${dataId}`);

        // Solo nos interesa cuando se notifica un PAGO (payment)
        if (type === "payment" && dataId) {
            const payment = new Payment(client);
            const paymentData = await payment.get({ id: dataId });

            // 2. Verificar que el pago esté APROBADO (acreditado)
            if (paymentData.status === "approved") {
                console.log("✅ Pago Aprobado. Procesando activación...");

                const userId = paymentData.external_reference;
                const description = paymentData.description || "";
                const monto = paymentData.transaction_amount;

                if (!userId) {
                    console.error("❌ Error: El pago no tiene ID de usuario (external_reference)");
                    return new Response("Faltan datos", { status: 400 });
                }

                // 3. Determinar qué plan activar y cuánto tiempo
                let nuevoPlan = "mensual";
                let mesesASumar = 1;

                if (description.toLowerCase().includes("semestral")) {
                    nuevoPlan = "semestral";
                    mesesASumar = 6;
                } else if (description.toLowerCase().includes("experto")) {
                    nuevoPlan = "experto";
                    mesesASumar = 6;
                }

                // Calcular fecha de vencimiento
                const fechaVencimiento = new Date();
                fechaVencimiento.setMonth(fechaVencimiento.getMonth() + mesesASumar);

                // Determinar límites según el plan
                let limite_fotos = 0;
                let puede_aparecer_mapa = false;
                let puede_links_social = false;
                let prioridad_mapa = 0;

                if (nuevoPlan === "mensual") {
                    // Plan Impulso
                    limite_fotos = 4;
                    puede_aparecer_mapa = true;
                    prioridad_mapa = 1;
                } else if (nuevoPlan === "experto" || nuevoPlan === "semestral") {
                    // Plan Experto
                    limite_fotos = 12;
                    puede_aparecer_mapa = true;
                    puede_links_social = true;
                    prioridad_mapa = 2;
                }

                // 4. ACTUALIZAR BASE DE DATOS (Usando Admin SDK)
                const userRef = dbAdmin.collection("profesionales").doc(userId);

                await userRef.update({
                    plan: nuevoPlan,
                    vencimiento_plan: fechaVencimiento,
                    estado_pago: "activo",
                    limite_fotos,
                    puede_aparecer_mapa,
                    puede_links_social,
                    prioridad_mapa,
                    updatedAt: new Date(),
                });

                // Guardar registro del pago (Historial)
                await dbAdmin.collection("pagos_historial").add({
                    usuarioId: userId,
                    monto: monto,
                    plan: nuevoPlan,
                    mp_id: dataId,
                    fecha: new Date(),
                    estado: "approved"
                });

                console.log(`🚀 ¡ÉXITO! Usuario ${userId} actualizado a plan ${nuevoPlan} hasta ${fechaVencimiento}`);
            }
        }

        // SIEMPRE responder 200 OK a MercadoPago
        return new Response("OK", { status: 200 });

    } catch (error) {
        console.error("❌ Error en Webhook:", error);
        return new Response("Error interno, pero recibido", { status: 200 });
    }
};
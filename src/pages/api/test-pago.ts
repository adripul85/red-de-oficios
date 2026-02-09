import type { APIRoute } from "astro";
import { dbAdmin } from "../../firebase/admin";

export const POST: APIRoute = async ({ request }) => {
    try {
        const data = await request.json();
        const { id, userId } = data;

        if (!userId || !id) {
            return new Response(JSON.stringify({ error: "Faltan datos (userId o id)" }), { status: 400 });
        }

        console.log(`🧪 Simulando Pago para Usuario: ${userId} - Plan: ${id}`);

        // Determinar qué plan activar y cuánto tiempo
        let nuevoPlan = "mensual";
        let mesesASumar = 1;

        if (id.includes("semestral") || id.includes("experto")) {
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
            limite_fotos = 6;
            puede_aparecer_mapa = true;
            prioridad_mapa = 1;
        } else if (nuevoPlan === "experto") {
            limite_fotos = 12;
            puede_aparecer_mapa = true;
            puede_links_social = true;
            prioridad_mapa = 2;
        }

        // ACTUALIZAR BASE DE DATOS
        const userRef = dbAdmin.collection("profesionales").doc(userId);

        await userRef.update({
            plan: nuevoPlan,
            plan_vencimiento: fechaVencimiento,
            estado_pago: "activo",
            limite_fotos,
            puede_aparecer_mapa,
            puede_links_social,
            prioridad_mapa,
            updatedAt: new Date(),
        });

        // Guardar registro del pago (Historial de Test)
        await dbAdmin.collection("pagos_historial").add({
            usuarioId: userId,
            monto: 0,
            plan: nuevoPlan,
            mp_id: "TEST-SIMULATION-" + Date.now(),
            fecha: new Date(),
            estado: "approved",
            metodo: "test_simulation"
        });

        return new Response(JSON.stringify({ success: true, message: "Plan activado (Modo Test)" }), { status: 200 });

    } catch (error: any) {
        console.error("❌ Error en Simulación:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
};

import type { APIRoute } from "astro";
import { dbAdmin } from "../../../firebase/admin";

export const POST: APIRoute = async ({ request }) => {
    try {
        const { id } = await request.json();

        if (!id) {
            return new Response(JSON.stringify({ error: "Falta ID de pago" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        // Buscamos el documento en la colección 'pagos'
        const pagoRef = dbAdmin.collection("pagos").doc(id);
        const doc = await pagoRef.get();

        if (!doc.exists) {
            return new Response(JSON.stringify({ error: "Pago no encontrado" }), {
                status: 404,
                headers: { "Content-Type": "application/json" }
            });
        }

        await pagoRef.update({
            facturado: true,
            fecha_facturacion: new Date()
        });

        return new Response(JSON.stringify({ status: 'ok' }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error: any) {
        console.error("Error marking as billed:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
};

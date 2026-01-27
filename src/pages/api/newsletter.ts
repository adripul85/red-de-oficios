import type { APIRoute } from 'astro';
import { dbAdmin } from '../../firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export const POST: APIRoute = async ({ request }) => {
    try {
        const { email } = await request.json();

        if (!email || !email.includes('@')) {
            return new Response(JSON.stringify({ error: "Email inválido" }), { status: 400 });
        }

        // 1. Verificar si ya existe (Usando Admin SDK para bypassear reglas)
        const snap = await dbAdmin.collection("newsletter").where("email", "==", email).get();

        if (!snap.empty) {
            return new Response(JSON.stringify({ success: true, message: "Ya estás suscrito" }), { status: 200 });
        }

        // 2. Guardar nuevo suscriptor
        await dbAdmin.collection("newsletter").add({
            email,
            fecha: new Date(), // FieldValue.serverTimestamp() a veces da problemas en serialización simple
            activo: true
        });

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (e: any) {
        console.error("Error Newsletter API:", e);
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
};

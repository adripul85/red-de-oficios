import type { APIRoute } from 'astro';
import { db } from '../../firebase/client';
import { collection, addDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';

export const POST: APIRoute = async ({ request }) => {
    try {
        const { email } = await request.json();

        if (!email || !email.includes('@')) {
            return new Response(JSON.stringify({ error: "Email inválido" }), { status: 400 });
        }

        // 1. Verificar si ya existe
        const q = query(collection(db, "newsletter"), where("email", "==", email));
        const snap = await getDocs(q);

        if (!snap.empty) {
            return new Response(JSON.stringify({ success: true, message: "Ya estás suscrito" }), { status: 200 });
        }

        // 2. Guardar nuevo suscriptor
        await addDoc(collection(db, "newsletter"), {
            email,
            fecha: Timestamp.now(),
            activo: true
        });

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (e: any) {
        console.error("Error Newsletter API:", e);
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
};

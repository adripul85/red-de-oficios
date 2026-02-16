import type { APIRoute } from 'astro';
import { db } from "../../firebase/client";
import { doc, getDoc } from "firebase/firestore";

export const POST: APIRoute = async ({ request }) => {
    try {
        const data = await request.json();
        const { uid, nombre } = data;

        if (!uid) {
            return new Response(JSON.stringify({ error: 'Falta el UID' }), { status: 400 });
        }

        // Obtener email del usuario
        const userRef = doc(db, "profesionales", uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            return new Response(JSON.stringify({ error: 'Usuario no encontrado' }), { status: 404 });
        }

        const userData = userSnap.data();
        const email = userData.email;

        if (!email) {
            return new Response(JSON.stringify({ error: 'Usuario sin email' }), { status: 400 });
        }

        // AQUÍ DEBERÍAS INTEGRAR TU SERVICIO DE EMAIL (SendGrid, Resend, etc.)
        // Por ahora, solo logueamos
        console.log(`📧 Email de rechazo enviado a: ${email} (${nombre})`);

        // Ejemplo con fetch a un servicio de email (comentado):
        /*
        const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${import.meta.env.RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'deOficiosArgentina <noreply@deoficiosargentina.com>',
                to: email,
                subject: 'Validación de Documentos - deOficiosArgentina',
                html: `
                    <h2>Hola ${nombre},</h2>
                    <p>Lamentamos informarte que tus documentos de verificación fueron rechazados.</p>
                    <p><strong>Motivo:</strong> Los documentos no son legibles o no cumplen con los requisitos.</p>
                    <p>Por favor, vuelve a subir documentos claros y legibles desde tu perfil.</p>
                    <p>Saludos,<br>Equipo deOficiosArgentina</p>
                `
            })
        });
        */

        return new Response(JSON.stringify({
            success: true,
            message: 'Email enviado (simulado)'
        }), { status: 200 });

    } catch (error) {
        console.error("Error en send-rejection-email:", error);
        return new Response(JSON.stringify({ error: 'Error del servidor' }), { status: 500 });
    }
}

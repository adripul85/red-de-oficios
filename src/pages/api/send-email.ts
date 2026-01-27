import type { APIRoute } from 'astro';
import { Resend } from 'resend';

const resend = new Resend(import.meta.env.RESEND_API_KEY);

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const { to, subject, html, type } = body;

        console.log(`📧 [EMAIL] Enviando correo real con Resend...`);
        console.log(`📨 Para: ${to}`);
        console.log(`📝 Asunto: ${subject}`);

        const data = await resend.emails.send({
            from: "Red de Oficios <onboarding@resend.dev>",
            to: [to], // En modo test solo puedes enviar a tu propio email registrado en Resend
            subject: subject,
            html: html,
        });

        if (data.error) {
            console.error("❌ Error enviando email:", data.error);
            return new Response(JSON.stringify({ error: data.error }), { status: 500 });
        }

        console.log("✅ Email enviado con éxito:", data);
        return new Response(
            JSON.stringify({ success: true, id: data.data?.id }),
            { status: 200 },
        );
    } catch (e: any) {
        console.error("❌ Error API Email:", e);
        return new Response(JSON.stringify({ error: e.message }), {
            status: 500,
        });
    }

};

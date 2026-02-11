import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
    console.log("📨 [API] Recibida solicitud en /api/notify-registration");
    try {
        const body = await request.json();
        const { nombre, rubro, zona } = body;
        console.log("📦 [API] Payload:", body);

        // TOKEN Y CHAT ID - El usuario debe configurarlos
        // Reemplaza con tus valores reales si prefieres hardcodearlos aquí
        // o usa variables de entorno en Vercel
        const token = '8391133277:AAFIocGzYrnTZNXjVxLBOTZGiQ9Br5i7GrY';
        const chatId = '682293677';

        if (!token || token.includes('TU_TOKEN')) {
            console.warn("⚠️ Telegram Token no configurado");
            return new Response(JSON.stringify({ success: true, message: "Token no configurado, omitiendo notificación." }), { status: 200 });
        }

        const mensaje = `🆕 ¡Nuevo Profesional Registrado!\n👤 Nombre: ${nombre || 'N/A'}\n🛠️ Oficio: ${rubro || 'N/A'}\n📍 Zona: ${zona || 'N/A'}\n\n🚀 Revisa el panel de control para activar el perfil.`;

        console.log("📤 [API] Enviando a Telegram...");
        const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: mensaje
            })
        });

        const tgResult = await res.json();
        console.log("📥 [API] Respuesta Telegram:", tgResult);

        if (!res.ok) {
            return new Response(JSON.stringify({
                success: false,
                error: tgResult.description || 'Unknown Telegram Error'
            }), { status: 400 });
        }

        return new Response(JSON.stringify({ success: true, tgResponse: tgResult }), { status: 200 });
    } catch (error: any) {
        console.error("❌ Error en Notificación Telegram:", error.message);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
};

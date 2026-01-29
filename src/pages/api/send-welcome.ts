export const prerender = false;

import { Resend } from "resend";

export const POST = async ({ request }) => {
    const RESEND_API_KEY = import.meta.env.RESEND_API_KEY;

    if (!RESEND_API_KEY) {
        return new Response(
            JSON.stringify({
                message: "Falta la API Key de Resend",
            }),
            { status: 500 }
        );
    }

    const resend = new Resend(RESEND_API_KEY);

    try {
        const body = await request.json();
        const { email, name, role } = body;

        if (!email || !role) {
            return new Response(
                JSON.stringify({ message: "Faltan datos requeridos (email, role)" }),
                { status: 400 }
            );
        }

        const userName = name || "Usuario";
        const isPro = role === "profesional";

        // Contenido personalizado según rol
        const title = isPro
            ? "¡Bienvenido a la Red de Expertos! 🦁"
            : "¡Bienvenido a DeOficios! 🚀";

        const mainText = isPro
            ? `Gracias por unirte a la plataforma de oficios más grande de Argentina. <br><br>
           Estás a un paso de digitalizar tu trabajo y conseguir más clientes. 
           Tu perfil es tu carta de presentación, así que asegúrate de completarlo al 100%.`
            : `Gracias por unirte. Ahora podrás encontrar a los mejores profesionales para tu hogar o empresa.<br><br>
           Pide presupuestos gratis, compara perfiles y contrata con confianza.`;

        const ctaText = isPro ? "Completar mi Perfil" : "Buscar Profesionales";
        const ctaLink = isPro
            ? "https://deoficios.com.ar/mi-perfil"
            : "https://deoficios.com.ar/resultados";

        // Template HTML Corregido
        const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bienvenido a DeOficios</title>
    </head>
    <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 0; color: #1f2937;">
      
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 0; border-radius: 16px; margin-top: 40px; margin-bottom: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); overflow: hidden;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">DeOficios<span style="color: #fed7aa;">.com.ar</span></h1>
          <p style="color: #ffedd5; margin-top: 10px; font-size: 16px; font-weight: 500;">La Red de Confianza</p>
        </div>

        <!-- Body -->
        <div style="padding: 40px 30px;">
          <h2 style="color: #111827; font-size: 22px; font-weight: bold; margin-top: 0; margin-bottom: 20px;">Hola, ${userName} 👋</h2>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
            ${mainText}
          </p>

          <div style="text-align: center; margin-bottom: 40px;">
            <a href="${ctaLink}" style="background-color: #ea580c; color: #ffffff; padding: 14px 28px; border-radius: 50px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 14px 0 rgba(234, 88, 12, 0.39);">
              ${ctaText}
            </a>
          </div>

          <div style="background-color: #fff7ed; padding: 20px; border-radius: 12px; border: 1px solid #ffedd5;">
            <p style="margin: 0; color: #9a3412; font-size: 14px; text-align: center;">
              <strong>Tip:</strong> Recibirás notificaciones importantes por este medio. Asegúrate de agregarnos a tus contactos.
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f3f4f6; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px; margin-bottom: 10px;">
            © ${new Date().getFullYear()} DeOficios.com.ar - Todos los derechos reservados.
          </p>
          <div style="margin-bottom: 20px;">
            <a href="https://instagram.com/deoficios" style="color: #9ca3af; text-decoration: none; margin: 0 10px;">Instagram</a>
            <a href="https://deoficios.com.ar" style="color: #9ca3af; text-decoration: none; margin: 0 10px;">Web</a>
          </div>
          <p style="color: #9ca3af; font-size: 11px; max-width: 400px; margin: 0 auto;">
            Estás recibiendo este correo porque te registraste en DeOficios.com.ar. Si no fuiste tú, por favor ignora este mensaje.
          </p>
        </div>

      </div>
      
    </body>
    </html>
    `;

        const data = await resend.emails.send({
            from: "DeOficios <hola@deoficios.com.ar>",
            to: [email],
            subject: title,
            html: htmlContent,
        });

        return new Response(
            JSON.stringify({
                message: "Email enviado con éxito",
                id: data.id,
            }),
            { status: 200 }
        );
    } catch (error) {
        console.error("Error sending welcome email:", error);
        return new Response(
            JSON.stringify({
                message: "Error interno al enviar email",
                error: error instanceof Error ? error.message : error,
            }),
            { status: 500 }
        );
    }
};

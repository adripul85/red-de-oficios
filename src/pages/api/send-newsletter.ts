import type { APIRoute } from 'astro';
import { Resend } from 'resend';
import { dbAdmin as db } from '../../firebase/admin';

// Initialize Resend
const resend = new Resend(import.meta.env.RESEND_API_KEY);

export const POST: APIRoute = async ({ request }) => {
  try {
    const { subject, markdownBody } = await request.json();

    if (!subject || !markdownBody) {
      return new Response(JSON.stringify({ error: 'Faltan datos' }), { status: 400 });
    }

    // 1. Fetch Subscribers
    const snapshot = await db.collection('newsletter').get();
    if (snapshot.empty) {
      return new Response(JSON.stringify({ message: 'No hay suscriptores', sent: 0, errors: 0 }), { status: 200 });
    }

    const subscribers = [];
    snapshot.forEach(doc => {
      subscribers.push({ id: doc.id, ...doc.data() });
    });

    // 2. Parse Markdown (Basic) - For full MD support we might need a lib, 
    // but the user passed raw MD to the API in the plan. 
    // Wait, the client side parsing was for preview.
    // The user's guide suggested parsing MD in the API "const bodyHTML = marked.parse(bodyMD)". 
    // Since 'marked' is client/server compatible, we can import it or just use simple text if complex.
    // However, including 'marked' here might be tricky if not set up for backend imports in Astro API routes perfectly?
    // Actually, 'marked' is in dependencies. Let's try to import it.

    // NOTE: In Astro API routes with NodeJS adapter, we can import regular npm packages.
    const { marked } = await import('marked');
    const bodyHTML = marked.parse(markdownBody);

    // 3. Send Loop
    let sentCount = 0;
    let errorCount = 0;

    const emailPromises = subscribers.map(async (sub) => {
      // Fallback for name. Assuming 'nombre' field exists or we default. 
      // The user guide used 'user.firstName'. In our DB we likely just have 'email', maybe 'nombre'.
      // Let's check the subscriber object structure in 'newsletter.astro'.
      // It showed: subscribers.push({ id: d.id, ...data }); data has 'email'.
      // Does it have name? The form only asks for email usually. 
      // We will default to 'Vecino' if undefined.

      const name = sub.nombre || 'Vecino';

      // Merge Tags Logic: Replace placeholders in the body
      // We do this on the HTML string. 
      const personalBody = bodyHTML.toString()
        .replace(/\[Nombre del Usuario\]/g, name)
        .replace(/\[Nombre\]/g, name)
        .replace(/\[name\]/gi, name);

      const unsubscribeLink = `${import.meta.env.PUBLIC_BASE_URL}/unsubscribe?email=${encodeURIComponent(sub.email)}`;

      const finalHtml = getNewsletterTemplate(name, personalBody, unsubscribeLink);

      try {
        const data = await resend.emails.send({
          from: 'DeOficios <onboarding@resend.dev>', // Testing domain
          to: sub.email,
          subject: subject,
          html: finalHtml
        });
        if (data.error) throw data.error;
        sentCount++;
        return { email: sub.email, status: 'sent' };
      } catch (error) {
        console.error(`Error sending to ${sub.email}:`, error);
        errorCount++;
        return { email: sub.email, status: 'error', error };
      }
    });

    await Promise.all(emailPromises);

    return new Response(JSON.stringify({
      message: 'Proceso finalizado',
      sent: sentCount,
      errors: errorCount
    }), { status: 200 });

  } catch (error) {
    console.error("Server Error:", error);
    return new Response(JSON.stringify({ error: 'Error del servidor' }), { status: 500 });
  }
};

// HELPER: HTML Template
function getNewsletterTemplate(name, contentHtml, unsubscribe_link) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #F8FAFC; color: #1E293B; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #0F172A; padding: 40px 20px; text-align: center; }
    .content { padding: 40px 30px; line-height: 1.6; }
    .card { background-color: #F1F5F9; border-radius: 24px; padding: 25px; margin-bottom: 25px; border: 1px solid #E2E8F0; }
    .btn { background-color: #0F172A; color: #ffffff !important; padding: 15px 30px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block; }
    .footer { padding: 30px; text-align: center; font-size: 12px; color: #94A3B8; background-color: #F8FAFC; }
    h1 { color: #0F172A; font-size: 24px; margin-top: 0; }
    h4 { color: #0F172A; margin: 0 0 10px 0; font-size: 18px; }
    p { margin: 0 0 15px 0; font-size: 15px; }
    a { color: #0369A1; text-decoration: none; }
    img { max-width: 100%; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="color: #ffffff; margin: 0; letter-spacing: 2px; font-size: 20px;">DEOFICIOS</h2>
      <p style="color: #94A3B8; margin: 5px 0 0 0; font-size: 10px; text-transform: uppercase;">Profesionales de confianza</p>
    </div>

    <div class="content">
      <h1>Hola, <strong>${name}</strong> 👋</h1>
      
      <!-- Injected Content -->
      <div class="user-content">
        ${contentHtml}
      </div>

      <div style="text-align: center; margin-top: 40px;">
        <p style="font-size: 13px; color: #64748B;">¿Necesitás un arreglo urgente?</p>
        <a href="https://reddeoficio.vercel.app/busqueda" class="btn">Encontrar Profesional Ahora</a>
      </div>
    </div>

    <div class="footer">
      <p>Estás recibiendo este correo porque sos parte de la comunidad DeOficios.</p>
      <p>Buenos Aires, Argentina | 2026</p>
      <p><a href="${unsubscribe_link}" style="color: #94A3B8;">Darse de baja</a></p>
    </div>
  </div>
</body>
</html>
    `;
}

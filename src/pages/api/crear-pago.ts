import type { APIRoute } from "astro";
import { MercadoPagoConfig, Preference } from "mercadopago";

// Configurar Cliente
const client = new MercadoPagoConfig({
  accessToken: import.meta.env.MP_ACCESS_TOKEN || "TEST-3723388313099209-010813-b29e24f815b6c621e0eb14af1a87935f-148630764"
});

const BASE_URL = import.meta.env.PUBLIC_BASE_URL || "http://localhost:4321";

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const { title, price, id, userId } = data;

    if (!userId) {
      return new Response(JSON.stringify({ error: "Falta userId" }), { status: 400 });
    }

    const preference = new Preference(client);

    // Crear preferencia SIN auto_return para evitar problemas con localhost
    const preferenceData = {
      items: [
        {
          id: id,
          title: title,
          quantity: 1,
          unit_price: Number(price),
          currency_id: "ARS",
        },
      ],
      back_urls: {
        success: `${BASE_URL}/pago-exitoso`,
        failure: `${BASE_URL}/pago-fallido`,
        pending: `${BASE_URL}/pago-pendiente`,
      },
      // Removido auto_return - causa problemas con localhost en TEST
      external_reference: userId,
      notification_url: `${BASE_URL}/api/webhook`,
    };

    console.log("📦 Creando preferencia MP...");

    const result = await preference.create({ body: preferenceData });

    console.log("✅ Preferencia creada exitosamente:", result.id);

    return new Response(JSON.stringify({ init_point: result.init_point }), { status: 200 });

  } catch (error: any) {
    console.error("❌ Error MP:", error?.message || error);

    return new Response(JSON.stringify({
      error: "Error creating preference",
      details: error?.message || String(error)
    }), { status: 500 });
  }
};
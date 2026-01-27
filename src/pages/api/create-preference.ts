
import { MercadoPagoConfig, Preference } from 'mercadopago';

export const POST = async ({ request }) => {
    try {
        const body = await request.json();
        const { planId, title, price } = body;

        // Validación básica
        if (!title || !price) {
            return new Response(JSON.stringify({ error: 'Faltan datos' }), { status: 400 });
        }

        const client = new MercadoPagoConfig({ accessToken: import.meta.env.MP_ACCESS_TOKEN });
        const preference = new Preference(client);

        const result = await preference.create({
            body: {
                items: [
                    {
                        id: planId || 'generic-plan',
                        title: title,
                        quantity: 1,
                        unit_price: Number(price),
                        currency_id: 'ARS',
                    },
                ],
                back_urls: {
                    success: 'https://reddeoficio.com/pago-exitoso', // Cambiar por URL real
                    failure: 'https://reddeoficio.com/pago-fallido',
                    pending: 'https://reddeoficio.com/pago-pendiente',
                },
                auto_return: 'approved',
            },
        });

        return new Response(JSON.stringify({ init_point: result.init_point }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
            },
        });

    } catch (error) {
        console.error('Error MP:', error);
        return new Response(JSON.stringify({ error: 'Error al crear preferencia' }), { status: 500 });
    }
};

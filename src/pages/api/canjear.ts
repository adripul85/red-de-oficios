import type { APIRoute } from 'astro';
import { dbAdmin, authAdmin } from "../../firebase/admin";
import { Timestamp, FieldValue } from 'firebase-admin/firestore';

export const POST: APIRoute = async ({ request }) => {
    try {
        // 0. Autenticación Robusta (Token ID)
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return new Response(JSON.stringify({ error: 'No autorizado. Falta token.' }), { status: 401 });
        }

        const idToken = authHeader.split("Bearer ")[1];
        let decodedToken;
        try {
            decodedToken = await authAdmin.verifyIdToken(idToken);
        } catch (e) {
            return new Response(JSON.stringify({ error: 'Token inválido o expirado' }), { status: 401 });
        }

        const uid = decodedToken.uid; // UID Seguro

        const data = await request.json();
        const { codigoUsuario } = data; // Ya no confiamos en 'uid' del body

        // 1. Validaciones básicas
        if (!codigoUsuario) return new Response(JSON.stringify({ error: 'Falta el código' }), { status: 400 });

        const codeNormalized = codigoUsuario.trim().toUpperCase();

        // 2. Ejecutar Transacción (Atomicidad garantizada)
        const result = await dbAdmin.runTransaction(async (transaction) => {
            // A. Leer configuración del GiftCard (Universal)
            const configRef = dbAdmin.collection("configuracion").doc("giftcard");
            const configSnap = await transaction.get(configRef);

            if (!configSnap.exists) {
                throw new Error("El sistema de giftcards no está configurado.");
            }

            const configData = configSnap.data();

            if (!configData) throw new Error("Configuración vacía");

            // B. Validar Código
            if (configData.codigo !== codeNormalized) {
                throw new Error("Código inválido o incorrecto.");
            }

            // C. Validar si está activo
            if (!configData.activo) {
                throw new Error("Este código promocional ha expirado.");
            }

            // D. Validar Límite de Usos Global
            if (configData.maxUsos && (configData.usos || 0) >= configData.maxUsos) {
                throw new Error("Este código ha alcanzado el límite máximo de usos.");
            }

            // E. Validar Si el Usuario YA usó este código
            // Usamos una colección auxiliar 'gift_redemptions' con ID compuesto: UID_CODIGO
            const redemptionId = `${uid}_${codeNormalized}`;
            const redemptionRef = dbAdmin.collection("gift_redemptions").doc(redemptionId);
            const redemptionSnap = await transaction.get(redemptionRef);

            if (redemptionSnap.exists) {
                throw new Error("Ya utilizaste este código promocional anteriormente.");
            }

            // F. Leer Usuario para actualizar
            const userRef = dbAdmin.collection("profesionales").doc(uid);
            const userSnap = await transaction.get(userRef);

            if (!userSnap.exists) {
                throw new Error("Usuario profesional no encontrado.");
            }

            // G. Calcular nuevos valores
            const diasValidez = configData.duracionDias || 60;
            const planOtorgado = configData.planOtorgado || 'experto';
            const fechaVencimiento = new Date();
            fechaVencimiento.setDate(fechaVencimiento.getDate() + diasValidez);

            // H. EJECUTAR ESCRIBIR

            // 1. Incrementar contador global
            transaction.update(configRef, {
                usos: (configData.usos || 0) + 1
            });

            // 2. Registrar el canje (Evita doble uso)
            transaction.set(redemptionRef, {
                uid: uid,
                codigo: codeNormalized,
                fecha: Timestamp.now(),
                plan_otorgado: planOtorgado
            });

            // 3. Actualizar Usuario
            transaction.update(userRef, {
                plan: planOtorgado,
                plan_vencimiento: Timestamp.fromDate(fechaVencimiento),
                plan_origen: `gift_card_${codeNormalized}`
            });

            return {
                dias: diasValidez,
                plan: planOtorgado
            };
        });

        return new Response(JSON.stringify({
            success: true,
            message: `¡Felicidades! Se activaron ${result.dias} días de Plan ${result.plan.toUpperCase()}.`
        }), { status: 200 });

    } catch (error: any) {
        console.error("Error API Canje:", error);
        const errorMsg = error.message || 'Error del servidor al procesar el canje';
        // Devolver 400 para errores de lógica (código inválido/usado) y 500 para otros
        const status = errorMsg.includes("inválido") || errorMsg.includes("usado") || errorMsg.includes("expirado") || errorMsg.includes("límite") ? 400 : 500;
        return new Response(JSON.stringify({ error: errorMsg }), { status: status });
    }
}
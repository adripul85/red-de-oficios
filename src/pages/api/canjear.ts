import type { APIRoute } from 'astro';
import { db } from "../../firebase/client"; // Asegúrate que esta ruta apunte a tu config
import {
    collection,
    query,
    where,
    getDocs,
    doc,
    updateDoc,
    getDoc,
    Timestamp
} from "firebase/firestore";

export const POST: APIRoute = async ({ request }) => {
    try {
        const data = await request.json();
        const { codigoUsuario, uid } = data;

        // 1. Validaciones
        if (!codigoUsuario) return new Response(JSON.stringify({ error: 'Falta el código' }), { status: 400 });
        if (!uid) return new Response(JSON.stringify({ error: 'No estás logueado' }), { status: 401 });

        // 2. Buscar en la colección "gift_cards"
        const cardsRef = collection(db, "gift_cards");
        const q = query(cardsRef, where("codigo", "==", codigoUsuario));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return new Response(JSON.stringify({ error: 'Código inválido o no existe' }), { status: 404 });
        }

        const cardDoc = querySnapshot.docs[0];
        const cardData = cardDoc.data();
        const cardId = cardDoc.id;

        // 3. Verificar si ya se usó
        if (cardData.usado === true) {
            return new Response(JSON.stringify({ error: 'Este código ya fue utilizado' }), { status: 409 });
        }

        // 4. Configurar el premio
        const diasValidez = cardData.dias || 60;
        const planOtorgado = cardData.plan || 'experto';

        // Calcular nueva fecha de vencimiento
        const fechaVencimiento = new Date();
        fechaVencimiento.setDate(fechaVencimiento.getDate() + diasValidez);

        // 5. Verificar usuario
        const userRef = doc(db, "profesionales", uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            return new Response(JSON.stringify({ error: 'Usuario no encontrado' }), { status: 404 });
        }

        // 6. Aplicar cambios

        // A. Actualizar usuario (Le damos el plan)
        await updateDoc(userRef, {
            plan: planOtorgado,
            plan_vencimiento: Timestamp.fromDate(fechaVencimiento),
            plan_origen: 'gift_card' // Para saber de dónde vino
        });

        // B. "Quemar" la tarjeta (Marcar como usada)
        const cardRefToUpdate = doc(db, "gift_cards", cardId);
        await updateDoc(cardRefToUpdate, {
            usado: true,
            usado_por: uid,
            fecha_uso: Timestamp.now()
        });

        return new Response(JSON.stringify({
            success: true,
            message: `¡Genial! Activaste ${diasValidez} días de Plan ${planOtorgado.toUpperCase()}.`
        }), { status: 200 });

    } catch (error) {
        console.error("Error API Canje:", error);
        return new Response(JSON.stringify({ error: 'Error del servidor al procesar el canje' }), { status: 500 });
    }
}
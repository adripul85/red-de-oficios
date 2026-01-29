import { messaging, db } from "../firebase/client";
import { getToken } from "firebase/messaging";
import { collection, doc, setDoc, query, where, getDocs } from "firebase/firestore";

/**
 * Solicita permiso y registra el token de FCM
 * @param {string} uid - ID del usuario
 * @param {string} collectionName - Nombre de la colección ('profesionales' o 'clientes')
 */
export async function registerPushNotifications(uid, collectionName = 'profesionales') {
    if (!messaging || !uid) return;

    try {
        console.log(`🔔 [PUSH] Solicitando permiso para ${collectionName}...`);
        const permission = await Notification.requestPermission();

        if (permission === 'granted') {
            console.log("✅ [PUSH] Permiso concedido");

            const registration = await navigator.serviceWorker.ready;
            await new Promise(resolve => setTimeout(resolve, 500));

            const vapidKey = import.meta.env.PUBLIC_FIREBASE_VAPID_KEY;

            const token = await getToken(messaging, {
                vapidKey: vapidKey,
                serviceWorkerRegistration: registration
            });

            if (token) {
                console.log("🎫 [PUSH] Token obtenido:", token);
                await saveTokenToFirestore(uid, collectionName, token);
            } else {
                console.warn("⚠️ [PUSH] No se pudo obtener el token");
            }
        } else {
            console.warn("❌ [PUSH] Permiso denegado");
        }
    } catch (error) {
        console.error("💥 [PUSH] Error en registro:", error);
    }
}

/**
 * Guarda el token en la subcolección fcmTokens del usuario
 * @param {string} uid 
 * @param {string} collectionName
 * @param {string} token 
 */
async function saveTokenToFirestore(uid, collectionName, token) {
    try {
        const tokenRef = doc(db, collectionName, uid, "fcmTokens", token);
        await setDoc(tokenRef, {
            token: token,
            fechaActualizacion: new Date(),
            plataforma: 'web'
        });
        console.log(`💾 [PUSH] Token guardado en ${collectionName}`);
    } catch (error) {
        console.error("❌ [PUSH] Error al guardar token:", error);
    }
}

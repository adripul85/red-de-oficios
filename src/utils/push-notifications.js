import { messaging, db } from "../firebase/client";
import { getToken } from "firebase/messaging";
import { collection, doc, setDoc, query, where, getDocs } from "firebase/firestore";

/**
 * Verifica si ya tenemos permiso
 */
export function checkPushPermission() {
    if (!('Notification' in window)) return 'unsupported';
    return Notification.permission;
}

/**
 * Solicita permiso y registra el token de FCM
 * @param {string} uid - ID del usuario
 * @param {string} collectionName - Nombre de la colección ('profesionales' o 'clientes')
 */
export async function registerPushNotifications(uid, collectionName = 'profesionales') {
    if (!messaging || !uid) return;

    // Si ya está denegado, no insistimos
    if (Notification.permission === 'denied') {
        console.log("🚫 [PUSH] El usuario denegó previamente las notificaciones");
        return;
    }

    try {
        console.log(`🔔 [PUSH] Iniciando registro para ${collectionName}...`);
        const permission = await Notification.requestPermission();

        if (permission === 'granted') {
            const registration = await navigator.serviceWorker.ready;

            // Pequeño delay para asegurar que el SW esté totalmente activo
            await new Promise(resolve => setTimeout(resolve, 1000));

            const vapidKey = import.meta.env.PUBLIC_FIREBASE_VAPID_KEY;

            const token = await getToken(messaging, {
                vapidKey: vapidKey,
                serviceWorkerRegistration: registration
            });

            if (token) {
                await saveTokenToFirestore(uid, collectionName, token);
                console.log("✅ [PUSH] Subscripción exitosa");
            }
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

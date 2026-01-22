
import admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';

// Prevenimos inicializar múltiples veces en desarrollo (Hot Reload)
if (!getApps().length) {
    const projectId = import.meta.env.FIREBASE_PROJECT_ID;
    const clientEmail = import.meta.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = import.meta.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
        console.error("❌ CRÍTICO: Faltan variables de entorno de Firebase Admin SDK");
        console.log("Valores detectados:", {
            projectId: projectId ? "✅ Presente" : "❌ Faltante",
            clientEmail: clientEmail ? "✅ Presente" : "❌ Faltante",
            privateKey: privateKey ? "✅ Presente" : "❌ Faltante",
        });
    }

    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId,
                clientEmail,
                privateKey: privateKey?.replace(/\\n/g, '\n'),
            }),
        });
        console.log("✅ Firebase Admin inicializado correctamente");
    } catch (e) {
        console.error("❌ Error inicializando Firebase Admin SDK:", e);
    }
}

export const dbAdmin = admin.firestore();
export const authAdmin = admin.auth();
export const messagingAdmin = admin.messaging();

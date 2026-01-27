
import admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';

// Prevenimos inicializar múltiples veces en desarrollo (Hot Reload)
if (!getApps().length) {
const privateKey = import.meta.env.FIREBASE_PRIVATE_KEY
        ?.replace(/^"+|"+$/g, '') // Quitar comillas si las hay
        ?.replace(/\\n/g, '\n');  // Reemplazar saltos de línea escapados

    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: import.meta.env.FIREBASE_PROJECT_ID?.trim(),
            clientEmail: import.meta.env.FIREBASE_CLIENT_EMAIL?.trim(),
            privateKey: privateKey,
        }),
    });
}

export const dbAdmin = admin.firestore();
export const authAdmin = admin.auth();
export const messagingAdmin = admin.messaging();

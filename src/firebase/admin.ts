
import admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';

// Prevenimos inicializar múltiples veces en desarrollo (Hot Reload)
if (!getApps().length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: import.meta.env.FIREBASE_PROJECT_ID,
            clientEmail: import.meta.env.FIREBASE_CLIENT_EMAIL,
            // Reemplazamos saltos de línea escapados si vienen desde variables de entorno
            privateKey: import.meta.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
    });
}

export const dbAdmin = admin.firestore();
export const authAdmin = admin.auth();
export const messagingAdmin = admin.messaging();

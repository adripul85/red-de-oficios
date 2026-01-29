// cleanup_stress.js
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const serviceAccount = require("./serviceAccountKey.json");

initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore();

async function cleanupStressData() {
    console.log("🔥 Iniciando limpieza de datos de prueba...");
    let totalDeleted = 0;

    while (true) {
        // Obtenemos un lote de 500
        const snapshot = await db.collection('profesionales')
            .where('is_stress_test', '==', true)
            .limit(500)
            .get();

        if (snapshot.empty) {
            break;
        }

        const batch = db.batch();
        snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });

        await batch.commit();
        totalDeleted += snapshot.size;

        process.stdout.write(`\r🗑️  Borrando... Total eliminados: ${totalDeleted}`);
    }

    console.log(`\n\n✅ ¡Limpieza completada! Se eliminaron ${totalDeleted} perfiles de prueba.`);
}

cleanupStressData().catch(err => {
    console.error("\n❌ Error durante la limpieza:", err);
});

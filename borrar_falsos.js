// borrar_falsos.js
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { createRequire } from "module";

const require = createRequire(import.meta.url);
// Asegúrate de que el nombre del archivo coincida con el que descargaste
const serviceAccount = require("./serviceAccountKey.json");

initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore();

async function borrarFalsos() {
    console.log("🗑️  Buscando perfiles falsos para eliminar...");

    // 1. Buscar solo los documentos marcados como 'is_fake'
    const snapshot = await db.collection('profesionales')
        .where('is_fake', '==', true)
        .get();

    if (snapshot.empty) {
        console.log("✅ No se encontraron perfiles falsos. La base de datos está limpia.");
        return;
    }

    console.log(`⚠️  Se encontraron ${snapshot.size} perfiles falsos. Eliminando...`);

    // 2. Usamos Batches para borrar en grupos de 500 (límite de Firestore)
    let batch = db.batch();
    let counter = 0;

    for (const doc of snapshot.docs) {
        batch.delete(doc.ref);
        counter++;

        if (counter === 500) {
            console.log(`📡  Enviando lote de 500 borrados...`);
            await batch.commit();
            batch = db.batch();
            counter = 0;
        }
    }

    // 3. Confirmar lote final si quedó algo
    if (counter > 0) {
        console.log(`📡  Enviando lote final de ${counter} borrados...`);
        await batch.commit();
    }

    console.log("✨ ¡Limpieza completada! Todos los perfiles falsos fueron borrados.");
    console.log("🛡️  Tus usuarios reales están intactos.");
}

borrarFalsos().catch(console.error);
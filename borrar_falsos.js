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

    // 2. Chunks de 500 (límite de Firestore por batch)
    const docs = snapshot.docs;
    const CHUNK_SIZE = 500;

    for (let i = 0; i < docs.length; i += CHUNK_SIZE) {
        const batch = db.batch();
        const chunk = docs.slice(i, i + CHUNK_SIZE);

        chunk.forEach((doc) => {
            batch.delete(doc.ref);
        });

        await batch.commit();
        console.log(`✅ Lote de ${chunk.length} documentos eliminado (${i + chunk.length}/${docs.length})`);
    }

    console.log("✨ ¡Limpieza completada! Todos los perfiles falsos fueron borrados.");
    console.log("🛡️  Tus usuarios reales están intactos.");
}

borrarFalsos().catch(console.error);
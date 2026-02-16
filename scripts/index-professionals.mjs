
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, updateDoc, writeBatch, query, orderBy } from "firebase/firestore";
import * as dotenv from "dotenv";
dotenv.config();

const firebaseConfig = {
    apiKey: process.env.PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrate() {
    console.log("🚀 Iniciando migración de índices de profesionales...");

    try {
        const q = query(collection(db, "profesionales"), orderBy("createdAt", "asc"));
        const snapshot = await getDocs(q);

        console.log(`🔍 Se encontraron ${snapshot.size} profesionales.`);

        const batch = writeBatch(db);
        let index = 1;

        snapshot.forEach((docSnap) => {
            const proRef = doc(db, "profesionales", docSnap.id);
            batch.update(proRef, { registration_index: index });
            index++;
        });

        // Update global counter
        const configRef = doc(db, "configuracion", "general");
        batch.set(configRef, { last_registration_index: index - 1 }, { merge: true });

        await batch.commit();
        console.log(`✅ Migración completada. Se indexaron ${index - 1} profesionales.`);
    } catch (error) {
        console.error("❌ Error en la migración:", error);
    }
}

migrate();

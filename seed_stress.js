// seed_stress.js
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const serviceAccount = require("./serviceAccountKey.json");

initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore();

// Data arrays for generation
const names = ["Juan", "Carlos", "Maria", "Ana", "Pedro", "Sofia", "Miguel", "Lucia", "Diego", "Valentina", "Martin", "Julia", "Lucas", "Camila", "Fernando", "Facundo", "Agustina", "Enzo", "Micaela", "Roberto"];
const surnames = ["Garcia", "Rodriguez", "Gomez", "Fernandez", "Lopez", "Martinez", "Gonzalez", "Perez", "Sanchez", "Romero", "Diaz", "Alvarez", "Torres", "Ruiz", "Benitez", "Ramirez", "Flores", "Acosta", "Medina", "Herrera"];
const trades = ["Plomero", "Electricista", "Albañil", "Pintor", "Gasista", "Carpintero", "Techista", "Jardinero", "Fumigador", "Cerrajero"];
const planes = ["experto", "profesional", "experto", "profesional"]; // Only indexed ones for the map test

const TOTAL_RECORDS = 62000;
const BATCH_SIZE = 500;

async function seedStress() {
    console.log(`🚀 Starting stress seed of ${TOTAL_RECORDS} records...`);
    let count = 0;

    for (let i = 0; i < TOTAL_RECORDS; i += BATCH_SIZE) {
        const batch = db.batch();
        const currentBatchSize = Math.min(BATCH_SIZE, TOTAL_RECORDS - i);

        for (let j = 0; j < currentBatchSize; j++) {
            const name = names[Math.floor(Math.random() * names.length)];
            const surname = surnames[Math.floor(Math.random() * surnames.length)];
            const trade = trades[Math.floor(Math.random() * trades.length)];
            const plan = planes[Math.floor(Math.random() * planes.length)];

            // Random coords across Argentina (Refined)
            const lat = -24 - Math.random() * 21;
            const lng = -54 - Math.random() * 18;

            const docRef = db.collection('profesionales').doc();
            batch.set(docRef, {
                nombre: `${name} ${surname}`,
                rubro_principal: trade,
                plan: plan,
                is_stress_test: true,
                ubicacion_exacta: {
                    lat: lat,
                    lng: lng
                },
                foto: `https://ui-avatars.com/api/?name=${name}+${surname}&background=random`,
                createdAt: new Date()
            });
        }

        await batch.commit();
        count += currentBatchSize;
        process.stdout.write(`\r✅ Progress: ${count}/${TOTAL_RECORDS} (${Math.round(count / TOTAL_RECORDS * 100)}%)`);
    }

    console.log("\n✨ Finished seeding 62,000 workers!");
}

seedStress().catch(console.error);

// scripts/migrate_propuestas.js
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * MIGRATION SCRIPT: Backfill 'solicitudId' on proposals
 *
 * Usage:
 * 1. Download serviceAccountKey.json from Firebase Console -> Project Settings -> Service Accounts
 * 2. Place it in the root of the project or specify path
 * 3. Run: node scripts/migrate_propuestas.js
 */

const SERVICE_ACCOUNT_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS || './serviceAccountKey.json';

async function migrate() {
    console.log("🚀 Starting Migration: Backfill solicitudId on proposals...");

    let serviceAccount;
    try {
        serviceAccount = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
    } catch (e) {
        console.error(`❌ Error loading service account from ${SERVICE_ACCOUNT_PATH}`);
        console.error("Please ensure you have the serviceAccountKey.json file.");
        process.exit(1);
    }

    initializeApp({
        credential: cert(serviceAccount)
    });

    const db = getFirestore();
    const batchSize = 500;
    let totalUpdated = 0;
    let totalScanned = 0;

    // Iterate over all solicitudes
    const solicitudesSnap = await db.collection('solicitudes').get();
    console.log(`found ${solicitudesSnap.size} solicitudes to scan.`);

    for (const solDoc of solicitudesSnap.docs) {
        const solId = solDoc.id;
        const propuestasRef = solDoc.ref.collection('propuestas');
        const proposalsSnap = await propuestasRef.get();

        if (proposalsSnap.empty) continue;

        const batch = db.batch();
        let batchCount = 0;

        for (const propDoc of proposalsSnap.docs) {
            totalScanned++;
            const data = propDoc.data();

            if (!data.solicitudId) {
                batch.update(propDoc.ref, { solicitudId: solId });
                batchCount++;
                totalUpdated++;
            }
        }

        if (batchCount > 0) {
            await batch.commit();
            console.log(`✅ Updated ${batchCount} proposals for solicitud ${solId}`);
        }
    }

    console.log("\nMigration Complete!");
    console.log(`Total Proposals Scanned: ${totalScanned}`);
    console.log(`Total Proposals Updated: ${totalUpdated}`);
}

migrate().catch(console.error);

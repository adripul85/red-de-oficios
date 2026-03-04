import { dbAdmin, authAdmin } from "../../firebase/admin";

export const prerender = false;

export async function GET() {
    try {
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        console.log("🧹 [CLEANUP] Iniciando limpieza de usuarios inactivos desde:", oneYearAgo.toISOString());

        const collections = ["profesionales", "clientes"];
        let deletedCount = 0;

        for (const colName of collections) {
            const snap = await dbAdmin.collection(colName)
                .where("lastActivity", "<", oneYearAgo)
                .get();

            console.log(`🔍 [CLEANUP] Encontrados ${snap.size} usuarios inactivos en '${colName}'`);

            if (snap.empty) continue;

            const BATCH_SIZE = 500;
            const chunks = [];
            for (let i = 0; i < snap.docs.length; i += BATCH_SIZE) {
                chunks.push(snap.docs.slice(i, i + BATCH_SIZE));
            }

            for (const chunk of chunks) {
                const batch = dbAdmin.batch();
                const uidsToDelete: string[] = [];

                for (const doc of chunk) {
                    batch.delete(doc.ref);
                    uidsToDelete.push(doc.id);
                }

                try {
                    // 1. Eliminar de Firestore en lote
                    await batch.commit();

                    // 2. Eliminar de Auth en lote
                    // authAdmin.deleteUsers accepts up to 1000 UIDs
                    const result = await authAdmin.deleteUsers(uidsToDelete);

                    deletedCount += result.successCount;

                    if (result.failureCount > 0) {
                        console.error(`⚠️ [CLEANUP] ${result.failureCount} fallos al eliminar de Auth en '${colName}'`);
                        result.errors.forEach((err) => {
                            console.error(`Error Auth para usuario ${uidsToDelete[err.index]}:`, err.error);
                        });
                    }

                    console.log(`✅ [CLEANUP] Eliminado lote de ${uidsToDelete.length} usuarios en '${colName}'`);
                } catch (err) {
                    console.error(`❌ [CLEANUP] Error procesando lote en '${colName}':`, err);
                }
            }
        }

        return new Response(JSON.stringify({
            success: true,
            deletedCount,
            message: `Limpieza completada. Se eliminaron ${deletedCount} usuarios.`
        }), { status: 200 });

    } catch (error) {
        console.error("❌ [CLEANUP] Error fatal:", error);
        return new Response(JSON.stringify({ error: "Error interno" }), { status: 500 });
    }
}

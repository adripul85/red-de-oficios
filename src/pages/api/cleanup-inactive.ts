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

            for (const doc of snap.docs) {
                const uid = doc.id;
                try {
                    // 1. Eliminar de Firestore
                    await doc.ref.delete();

                    // 2. Eliminar de Auth
                    await authAdmin.deleteUser(uid);

                    deletedCount++;
                    console.log(`✅ [CLEANUP] Usuario eliminado: ${uid} (${colName})`);
                } catch (err) {
                    console.error(`❌ [CLEANUP] Error eliminando usuario ${uid}:`, err);
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

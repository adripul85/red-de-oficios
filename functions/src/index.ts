/**
 * Búsqueda Semántica con Vertex AI para DeOficios
 * 
 * Este archivo contiene las Cloud Functions para implementar búsqueda semántica
 * usando Vertex AI Text Embeddings.
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onDocumentCreated, onDocumentWritten } from "firebase-functions/v2/firestore";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";

// Inicializar Firebase Admin
initializeApp();
const db = getFirestore();

/**
 * Función para generar embeddings usando Vertex AI
 * NOTA: Esta es una implementación simplificada
 * En producción, usarías @google-cloud/aiplatform
 */
async function generateEmbedding(text: string): Promise<number[]> {
    try {
        // Por ahora, retornamos un embedding simulado
        // TODO: Implementar llamada real a Vertex AI
        logger.info(`Generando embedding para: ${text.substring(0, 50)}...`);

        // Embedding simulado de 768 dimensiones
        const mockEmbedding = Array(768).fill(0).map(() => Math.random());

        return mockEmbedding;
    } catch (error) {
        logger.error("Error generando embedding:", error);
        throw new HttpsError("internal", "Error al generar embedding");
    }
}

/**
 * Calcular similitud de coseno entre dos vectores
 */
function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
        throw new Error("Los vectores deben tener la misma longitud");
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Cloud Function: Generar embedding cuando se crea una solicitud
 * Se ejecuta automáticamente cuando se crea un documento en /solicitudes
 */
export const onSolicitudCreated = onDocumentCreated(
    "solicitudes/{solicitudId}",
    async (event) => {
        const snapshot = event.data;
        if (!snapshot) {
            logger.warn("No data associated with the event");
            return;
        }

        const data = snapshot.data();
        const detalle = data.detalle || "";

        logger.info(`Nueva solicitud creada: ${snapshot.id}`);

        try {
            // Generar embedding del detalle
            const embedding = await generateEmbedding(detalle);

            // Guardar embedding en el documento
            await snapshot.ref.update({
                embedding: embedding,
                embeddingGeneratedAt: new Date(),
            });

            logger.info(`Embedding generado para solicitud ${snapshot.id}`);
        } catch (error) {
            logger.error(`Error procesando solicitud ${snapshot.id}:`, error);
        }
    }
);

/**
 * Cloud Function: Generar embedding para profesionales cuando se actualiza su perfil
 * Se asegura de que los profesionales tengan embeddings para búsqueda semántica
 */
export const onProfesionalWritten = onDocumentWritten(
    "profesionales/{profesionalId}",
    async (event) => {
        if (!event.data) {
            return;
        }

        const afterData = event.data.after.data();
        const beforeData = event.data.before.data();

        // Si el documento fue borrado, no hacemos nada
        if (!afterData) {
            return;
        }

        // Verificar si cambiaron campos relevantes (rubro, descripcion) o si es nuevo
        const isNew = !beforeData;
        const textChanged = isNew ||
            afterData.rubro_principal !== beforeData?.rubro_principal ||
            afterData.descripcion !== beforeData?.descripcion;

        // Si no cambió el texto relevante, evitamos regenerar embedding (y el loop infinito)
        if (!textChanged) {
            return;
        }

        const profileText = `${afterData.rubro_principal || ""} ${afterData.descripcion || ""}`;

        if (!profileText.trim()) {
            return;
        }

        try {
            logger.info(`Generando embedding para profesional ${event.params.profesionalId}`);
            const embedding = await generateEmbedding(profileText);

            // Usamos update para no sobrescribir otros campos si hubo cambios concurrentes
            await event.data.after.ref.update({
                embedding: embedding,
                embeddingGeneratedAt: new Date(),
            });

            logger.info(`Embedding actualizado para profesional ${event.params.profesionalId}`);
        } catch (error) {
            logger.error(`Error generando embedding para profesional ${event.params.profesionalId}:`, error);
        }
    }
);

/**
 * Cloud Function: Búsqueda semántica de solicitudes
 * Llamable desde el frontend
 */
export const semanticSearch = onCall(async (request) => {
    const { query, zona, limit = 10 } = request.data;

    if (!query || typeof query !== "string") {
        throw new HttpsError("invalid-argument", "Query es requerido");
    }

    logger.info(`Búsqueda semántica: "${query}" en zona: ${zona || "todas"}`);

    try {
        // 1. Generar embedding del query
        const queryEmbedding = await generateEmbedding(query);

        // 2. Obtener todas las solicitudes (con filtro de zona si aplica)
        let solicitudesQuery = db.collection("solicitudes");

        if (zona) {
            solicitudesQuery = solicitudesQuery.where("zona", "==", zona) as any;
        }

        const snapshot = await solicitudesQuery.get();

        // 3. Calcular similitud con cada solicitud
        const results: Array<{
            id: string;
            data: any;
            similarity: number;
        }> = [];

        snapshot.forEach((doc) => {
            const data = doc.data();

            // Solo procesar si tiene embedding
            if (data.embedding && Array.isArray(data.embedding)) {
                const similarity = cosineSimilarity(queryEmbedding, data.embedding);

                results.push({
                    id: doc.id,
                    data: {
                        detalle: data.detalle,
                        rubro: data.rubro,
                        zona: data.zona,
                        fecha: data.fecha,
                        clienteNombre: data.clienteNombre,
                    },
                    similarity: similarity,
                });
            }
        });

        // 4. Ordenar por similitud (mayor a menor)
        results.sort((a, b) => b.similarity - a.similarity);

        // 5. Retornar top N resultados
        const topResults = results.slice(0, limit);

        logger.info(`Encontrados ${topResults.length} resultados relevantes`);

        return {
            success: true,
            results: topResults,
            total: results.length,
        };
    } catch (error) {
        logger.error("Error en búsqueda semántica:", error);
        throw new HttpsError("internal", "Error al realizar búsqueda");
    }
});

/**
 * Cloud Function: Buscar profesionales por habilidades semánticas
 * Permite encontrar profesionales basándose en descripción de necesidad
 */
export const findProfessionals = onCall(async (request) => {
    const { description, zona, limit = 5 } = request.data;

    if (!description || typeof description !== "string") {
        throw new HttpsError("invalid-argument", "Description es requerida");
    }

    logger.info(`Buscando profesionales para: "${description}"`);

    try {
        // Generar embedding de la descripción
        const descEmbedding = await generateEmbedding(description);

        // Obtener profesionales
        let results: Array<{
            id: string;
            nombre: string;
            rubro: string;
            similarity: number;
        }> = [];

        try {
            // OPTIMIZACIÓN: Búsqueda Vectorial (Firestore Vector Search)
            // Esto reduce drásticamente las lecturas al traer solo los K vecinos más cercanos
            let vectorQuery: any = db.collection("profesionales");

            if (zona) {
                vectorQuery = vectorQuery.where("zona", "==", zona);
            }

            // Requiere índice de vector en 'embedding'
            const vectorSnapshot = await vectorQuery.findNearest({
                vectorField: "embedding",
                queryVector: descEmbedding,
                limit: limit,
                distanceMeasure: "COSINE",
            }).get();

            logger.info(`Búsqueda vectorial encontró ${vectorSnapshot.size} resultados`);

            vectorSnapshot.forEach((doc: any) => {
                const data = doc.data();
                // Calcular similitud para mostrar (opcional, ya vienen ordenados)
                let similarity = 0;
                if (data.embedding) {
                    similarity = cosineSimilarity(descEmbedding, data.embedding);
                }

                results.push({
                    id: doc.id,
                    nombre: data.nombre || "Sin nombre",
                    rubro: data.rubro_principal || "Sin rubro",
                    similarity: similarity,
                });
            });

        } catch (error) {
            logger.warn("Búsqueda vectorial no disponible (posible falta de índice), usando fallback en memoria:", error);

            // FALLBACK: Comportamiento anterior (Scan completo + Filtro en memoria)
            // Se mantiene por si falla la creación del índice o datos antiguos
            let profQuery = db.collection("profesionales");

            if (zona) {
                profQuery = profQuery.where("zona", "==", zona) as any;
            }

            const snapshot = await profQuery.get();

            snapshot.forEach((doc) => {
                const data = doc.data();

                // Si tiene embedding, usarlo para similitud real
                let similarity = 0;
                if (data.embedding && Array.isArray(data.embedding)) {
                    similarity = cosineSimilarity(descEmbedding, data.embedding);
                } else {
                    // Fallback si no hay embedding: lógica dummy original
                    const profileText = `${data.rubro_principal || ""} ${data.descripcion || ""}`;
                    similarity = profileText.length > 0 ? 0.3 : 0.1;
                }

                results.push({
                    id: doc.id,
                    nombre: data.nombre || "Sin nombre",
                    rubro: data.rubro_principal || "Sin rubro",
                    similarity: similarity,
                });
            });

            // Ordenar por similitud y cortar (solo necesario en fallback)
            results.sort((a, b) => b.similarity - a.similarity);
            results = results.slice(0, limit);
        }

        return {
            success: true,
            results: results,
        };
    } catch (error) {
        logger.error("Error buscando profesionales:", error);
        throw new HttpsError("internal", "Error al buscar profesionales");
    }
});

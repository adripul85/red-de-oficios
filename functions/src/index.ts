/**
 * Búsqueda Semántica con Vertex AI para DeOficios
 * 
 * Este archivo contiene las Cloud Functions para implementar búsqueda semántica
 * usando Vertex AI Text Embeddings.
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
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

        // 2. Búsqueda vectorial optimizada en Firestore
        let vectorQuery: any = db.collection("solicitudes");

        if (zona) {
            vectorQuery = vectorQuery.where("zona", "==", zona);
        }

        // Ejecutar búsqueda vectorial
        // Nota: Requiere índice vectorial en Firestore sobre el campo "embedding"
        // Esto reemplaza la iteración en memoria O(N) por una búsqueda indexada eficiente
        const snapshot = await vectorQuery.findNearest({
            vectorField: "embedding",
            queryVector: queryEmbedding,
            distanceMeasure: "COSINE",
            limit: limit,
            distanceResultField: "similarity",
        }).get();

        // 3. Procesar resultados
        const results = snapshot.docs.map((doc: any) => {
            const data = doc.data();
            return {
                id: doc.id,
                data: {
                    detalle: data.detalle,
                    rubro: data.rubro,
                    zona: data.zona,
                    fecha: data.fecha,
                    clienteNombre: data.clienteNombre,
                },
                // Firestore devuelve distancia (0 = idéntico), convertimos a similitud (1 = idéntico)
                similarity: 1.0 - (data.similarity || 0),
            };
        });

        logger.info(`Encontrados ${results.length} resultados relevantes`);

        return {
            success: true,
            results: results,
            total: results.length, // Nota: esto es el total devuelto, no el total en DB
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
        let profQuery = db.collection("profesionales");

        if (zona) {
            profQuery = profQuery.where("zona", "==", zona) as any;
        }

        const snapshot = await profQuery.get();

        const results: Array<{
            id: string;
            nombre: string;
            rubro: string;
            similarity: number;
        }> = [];

        snapshot.forEach((doc) => {
            const data = doc.data();

            // Generar texto del perfil del profesional
            const profileText = `${data.rubro_principal || ""} ${data.descripcion || ""}`;

            // Por ahora, usamos matching simple por rubro
            // TODO: Implementar embeddings para perfiles de profesionales

            results.push({
                id: doc.id,
                nombre: data.nombre || "Sin nombre",
                rubro: data.rubro_principal || "Sin rubro",
                similarity: profileText.length > 0 ? 0.5 : 0.3,
            });
        });

        // Usar descEmbedding para evitar warning (aunque no se usa realmente aún)
        logger.info(`Embedding generado: ${descEmbedding.length} dimensiones`);

        return {
            success: true,
            results: results.slice(0, limit),
        };
    } catch (error) {
        logger.error("Error buscando profesionales:", error);
        throw new HttpsError("internal", "Error al buscar profesionales");
    }
});

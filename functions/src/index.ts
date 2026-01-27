/**
 * Búsqueda Semántica con Vertex AI para DeOficios
 *
 * Este archivo contiene las Cloud Functions para implementar búsqueda semántica
 * usando Vertex AI Text Embeddings.
 */

import {onCall, HttpsError} from "firebase-functions/v2/https";
import {
  onDocumentCreated,
  onDocumentWritten,
} from "firebase-functions/v2/firestore";
import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";

// Inicializar Firebase Admin
initializeApp();
const db = getFirestore();

/**
 * Función para generar embeddings usando Vertex AI
 * NOTA: Esta es una implementación simplificada
 * En producción, usarías @google-cloud/aiplatform
 * @param {string} text - Texto a convertir en embedding
 * @return {Promise<number[]>} Array de números representando el embedding
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
 * @param {number[]} a - Primer vector
 * @param {number[]} b - Segundo vector
 * @return {number} Valor de similitud entre 0 y 1
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
 * Cloud Function: Generar embedding cuando se crea o actualiza un profesional
 */
export const onProfessionalWritten = onDocumentWritten(
  "profesionales/{professionalId}",
  async (event) => {
    const professionalId = event.params.professionalId;
    const snapshot = event.data;
    if (!snapshot) {
      logger.warn("No data associated with the event");
      return;
    }

    const afterData = snapshot.after.data();
    const beforeData = snapshot.before.data();

    // Si el documento fue borrado, no hacemos nada
    if (!afterData) {
      return;
    }

    // Obtener textos actuales y anteriores
    const newText =
      `${afterData.rubro_principal || ""} ${afterData.descripcion || ""}`;
    const oldText = beforeData ?
      `${beforeData.rubro_principal || ""} ${beforeData.descripcion || ""}` :
      "";

    // Si el texto no cambió y ya existe el embedding, no hacemos nada
    if (newText === oldText && afterData.embedding) {
      return;
    }

    // Si el texto está vacío, no generamos embedding
    if (!newText.trim()) {
      return;
    }

    logger.info(
      `Generando embedding para profesional: ${professionalId}`
    );

    try {
      const embedding = await generateEmbedding(newText);

      await snapshot.after.ref.update({
        embedding: embedding,
        embeddingGeneratedAt: new Date(),
      });

      logger.info(
        `Embedding actualizado para profesional ${professionalId}`
      );
    } catch (error) {
      logger.error(
        `Error actualizando embedding profesional ${professionalId}:`,
        error
      );
    }
  }
);

/**
 * Cloud Function: Búsqueda semántica de solicitudes
 * Llamable desde el frontend
 */
export const semanticSearch = onCall(async (request) => {
  const {query, zona, limit = 10} = request.data;

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
  const {description, zona, limit = 5} = request.data;

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

      // Solo procesar si tiene embedding
      if (data.embedding && Array.isArray(data.embedding)) {
        const similarity = cosineSimilarity(descEmbedding, data.embedding);

        results.push({
          id: doc.id,
          nombre: data.nombre || "Sin nombre",
          rubro: data.rubro_principal || "Sin rubro",
          similarity: similarity,
        });
      }
    });

    // Ordenar por similitud
    results.sort((a, b) => b.similarity - a.similarity);

    return {
      success: true,
      results: results.slice(0, limit),
    };
  } catch (error) {
    logger.error("Error buscando profesionales:", error);
    throw new HttpsError("internal", "Error al buscar profesionales");
  }
});

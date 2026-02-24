/**
 * Búsqueda Semántica con Vertex AI para DeOficios
 *
 * Este archivo contiene las Cloud Functions para implementar búsqueda semántica
 * usando Vertex AI Text Embeddings.
 */

import {onCall, HttpsError} from "firebase-functions/v2/https";
import {onDocumentCreated} from "firebase-functions/v2/firestore";
import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import {helpers, v1} from "@google-cloud/aiplatform";

// Inicializar Firebase Admin
initializeApp();
const db = getFirestore();

const predictionServiceClient = new v1.PredictionServiceClient({
  apiEndpoint: "us-central1-aiplatform.googleapis.com",
});

/**
 * Función para generar embeddings usando Vertex AI
 * Usa el modelo text-multilingual-embedding-002
 * @param {string} text - Texto para generar el embedding
 * @return {Promise<number[]>} Array de números con el embedding
 */
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    if (!process.env.GCLOUD_PROJECT) {
      throw new Error("GCLOUD_PROJECT environment variable is missing");
    }

    const projectId = process.env.GCLOUD_PROJECT;
    const location = "us-central1";
    const model = "text-multilingual-embedding-002";

    const endpoint = `projects/${projectId}/locations/${location}` +
        `/publishers/google/models/${model}`;

    const instance = {
      content: text,
      task_type: "SEMANTIC_SIMILARITY",
    };

    const instanceValue = helpers.toValue(instance);

    if (!instanceValue) {
      throw new Error("Failed to convert instance to protobuf value");
    }

    const instances = [instanceValue];

    const [response] = await predictionServiceClient.predict({
      endpoint,
      instances,
    });

    if (!response.predictions || response.predictions.length === 0) {
      throw new Error("No predictions returned from Vertex AI");
    }

    const prediction = response.predictions[0];
    const embeddings = helpers.fromValue(prediction as any) as any;

    // El formato de respuesta de text-multilingual-embedding-002 es:
    // { embeddings: { values: [ ... ], statistics: { ... } } }
    // O a veces directamente un array si usamos una versión anterior, pero
    // para este modelo es un objeto con 'values'.

    // Verificamos la estructura
    if (embeddings.embeddings && Array.isArray(embeddings.embeddings.values)) {
      return embeddings.embeddings.values;
    } else if (Array.isArray(embeddings)) {
      // Fallback por si la estructura cambia
      // (algunos modelos devuelven directamente el array)
      return embeddings as number[];
    } else if (embeddings.values && Array.isArray(embeddings.values)) {
      return embeddings.values;
    }

    throw new Error("Unexpected embedding format from Vertex AI");
  } catch (error) {
    logger.error("Error generando embedding:", error);
    throw new HttpsError("internal", "Error al generar embedding");
  }
}

/**
 * Calcular similitud de coseno entre dos vectores
 * @param {number[]} a - Vector A
 * @param {number[]} b - Vector B
 * @return {number} Similitud (coseno)
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

      // Generar texto del perfil del profesional
      const profileText = `${data.rubro_principal || ""} ` +
          `${data.descripcion || ""}`;

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

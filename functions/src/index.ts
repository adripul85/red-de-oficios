/**
 * Búsqueda Semántica con Vertex AI para DeOficios
 *
 * Este archivo contiene las Cloud Functions para implementar búsqueda semántica
 * usando Vertex AI Text Embeddings.
 */

import {onCall, HttpsError} from "firebase-functions/v2/https";
import {onDocumentCreated, onDocumentWritten} from
  "firebase-functions/v2/firestore";
import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import {v1, helpers} from "@google-cloud/aiplatform";

// Inicializar Firebase Admin
initializeApp();
const db = getFirestore();

// Cliente de Vertex AI
const aiplatformClient = new v1.PredictionServiceClient({
  apiEndpoint: "us-central1-aiplatform.googleapis.com",
});

/**
 * Función para generar embeddings usando Vertex AI
 * @param {string} text Texto para generar embedding
 * @param {string} taskType Tipo de tarea para el modelo
 * @return {Promise<number[]>} Embedding generado
 */
async function generateEmbedding(
  text: string,
  taskType: "RETRIEVAL_QUERY" | "RETRIEVAL_DOCUMENT" | "SEMANTIC_SIMILARITY"
  = "SEMANTIC_SIMILARITY"
): Promise<number[]> {
  if (!text) return [];

  try {
    const project = process.env.GCLOUD_PROJECT;
    const location = "us-central1";
    // Modelo de embeddings multilingüe
    const endpoint = `projects/${project}/locations/${location}/` +
      "publishers/google/models/text-multilingual-embedding-002";

    const instance = helpers.toValue({
      content: text,
      task_type: taskType,
    });

    const parameter = helpers.toValue({
      outputDimensionality: 768,
    });

    // Cast instance to any to avoid type issues with protobuf
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const instances = [instance] as any[];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [response] = await aiplatformClient.predict({
      endpoint,
      instances,
      parameters: parameter as any,
    });

    const predictions = response.predictions;
    if (!predictions || predictions.length === 0) {
      throw new Error("No predictions returned from Vertex AI");
    }

    const embedding = predictions[0].structValue?.fields?.embeddings?.
      structValue?.fields?.values?.listValue?.values?.map((v: any) =>
        v.numberValue || 0);

    if (!embedding) {
      throw new Error("No embedding found in response");
    }

    return embedding;
  } catch (error) {
    logger.error("Error generando embedding:", error);
    throw new HttpsError("internal", "Error al generar embedding: " + error);
  }
}

/**
 * Calcular similitud de coseno entre dos vectores
 * @param {number[]} a Primer vector
 * @param {number[]} b Segundo vector
 * @return {number} Similitud (0 a 1)
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;

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
      const embedding = await generateEmbedding(detalle, "RETRIEVAL_DOCUMENT");

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
    if (!event.data) return;

    const beforeData = event.data.before.data();
    const afterData = event.data.after.data();

    // Si fue borrado, no hacemos nada
    if (!afterData) return;

    // Verificar cambios en campos relevantes
    const rubroChanged = beforeData?.rubro_principal !==
      afterData.rubro_principal;
    const descChanged = beforeData?.descripcion !== afterData.descripcion;

    // Si no es nuevo y no cambió nada relevante, salir
    if (beforeData && !rubroChanged && !descChanged && afterData.embedding) {
      return;
    }

    const profileText =
      `${afterData.rubro_principal || ""} ${afterData.descripcion || ""}`
        .trim();

    if (!profileText) return;

    logger.info(
      `Generando embedding para profesional: ${event.params.professionalId}`
    );

    try {
      const embedding = await generateEmbedding(
        profileText,
        "RETRIEVAL_DOCUMENT"
      );

      await event.data.after.ref.update({
        embedding: embedding,
        embeddingGeneratedAt: new Date(),
      });
      logger.info(
        `Embedding actualizado profesional ${event.params.professionalId}`
      );
    } catch (error) {
      logger.error(
        `Error generando embedding profesional ${event.params.professionalId}:`,
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
    const queryEmbedding = await generateEmbedding(query, "RETRIEVAL_QUERY");

    // 2. Obtener todas las solicitudes (con filtro de zona si aplica)
    let solicitudesQuery = db.collection("solicitudes");

    if (zona) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      solicitudesQuery = solicitudesQuery.where("zona", "==", zona) as any;
    }

    const snapshot = await solicitudesQuery.get();

    // 3. Calcular similitud con cada solicitud
    const results: Array<{
            id: string;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    const descEmbedding = await generateEmbedding(
      description,
      "RETRIEVAL_QUERY"
    );

    // Obtener profesionales
    let profQuery = db.collection("profesionales");

    if (zona) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

      if (data.embedding && Array.isArray(data.embedding)) {
        const similarity = cosineSimilarity(descEmbedding, data.embedding);

        results.push({
          id: doc.id,
          nombre: data.nombre || "Sin nombre",
          rubro: data.rubro_principal || "Sin rubro",
          similarity: similarity,
        });
      } else {
        results.push({
          id: doc.id,
          nombre: data.nombre || "Sin nombre",
          rubro: data.rubro_principal || "Sin rubro",
          similarity: 0,
        });
      }
    });

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

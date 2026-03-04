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
import {generateEmbedding} from "./vertex-ai";

// Inicializar Firebase Admin
initializeApp();
const db = getFirestore();

/**
 * Calcular similitud de coseno entre dos vectores
 * @param {number[]} a Primer vector
 * @param {number[]} b Segundo vector
 * @return {number} Similitud (coseno del ángulo)
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
 * Cloud Function: Generar embedding para profesionales
 * Se ejecuta automáticamente cuando se crea o actualiza un documento
 * en /profesionales
 */
export const onProfessionalWritten = onDocumentWritten(
  "profesionales/{professionalId}",
  async (event) => {
    const change = event.data;
    if (!change) {
      logger.warn("No data associated with the event");
      return;
    }

    const beforeData = change.before.exists ? change.before.data() : null;
    const afterData = change.after.exists ? change.after.data() : null;

    // Si el documento fue eliminado, no hacemos nada
    if (!afterData) {
      return;
    }

    // Verificar si necesitamos actualizar el embedding
    // Evitar bucles infinitos: si solo cambió el embedding, no hacemos nada
    if (beforeData && afterData) {
      const relevantFields = [
        "descripcion", "rubro_principal", "zona", "nombre",
      ];
      const hasRelevantChanges = relevantFields.some(
        (field) => JSON.stringify(beforeData[field]) !==
                   JSON.stringify(afterData[field])
      );

      // Si no cambiaron campos relevantes, salir
      if (!hasRelevantChanges) {
        // Chequear explícitamente si embedding cambió para confirmar update
        if (JSON.stringify(beforeData.embedding) !==
            JSON.stringify(afterData.embedding)) {
          logger.info(
            "Embedding actualizado para profesional " +
            `${event.params.professionalId}, ignorando evento.`
          );
          return;
        }
        // Si no cambió nada relevante ni el embedding, igual salimos
        return;
      }
    }

    const textToEmbed = [
      afterData.rubro_principal || "",
      afterData.descripcion || "",
      afterData.zona || "",
    ].filter(Boolean).join(" ");

    if (!textToEmbed.trim()) {
      logger.warn(
        `Profesional ${event.params.professionalId} ` +
        "sin texto suficiente para embedding"
      );
      return;
    }

    logger.info(
      `Generando embedding para profesional: ${event.params.professionalId}`
    );

    try {
      const embedding = await generateEmbedding(
        textToEmbed, "RETRIEVAL_DOCUMENT"
      );

      await change.after.ref.update({
        embedding: embedding,
        embeddingGeneratedAt: new Date(),
      });

      logger.info(
        `Embedding guardado para profesional ${event.params.professionalId}`
      );
    } catch (error) {
      logger.error(
        "Error generando embedding para profesional " +
        `${event.params.professionalId}:`, error
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
      description, "RETRIEVAL_QUERY"
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

      // Usar embeddings si existen
      if (data.embedding && Array.isArray(data.embedding)) {
        const similarity = cosineSimilarity(descEmbedding, data.embedding);
        results.push({
          id: doc.id,
          nombre: data.nombre || "Sin nombre",
          rubro: data.rubro_principal || "Sin rubro",
          similarity: similarity,
        });
      } else {
        // Fallback: Matching simple si no hay embedding
        // Esto es útil durante la migración o si falló la generación
        const profileText =
          `${data.rubro_principal || ""} ${data.descripcion || ""}`;
        const terms = description.toLowerCase().split(" ");
        const matches = terms.some((term: string) =>
          profileText.toLowerCase().includes(term));

        if (matches) {
          results.push({
            id: doc.id,
            nombre: data.nombre || "Sin nombre",
            rubro: data.rubro_principal || "Sin rubro",
            similarity: 0.1, // Baja similitud pero incluido
          });
        }
      }
    });

    // Ordenar por similitud
    results.sort((a, b) => b.similarity - a.similarity);

    logger.info(`Encontrados ${results.length} profesionales`);

    return {
      success: true,
      results: results.slice(0, limit),
    };
  } catch (error) {
    logger.error("Error buscando profesionales:", error);
    throw new HttpsError("internal", "Error al buscar profesionales");
  }
});

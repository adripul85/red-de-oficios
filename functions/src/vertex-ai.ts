import {helpers, v1} from "@google-cloud/aiplatform";
import * as logger from "firebase-functions/logger";

const project = process.env.GCLOUD_PROJECT || "reddeoficio";
const location = "us-central1";
const publisher = "google";
const model = "text-multilingual-embedding-002";

const clientOptions = {
  apiEndpoint: `${location}-aiplatform.googleapis.com`,
};

const predictionServiceClient = new v1.PredictionServiceClient(clientOptions);

export type TaskType = "RETRIEVAL_QUERY" | "RETRIEVAL_DOCUMENT";

/**
 * Generates an embedding for the given text using Vertex AI.
 * @param {string} text The text to embed.
 * @param {TaskType} taskType The type of task (QUERY or DOCUMENT).
 * @return {Promise<number[]>} The generated embedding.
 */
export async function generateEmbedding(
  text: string,
  taskType: TaskType = "RETRIEVAL_DOCUMENT"
): Promise<number[]> {
  const endpoint = `projects/${project}/locations/${location}/publishers/` +
    `${publisher}/models/${model}`;

  const instance = {
    content: text,
    task_type: taskType,
  };

  const instanceValue = helpers.toValue(instance);

  if (!instanceValue) {
    throw new Error("Failed to convert instance to protobuf Value");
  }

  const instances = [instanceValue];

  const request = {
    endpoint,
    instances,
  };

  try {
    const [response] = await predictionServiceClient.predict(request);
    const predictions = response.predictions;

    if (!predictions || predictions.length === 0) {
      throw new Error("No predictions returned");
    }

    const embeddingValue = predictions[0].structValue?.fields?.embeddings
      ?.structValue?.fields?.values?.listValue?.values;

    if (!embeddingValue) {
      throw new Error("No embedding found in prediction");
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return embeddingValue.map((v: any) => v.numberValue || 0);
  } catch (error) {
    logger.error("Error generating embedding:", error);
    throw error;
  }
}

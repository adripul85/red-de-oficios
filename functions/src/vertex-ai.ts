import {helpers, v1} from "@google-cloud/aiplatform";
import * as logger from "firebase-functions/logger";
import {HttpsError} from "firebase-functions/v2/https";

const clientOptions = {
  apiEndpoint: "us-central1-aiplatform.googleapis.com",
};

const defaultClient = new v1.PredictionServiceClient(clientOptions);

/**
 * Generates an embedding for the given text using Vertex AI.
 * @param {string} text The text to generate an embedding for.
 * @param {string} taskType The task type (RETRIEVAL_DOCUMENT or
 * RETRIEVAL_QUERY).
 * @param {v1.PredictionServiceClient} [client] Optional PredictionServiceClient
 * to use (for testing).
 * @return {Promise<number[]>} A promise that resolves to the embedding vector.
 */
export async function generateEmbedding(
  text: string,
  taskType = "RETRIEVAL_DOCUMENT",
  client: v1.PredictionServiceClient = defaultClient
): Promise<number[]> {
  const project = process.env.GCLOUD_PROJECT;
  const location = "us-central1";
  const publisher = "google";
  const model = "text-multilingual-embedding-002";

  if (!project) {
    logger.error("GCLOUD_PROJECT environment variable not set.");
    throw new HttpsError("internal", "Configuration error");
  }

  const endpoint = `projects/${project}/locations/${location}` +
    `/publishers/${publisher}/models/${model}`;

  const instanceValue = helpers.toValue({
    content: text,
    task_type: taskType,
  });

  if (!instanceValue) {
    throw new Error("Failed to create instance value");
  }

  const request = {
    endpoint,
    instances: [instanceValue],
  };

  try {
    const [response] = await client.predict(request as any);

    if (!response.predictions || response.predictions.length === 0) {
      throw new Error("No predictions returned from Vertex AI");
    }

    const prediction = response.predictions[0];
    const predictionObj = helpers.fromValue(prediction as any);
    const pred: any = predictionObj;

    // Handle different response structures
    const values = pred.embeddings?.values || pred.values;

    if (!values || !Array.isArray(values)) {
      logger.error("Unexpected response structure:",
        JSON.stringify(predictionObj));
      throw new Error("Invalid embedding format in response");
    }

    return values as number[];
  } catch (error) {
    logger.error("Error generating embedding:", error);
    throw new HttpsError("internal", "Error generating embedding");
  }
}

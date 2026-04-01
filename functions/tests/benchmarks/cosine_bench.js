// functions/tests/benchmarks/cosine_bench.js

/**
 * Benchmark for Cosine Similarity Calculation
 * Simulates the CPU cost of calculating cosine similarity for 10,000 vectors
 * of 768 dimensions.
 */

const N = 10000; // Number of documents
const D = 768; // Dimensions

console.log(`Generating ${N} mock documents with ${D}-dimensional embeddings...`);

// Generate random vectors
const queryEmbedding = Array(D).fill(0).map(() => Math.random());
const documents = [];
for (let i = 0; i < N; i++) {
  documents.push({
    id: `doc-${i}`,
    embedding: Array(D).fill(0).map(() => Math.random()),
    data: { some: 'data' }
  });
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a, b) {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
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

console.log('Starting benchmark...');
const start = process.hrtime();

// Simulate the current implementation
const results = [];
for (const doc of documents) {
  const similarity = cosineSimilarity(queryEmbedding, doc.embedding);
  results.push({
    id: doc.id,
    similarity: similarity
  });
}

// Sort results
results.sort((a, b) => b.similarity - a.similarity);

// Take top 10
const topResults = results.slice(0, 10);

const end = process.hrtime(start);
const timeInMs = (end[0] * 1000 + end[1] / 1e6).toFixed(3);

console.log(`Benchmark completed in ${timeInMs}ms`);
console.log(`Top result similarity: ${topResults[0].similarity}`);

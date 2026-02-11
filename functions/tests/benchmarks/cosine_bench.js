
const { performance } = require('perf_hooks');

// Simulate the cosineSimilarity function from src/index.ts
function cosineSimilarity(a, b) {
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

// Optimized version (precompute normA)
function cosineSimilarityOptimized(a, b, normA) {
    let dotProduct = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normB += b[i] * b[i];
    }

    return dotProduct / (normA * Math.sqrt(normB));
}

// Optimized version assuming normalized vectors (dot product only)
function cosineSimilarityNormalized(a, b) {
    let dotProduct = 0;
    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
    }
    return dotProduct;
}

// Generate mock data
const DIM = 768;
const NUM_DOCS = 5000;

console.log(`Generating ${NUM_DOCS} mock documents with ${DIM}-dimensional vectors...`);
const queryEmbedding = Array(DIM).fill(0).map(() => Math.random());
const docs = Array(NUM_DOCS).fill(0).map((_, i) => ({
    id: `doc_${i}`,
    embedding: Array(DIM).fill(0).map(() => Math.random())
}));

console.log('Running benchmark...');

// 1. Baseline
const startBaseline = performance.now();
for (const doc of docs) {
    cosineSimilarity(queryEmbedding, doc.embedding);
}
const endBaseline = performance.now();
const timeBaseline = endBaseline - startBaseline;
console.log(`Baseline (Naive Loop): ${timeBaseline.toFixed(2)} ms`);

// 2. Precompute Norm A
let normA = 0;
for (let x of queryEmbedding) normA += x * x;
normA = Math.sqrt(normA);

const startOpt1 = performance.now();
for (const doc of docs) {
    cosineSimilarityOptimized(queryEmbedding, doc.embedding, normA);
}
const endOpt1 = performance.now();
const timeOpt1 = endOpt1 - startOpt1;
console.log(`Optimization 1 (Precompute Query Norm): ${timeOpt1.toFixed(2)} ms`);

// 3. Assume Normalized (Dot Product)
// Normalize vectors first to simulate real scenario
const normalizedQuery = queryEmbedding.map(x => x / normA);
const normalizedDocs = docs.map(doc => {
    let norm = 0;
    for (let x of doc.embedding) norm += x * x;
    norm = Math.sqrt(norm);
    return { ...doc, embedding: doc.embedding.map(x => x / norm) };
});

const startOpt2 = performance.now();
for (const doc of normalizedDocs) {
    cosineSimilarityNormalized(normalizedQuery, doc.embedding);
}
const endOpt2 = performance.now();
const timeOpt2 = endOpt2 - startOpt2;
console.log(`Optimization 2 (Dot Product on Normalized): ${timeOpt2.toFixed(2)} ms`);

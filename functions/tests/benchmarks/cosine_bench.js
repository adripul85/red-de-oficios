const { performance } = require('perf_hooks');

// Copied from functions/src/index.ts
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

function runBenchmark(numDocs) {
    console.log(`\nBenchmarking for N=${numDocs}...`);

    // Setup
    const DIMENSIONS = 768;
    const queryVector = Array(DIMENSIONS).fill(0).map(() => Math.random());
    const docs = [];

    // Generate mock docs
    for (let i = 0; i < numDocs; i++) {
        docs.push({
            id: `doc_${i}`,
            data: {
                embedding: Array(DIMENSIONS).fill(0).map(() => Math.random())
            }
        });
    }

    const start = performance.now();

    // Simulate the logic in index.ts: iterate, calculate similarity, push, sort, slice
    const results = [];
    docs.forEach(doc => {
        const similarity = cosineSimilarity(queryVector, doc.data.embedding);
        results.push({
            id: doc.id,
            similarity: similarity
        });
    });

    results.sort((a, b) => b.similarity - a.similarity);
    const topResults = results.slice(0, 10);

    const end = performance.now();
    const duration = (end - start).toFixed(2);

    console.log(`Processed ${numDocs} vectors in ${duration}ms`);
    console.log(`Performance: ${(numDocs / (end - start)).toFixed(2)} ops/ms`);
}

// Run benchmarks
runBenchmark(100);
runBenchmark(1000);
runBenchmark(5000);
runBenchmark(10000);
// runBenchmark(100000); // Uncomment for larger scale test if needed

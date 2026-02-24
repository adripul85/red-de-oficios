// tests/benchmark_solicitudes.js

// Mock setup for simulation
const SOLICITUDES_COUNT = 20;
const PROPOSALS_PER_SOLICITUD = 5;
const NETWORK_LATENCY = 50; // ms
const MAX_CONCURRENT_REQUESTS = 6; // Browser limit simulation

// Mock Data
const solicitudes = Array.from({ length: SOLICITUDES_COUNT }, (_, i) => ({
    id: `sol_${i}`,
    data: { title: `Solicitud ${i}` }
}));

const proposals = {};
solicitudes.forEach(s => {
    proposals[s.id] = Array.from({ length: PROPOSALS_PER_SOLICITUD }, (_, i) => ({
        id: `prop_${s.id}_${i}`,
        data: {
            price: 100 * i,
            solicitudId: s.id // This field is key for optimization
        }
    }));
});

// Mock Firestore functions
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

let activeRequests = 0;
const requestQueue = [];

const processQueue = async () => {
    if (activeRequests < MAX_CONCURRENT_REQUESTS && requestQueue.length > 0) {
        activeRequests++;
        const { resolve, ms } = requestQueue.shift();
        await sleep(ms);
        activeRequests--;
        resolve();
        processQueue(); // Check for more
    }
};

const mockNetworkRequest = (ms) => {
    return new Promise((resolve) => {
        requestQueue.push({ resolve, ms });
        processQueue();
    });
};

// --- N+1 Scenario ---
async function fetchLegacy() {
    console.log("--- Starting Legacy N+1 Fetch ---");
    const start = Date.now();

    // 1. Fetch Solicitudes (1 request)
    await mockNetworkRequest(NETWORK_LATENCY);
    const fetchedSolicitudes = solicitudes;

    // 2. Fetch Proposals for each (N requests)
    const results = await Promise.all(fetchedSolicitudes.map(async (sol) => {
        await mockNetworkRequest(NETWORK_LATENCY);
        // Simulate finding proposals for this sol
        const props = proposals[sol.id];
        return { ...sol, proposals: props };
    }));

    const end = Date.now();
    console.log(`Legacy Fetch Time: ${end - start}ms`);
    console.log(`Total Requests: ${1 + SOLICITUDES_COUNT}`);
    return results;
}

// --- Optimized Scenario ---
async function fetchOptimized() {
    console.log("--- Starting Optimized Fetch ---");
    const start = Date.now();

    // 1. Fetch Solicitudes (1 request)
    await mockNetworkRequest(NETWORK_LATENCY);
    const fetchedSolicitudes = solicitudes;
    const solIds = fetchedSolicitudes.map(s => s.id);

    // 2. Fetch Proposals with collectionGroup + IN query (1 request)
    // We assume IDs fit in one chunk for simplicity (20 < 30)
    await mockNetworkRequest(NETWORK_LATENCY);

    // Simulate filtering in memory (which Firestore does efficiently)
    const allProposals = Object.values(proposals).flat();
    const filteredProposals = allProposals.filter(p => solIds.includes(p.data.solicitudId));

    // Map back
    const results = fetchedSolicitudes.map(sol => {
        const props = filteredProposals.filter(p => p.data.solicitudId === sol.id);
        return { ...sol, proposals: props };
    });

    const end = Date.now();
    console.log(`Optimized Fetch Time: ${end - start}ms`);
    console.log(`Total Requests: 2`);
    return results;
}

// Run Benchmark
(async () => {
    console.log(`Configuration: ${SOLICITUDES_COUNT} requests, ${PROPOSALS_PER_SOLICITUD} proposals each.`);
    console.log(`Network Latency: ${NETWORK_LATENCY}ms, Max Concurrent: ${MAX_CONCURRENT_REQUESTS}\n`);

    await fetchLegacy();
    console.log("\n");
    await fetchOptimized();
})();

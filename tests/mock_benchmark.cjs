
const assert = require('assert');

// --- MOCK FIRESTORE ---
const db = {}; // Mock DB Object

const MOCK_DATA = [];

// Populate Mock Data
function resetMockData(distribution) {
    MOCK_DATA.length = 0;
    // distribution: { experto: 10, impulso: 10, ... }
    for (const [plan, count] of Object.entries(distribution)) {
        for (let i = 0; i < count; i++) {
            MOCK_DATA.push({
                id: `${plan}-${i}`,
                data: () => ({ plan, nombre: `${plan} user ${i}`, promedio: 5.0 })
            });
        }
    }
    // Shuffle
    for (let i = MOCK_DATA.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [MOCK_DATA[i], MOCK_DATA[j]] = [MOCK_DATA[j], MOCK_DATA[i]];
    }
}

// Mock Firestore Functions
let readCount = 0;

function collection(db, name) {
    return { type: 'collection', name };
}

function where(field, op, val) {
    return { type: 'where', field, op, val };
}

function limit(n) {
    return { type: 'limit', n };
}

function orderBy(field, dir) {
    return { type: 'orderBy', field, dir };
}

function query(coll, ...constraints) {
    return { coll, constraints };
}

async function getDocs(queryObj) {
    let results = [...MOCK_DATA];

    for (const c of queryObj.constraints) {
        if (c.type === 'where') {
            if (c.op === 'in') {
                results = results.filter(doc => c.val.includes(doc.data().plan));
            } else if (c.op === '==') {
                results = results.filter(doc => doc.data()[c.field] === c.val);
            }
        }
    }

    // Apply Sort (Simple mock, supports only plan sort or no sort)
    // In reality, Firestore sorts by ID if no orderBy. Our mock is random/shuffled.

    // Apply Limit
    for (const c of queryObj.constraints) {
        if (c.type === 'limit') {
            results = results.slice(0, c.n);
        }
    }

    // COUNT READS
    readCount += results.length;

    return {
        docs: results,
        size: results.length
    };
}

// --- IMPLEMENTATIONS ---

async function runCurrentImplementation() {
    readCount = 0;
    // Current Code Logic
    // const qDestacados = query(collection(db, "profesionales"), where("plan", "in", ["experto", "semestral", "impulso", "mensual"]), limit(20));
    const qDestacados = query(
        collection(db, "profesionales"),
        where("plan", "in", ["experto", "semestral", "impulso", "mensual"]),
        limit(20)
    );

    const snapDest = await getDocs(qDestacados);

    // Processing
    let destacados = snapDest.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    destacados.sort((a, b) => {
        const weightA = a.plan === "experto" || a.plan === "semestral" ? 2 : 1;
        const weightB = b.plan === "experto" || b.plan === "semestral" ? 2 : 1;
        return weightB - weightA;
    });
    destacados = destacados.slice(0, 4);

    return { count: readCount, results: destacados };
}

async function runOptimizedImplementation() {
    readCount = 0;
    // Optimized Logic
    const qDestacadosHigh = query(
        collection(db, "profesionales"),
        where("plan", "in", ["experto", "semestral"]),
        limit(4)
    );
    const qDestacadosLow = query(
        collection(db, "profesionales"),
        where("plan", "in", ["impulso", "mensual"]),
        limit(4)
    );

    // Run Parallel
    const [snapHigh, snapLow] = await Promise.all([
        getDocs(qDestacadosHigh),
        getDocs(qDestacadosLow)
    ]);

    let destacados = [...snapHigh.docs, ...snapLow.docs].map((doc) => ({ id: doc.id, ...doc.data() }));
    destacados = destacados.slice(0, 4);

    return { count: readCount, results: destacados };
}

// --- RUNNER ---

async function run() {
    console.log("=== PERFORMANCE BENCHMARK ===");

    // Scenario 1: Mixed (Many Experts)
    resetMockData({ experto: 50, impulso: 50 });
    console.log("\nScenario 1: Mixed (Many Experts)");
    let current = await runCurrentImplementation();
    let optimized = await runOptimizedImplementation();
    console.log(`Current Reads:   ${current.count}`);
    console.log(`Optimized Reads: ${optimized.count}`);
    console.log(`Improvement:     ${current.count - optimized.count} reads saved (${Math.round((current.count - optimized.count)/current.count*100)}%)`);

    // Scenario 2: Only Impulso (No Experts)
    resetMockData({ experto: 0, impulso: 50 });
    console.log("\nScenario 2: Only Impulso (No Experts)");
    current = await runCurrentImplementation();
    optimized = await runOptimizedImplementation();
    console.log(`Current Reads:   ${current.count}`);
    console.log(`Optimized Reads: ${optimized.count}`);
    console.log(`Improvement:     ${current.count - optimized.count} reads saved`);

    // Scenario 3: Few Experts (2 Experts, 50 Impulso)
    resetMockData({ experto: 2, impulso: 50 });
    console.log("\nScenario 3: Few Experts (2 Experts)");
    current = await runCurrentImplementation();
    optimized = await runOptimizedImplementation();
    console.log(`Current Reads:   ${current.count}`);
    console.log(`Optimized Reads: ${optimized.count}`);

    // Verify Logic (Correctness)
    // In Scenario 3, we expect 2 Experts and 2 Impulsos in result.
    const plans = optimized.results.map(r => r.plan);
    console.log(`Result Plans: ${plans.join(', ')}`);
    const expertCount = plans.filter(p => p === 'experto').length;
    if (expertCount !== 2) {
        console.error(`❌ LOGIC ERROR: Expected 2 experts, got ${expertCount}`);
        process.exit(1);
    }
    if (optimized.results.length !== 4) {
         console.error(`❌ LOGIC ERROR: Expected 4 results, got ${optimized.results.length}`);
         process.exit(1);
    }
    console.log("✅ Logic Correctness Verified");

}

run();

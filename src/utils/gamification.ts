
export const LEVELS = [
    { name: "Novato 🌱", threshold: 0, benefits: "Acceso básico" },
    { name: "Aprendiz 🔨", threshold: 1000, benefits: "Badge en perfil" },
    { name: "Profesional 👷", threshold: 3500, benefits: "+5% Boost en Ranking" },
    { name: "Experto 🦁", threshold: 8000, benefits: "+10% Boost + Descuento 10%" },
    { name: "Maestro 👑", threshold: 15000, benefits: "Destacado Home + Descuento 20%" }
];

export const XP_TABLE = {
    VERIFY_IDENTITY: 1000,
    COMPLETE_PROFILE: 500,
    REVIEW_5_STAR: 150,
    REVIEW_4_STAR: 50,
    PLAN_MONTHLY: 500,
    PLAN_SEMESTER: 3000,
    REPLY_BUDGET: 10
};

export function calculateLevel(xp: number) {
    let currentLevel = LEVELS[0];
    let nextLevel = LEVELS[1];

    for (let i = 0; i < LEVELS.length; i++) {
        if (xp >= LEVELS[i].threshold) {
            currentLevel = LEVELS[i];
            nextLevel = LEVELS[i + 1] || null;
        }
    }

    return { current: currentLevel, next: nextLevel };
}

export function getLevelProgress(xp: number) {
    const { current, next } = calculateLevel(xp);
    if (!next) return 100; // Max level reached

    const range = next.threshold - current.threshold;
    const progress = xp - current.threshold;
    return Math.min(Math.round((progress / range) * 100), 100);
}

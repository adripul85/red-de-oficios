export const LEVELS = [
    { name: "Novato 🌱", threshold: 0, benefits: "Acceso básico" },
    { name: "Aprendiz 🔨", threshold: 50, benefits: "Badge en perfil" },
    { name: "Iniciado 🛠️", threshold: 150, benefits: "Desbloquea estadísticas" },
    { name: "Profesional 👷", threshold: 400, benefits: "+5% Boost en Ranking" },
    { name: "Especialista 🥈", threshold: 750, benefits: "Descuento 5% en créditos" },
    { name: "Experto 🦁", threshold: 1200, benefits: "+10% Boost + Descuento 10%" },
    { name: "Socio 🤝", threshold: 1800, benefits: "Badge VIP + Descuento 15%" },
    { name: "Maestro 👑", threshold: 2500, benefits: "Destacado Home + Descuento 20%" },
    { name: "Líder 💎", threshold: 4000, benefits: "Soporte Prioritario + Descuento 25%" },
    { name: "Leyenda 🔥", threshold: 6000, benefits: "Comisión 0% + Destacado Premium" }
];

export const PUNTOS_RECOMPENSA = {
    VERIFICAR_EMAIL: 1,
    PRIMERA_FOTO_PORTFOLIO: 2,
    PERFIL_COMPLETO: 2, // Descripción + Datos básicos
};

export const PUNTAJE_MINIMO = 0;

/**
 * Calcula los puntos ganados basados en las acciones realizadas
 * @param userData El objeto del usuario de Firestore
 */
export const calcularPuntosIniciales = (userData: any): number => {
    return 0; // Se inicia en 0.0 puntos por requerimiento
};

/**
 * Función para restar puntos (Denuncias o Cancelaciones)
 */
export const penalizarPuntos = (puntosActuales: number, penalizacion: number): number => {
    const resultado = puntosActuales - penalizacion;
    return resultado < PUNTAJE_MINIMO ? PUNTAJE_MINIMO : resultado;
};

/**
 * Función para recompensar una acción del profesional
 * @param userId ID del profesional
 * @param puntos Puntos a sumar
 */
export const recompensarAccion = async (userId: string, puntos: number) => {
    try {
        const { db } = await import('../firebase/client');
        const { doc, updateDoc, increment } = await import('firebase/firestore');

        const userRef = doc(db, "profesionales", userId);
        await updateDoc(userRef, {
            puntos: increment(puntos)
        });

        console.log(`⭐ [GAMIFICATION] +${puntos} puntos para ${userId}`);
        return true;
    } catch (e) {
        console.error("❌ [GAMIFICATION] Error penalizando/recompensando:", e);
        return false;
    }
};

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

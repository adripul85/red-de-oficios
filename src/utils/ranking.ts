
import { calculateLevel } from './gamification';

/**
 * Calcula el Ranking Score (0 - 1000) basado en Meritocracia.
 * 
 * Fórmula:
 * 1. Promedio Estrellas (Max 600)
 * 2. Cantidad Reseñas (Max 200 - Logarítmico)
 * 3. Nivel Gamificación (Max 100)
 * 4. Verificación/Perfil (Max 100)
 */
export function calculateRankingScore(proData: any) {
    let score = 0;

    // 1. PROMEDIO ESTRELLAS (Max 600)
    // 5.0 = 600 | 4.0 = 400 | 3.0 = 200 | <3 = 0
    const promedio = proData.promedio || 0;
    if (promedio >= 3) {
        score += (promedio / 5) * 600;
    }

    // 2. CANTIDAD RESEÑAS (Max 200)
    // Logarítmico para premiar las primeras reseñas más que las últimas
    // 1 reseña ~ 40pts, 10 reseñas ~ 80pts, 100 reseñas ~ 160pts
    const votos = proData.total_votos || 0;
    if (votos > 0) {
        const votosScore = Math.min(Math.log10(votos) * 100, 200);
        score += votosScore;
    }

    // 3. NIVEL GAMIFICACIÓN (Max 100)
    // Usamos el XP real si existe, sino un cálculo aproximado
    const xp = proData.experiencePoints || 0;
    const { current } = calculateLevel(xp);

    switch (current.name.split(' ')[0]) { // "Maestro", "Experto", etc
        case "Maestro": score += 100; break;
        case "Experto": score += 75; break;
        case "Profesional": score += 50; break;
        case "Aprendiz": score += 25; break;
        default: score += 0;
    }

    // 4. VERIFICACIÓN & PERFIL (Max 100)
    if (proData.verificado) score += 50;
    if (proData.foto && !proData.foto.includes("ui-avatars")) score += 30;
    if (proData.ubicacion_exacta) score += 20;

    return Math.round(score);
}

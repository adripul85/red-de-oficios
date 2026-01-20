/**
 * Cliente para llamar a las Cloud Functions de búsqueda semántica
 * Usar desde el frontend de Astro
 */

import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "./client"; // Tu configuración de Firebase

const functions = getFunctions(app);

/**
 * Interfaz para resultados de búsqueda semántica
 */
export interface SemanticSearchResult {
    id: string;
    data: {
        detalle: string;
        rubro: string;
        zona: string;
        fecha: any;
        clienteNombre: string;
    };
    similarity: number;
}

/**
 * Realizar búsqueda semántica de solicitudes
 * 
 * @param query - Descripción del problema o necesidad en lenguaje natural
 * @param zona - Zona geográfica (opcional)
 * @param limit - Número máximo de resultados (default: 10)
 * @returns Promise con los resultados ordenados por relevancia
 * 
 * @example
 * ```typescript
 * const results = await searchSolicitudes("tengo humedad en la pared", "CABA");
 * console.log(results); // [{id: "...", data: {...}, similarity: 0.85}, ...]
 * ```
 */
export async function searchSolicitudes(
    query: string,
    zona?: string,
    limit = 10
): Promise<SemanticSearchResult[]> {
    try {
        const semanticSearch = httpsCallable(functions, "semanticSearch");

        const result = await semanticSearch({
            query,
            zona,
            limit,
        });

        const data = result.data as {
            success: boolean;
            results: SemanticSearchResult[];
            total: number;
        };

        if (!data.success) {
            throw new Error("Error en búsqueda semántica");
        }

        return data.results;
    } catch (error) {
        console.error("Error llamando a semanticSearch:", error);
        throw error;
    }
}

/**
 * Buscar profesionales basándose en descripción de necesidad
 * 
 * @param description - Descripción del trabajo o problema
 * @param zona - Zona geográfica (opcional)
 * @param limit - Número máximo de resultados (default: 5)
 * @returns Promise con profesionales relevantes
 * 
 * @example
 * ```typescript
 * const pros = await findProfessionalsByDescription(
 *   "necesito arreglar un caño roto",
 *   "CABA"
 * );
 * ```
 */
export async function findProfessionalsByDescription(
    description: string,
    zona?: string,
    limit = 5
): Promise<any[]> {
    try {
        const findProfessionals = httpsCallable(functions, "findProfessionals");

        const result = await findProfessionals({
            description,
            zona,
            limit,
        });

        const data = result.data as {
            success: boolean;
            results: any[];
        };

        if (!data.success) {
            throw new Error("Error buscando profesionales");
        }

        return data.results;
    } catch (error) {
        console.error("Error llamando a findProfessionals:", error);
        throw error;
    }
}

import { db } from "../firebase/client";
import { doc, getDoc } from "firebase/firestore";

/**
 * Determines the correct dashboard URL for a user based on their role and subscription plan.
 * @param user The Firebase Auth user object.
 * @returns A promise that resolves to the redirect URL string.
 */
export async function getAuthRedirect(user: any): Promise<string> {
    if (!user) return "/ingresar";

    // 1. Check if user is a Professional
    const proDoc = await getDoc(doc(db, "profesionales", user.uid));
    if (proDoc.exists()) {
        const data = proDoc.data();
        let plan = data.plan || "semilla";

        // Normalize plan names
        if (plan === "gratuito" || plan === "prueba_gratis") plan = "semilla";
        if (plan === "profesional") plan = "mensual";
        if (plan === "semestral") plan = "experto";

        // Paid/Premium plans go to the detailed Panel unless override is present
        const premiumPlans = ["experto", "mensual", "impulso"];

        if (data.redirect_to_profile) {
            return "/mi-perfil";
        }

        if (premiumPlans.includes(plan)) {
            return "/panel";
        }

        // Free tier goes to profile
        return "/mi-perfil";
    }

    // 2. Check if user is a Client
    const clientDoc = await getDoc(doc(db, "clientes", user.uid));
    if (clientDoc.exists()) {
        return "/mi-cuenta";
    }

    // 3. Fallback for undefined roles (default to profile)
    return "/mi-perfil";
}

/**
 * Validates an Argentine CUIT/CUIL number.
 * @param cuit The CUIT string (with or without dashes).
 * @returns True if the CUIT is valid.
 */
export function validateCUIT(cuit: string): boolean {
    const cleanCUIT = cuit.replace(/[^\d]/g, "");
    if (cleanCUIT.length !== 11) return false;

    const factors = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(cleanCUIT[i]) * factors[i];
    }

    const remainder = sum % 11;
    let calculatedDigit = 11 - remainder;

    if (calculatedDigit === 11) calculatedDigit = 0;
    if (calculatedDigit === 10) {
        // This case is special (usually happens with prefix 23)
        // For 10, the digit should be 9, but in most common algorithms it's an edge case.
        // We'll follow the standard AFIP algorithm.
        calculatedDigit = 9;
    }

    return calculatedDigit === parseInt(cleanCUIT[10]);
}

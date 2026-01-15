/**
 * Plan Utilities - Centralized plan detection and feature limits
 * Replacement for plan-restrictions-v2.js with clean, functional approach
 */

export const PLAN_TIERS = {
    FREE: 'free',
    IMPULSO: 'impulso',
    EXPERTO: 'experto'
};

export const PLAN_NAMES = {
    semilla: 'Plan Semilla',
    impulso: 'Plan Impulso',
    mensual: 'Plan Impulso',
    experto: 'Plan Experto',
    semestral: 'Plan Experto'
};

/**
 * Determine plan tier from plan string
 * @param {string} plan - User's plan (semilla, impulso, mensual, experto, semestral)
 * @returns {string} Plan tier (free, impulso, experto)
 */
export function getPlanTier(plan) {
    if (!plan || plan === 'semilla') return PLAN_TIERS.FREE;
    if (plan === 'impulso' || plan === 'mensual') return PLAN_TIERS.IMPULSO;
    if (plan === 'experto' || plan === 'semestral') return PLAN_TIERS.EXPERTO;
    return PLAN_TIERS.FREE; // Default to free
}

/**
 * Get plan display name
 * @param {string} plan - User's plan
 * @returns {string} Display name
 */
export function getPlanDisplayName(plan) {
    return PLAN_NAMES[plan] || 'Plan Semilla';
}

/**
 * Get photo/portfolio limit based on plan tier
 * @param {string} planTier - free, impulso, or experto
 * @returns {number} Maximum photos allowed
 */
export function getPhotoLimit(planTier) {
    switch (planTier) {
        case PLAN_TIERS.EXPERTO:
            return 12; // Updated: 12 photos
        case PLAN_TIERS.IMPULSO:
            return 6;  // Updated: 6 photos
        case PLAN_TIERS.FREE:
        default:
            return 0;  // Updated: 0 photos for free plan
    }
}

/**
 * Get contact click limit based on plan tier
 * @param {string} planTier - free, impulso, or experto
 * @returns {number} Maximum contact clicks per month (-1 = unlimited)
 */
export function getContactLimit(planTier) {
    switch (planTier) {
        case PLAN_TIERS.FREE:
            return 20; // 20 clicks per month
        case PLAN_TIERS.IMPULSO:
        case PLAN_TIERS.EXPERTO:
        default:
            return -1; // Unlimited
    }
}

/**
 * Check if user can appear on map
 * @param {string} planTier - free, impulso, or experto
 * @returns {boolean} Can appear on map
 */
export function canShowOnMap(planTier) {
    return planTier !== PLAN_TIERS.FREE;
}

/**
 * Get map pin size based on plan tier
 * @param {string} planTier - free, impulso, or experto
 * @returns {object} {width, height} in pixels
 */
export function getMapPinSize(planTier) {
    switch (planTier) {
        case PLAN_TIERS.EXPERTO:
            return { width: 50, height: 60 }; // Large - most visible
        case PLAN_TIERS.IMPULSO:
            return { width: 35, height: 45 }; // Medium - standard
        case PLAN_TIERS.FREE:
        default:
            return { width: 25, height: 35 }; // Small - shouldn't show on map anyway
    }
}

/**
 * Check if user has social media links feature
 * @param {string} planTier - free, impulso, or experto
 * @returns {boolean} Can add social media links
 */
export function hasSocialMediaLinks(planTier) {
    return planTier === PLAN_TIERS.EXPERTO;
}

/**
 * Get plan features/benefits
 * @param {string} planTier - free, impulso, or experto
 * @returns {Array<string>} List of feature descriptions
 */
export function getPlanFeatures(planTier) {
    switch (planTier) {
        case PLAN_TIERS.EXPERTO:
            return [
                '✅ Perfil Completo',
                '✅ Hasta 12 fotos',
                '✅ Prioridad en Mapa',
                '✅ Redes Sociales',
                '✅ Sello Verificado Oro',
                '✅ Kit QR Marketing',
                '✅ Destacado en Inicio',
                '✅ Contacto Ilimitado'
            ];
        case PLAN_TIERS.IMPULSO:
            return [
                '✅ Perfil Completo',
                '✅ Hasta 6 fotos',
                '✅ Aparece en Mapa',
                '✅ Sello Estándar',
                '✅ Contacto Ilimitado'
            ];
        case PLAN_TIERS.FREE:
        default:
            return [
                '✅ Perfil Básico',
                '✅ Hasta 20 contactos/mes',
                '🔒 Sin fotos de trabajos',
                '🔒 No aparece en mapa',
                '🔒 Sin redes sociales'
            ];
    }
}

/**
 * Check if a feature is available for the plan
 * @param {string} planTier - free, impulso, or experto
 * @param {string} feature - Feature to check
 * @returns {boolean} Whether feature is available
 */
export function hasFeature(planTier, feature) {
    const features = {
        webPropia: planTier === PLAN_TIERS.EXPERTO,
        socialLinks: planTier !== PLAN_TIERS.FREE,
        unlimitedPhotos: planTier === PLAN_TIERS.EXPERTO,
        advancedStats: planTier === PLAN_TIERS.EXPERTO,
        premiumSupport: planTier !== PLAN_TIERS.FREE
    };

    return features[feature] || false;
}

/**
 * Apply plan data to component via data attributes
 * @param {HTMLElement} element - Component root element
 * @param {string} plan - User's plan
 */
export function applyPlanData(element, plan) {
    const planTier = getPlanTier(plan);
    element.dataset.plan = plan;
    element.dataset.planTier = planTier;
    element.dataset.photoLimit = getPhotoLimit(planTier).toString();
}

/**
 * Plan Restrictions - Versión Lightweight
 * Aplica restricciones sutiles sin romper el layout
 */

import { auth, db } from '../firebase/client';
import { doc, getDoc } from 'firebase/firestore';

// Configuración de límites por plan
const PLAN_LIMITS = {
    semilla: {
        fotos: 0,
        redes_sociales: false,
        mapa: false
    },
    gratuito: {
        fotos: 0,
        redes_sociales: false,
        mapa: false
    },
    mensual: {
        fotos: 4,
        redes_sociales: false,
        mapa: true
    },
    impulso: {
        fotos: 4,
        redes_sociales: false,
        mapa: true
    },
    experto: {
        fotos: 12,
        redes_sociales: true,
        mapa: true
    },
    semestral: {
        fotos: 12,
        redes_sociales: true,
        mapa: true
    }
};

/**
 * Agregar ícono de candado y tooltip a un campo
 */
function addLockIcon(element, message, planRequired) {
    // Evitar duplicados
    if (element.parentElement?.querySelector('.lock-icon-wrapper')) {
        return;
    }

    // Deshabilitar el campo
    element.disabled = true;
    element.style.cursor = 'not-allowed';
    element.style.opacity = '0.6';

    // Crear wrapper si el elemento no está en uno
    let wrapper = element.parentElement;
    if (!wrapper.classList.contains('relative')) {
        const newWrapper = document.createElement('div');
        newWrapper.className = 'relative';
        element.parentNode.insertBefore(newWrapper, element);
        newWrapper.appendChild(element);
        wrapper = newWrapper;
    }

    // Crear ícono de candado
    const lockIcon = document.createElement('div');
    lockIcon.className = 'lock-icon-wrapper absolute top-2 right-2 group cursor-pointer';
    lockIcon.innerHTML = `
        <div class="text-orange-500 text-xl">🔒</div>
        <div class="tooltip hidden group-hover:block absolute right-0 top-8 bg-gray-900 text-white text-xs rounded-lg p-3 w-48 z-50 shadow-xl">
            <div class="font-bold mb-1">Feature Premium</div>
            <div class="mb-2">${message}</div>
            <a href="/planes" class="text-orange-400 hover:text-orange-300 underline text-xs">
                Ver Plan ${planRequired === 'experto' ? 'Experto' : 'Impulso'} →
            </a>
        </div>
    `;

    wrapper.appendChild(lockIcon);
}

/**
 * Bloquear sección de redes sociales
 */
function restrictSocialMedia() {
    const socialIds = ['instagram', 'website'];

    socialIds.forEach(id => {
        const input = document.getElementById(id);
        if (input && !input.disabled) {
            addLockIcon(
                input,
                'Conecta tus redes sociales para aumentar tu credibilidad.',
                'experto'
            );
        }
    });
}

/**
 * Actualizar texto de límite de fotos
 */
function updatePhotoLimitText(limite) {
    const limitText = document.getElementById('gallery-limit-text');
    if (limitText) {
        if (limite === 0) {
            limitText.textContent = 'Subida de fotos bloqueada (Plan Free)';
            limitText.className = 'text-xs text-red-500 mt-1 font-bold';

            // Deshabilitar botón de subida
            const uploadBtn = document.querySelector('label[for="input-portfolio"]');
            if (uploadBtn) {
                uploadBtn.style.opacity = '0.5';
                uploadBtn.style.cursor = 'not-allowed';
                uploadBtn.style.pointerEvents = 'none';

                // Agregar tooltip
                const tooltip = document.createElement('div');
                tooltip.className = 'text-xs text-red-500 mt-2';
                tooltip.innerHTML = '🔒 Requiere Plan Impulso o superior - <a href="/planes" class="underline">Ver Planes</a>';
                uploadBtn.parentElement?.appendChild(tooltip);
            }
        } else {
            limitText.textContent = `0 de ${limite} fotos`;
            limitText.className = 'text-xs text-gray-500 mt-1';
        }
    }
}

/**
 * Mostrar información del plan en la UI
 */
function displayPlanInfo(plan) {
    const planDisplay = document.getElementById('plan-display');
    const planBenefits = document.getElementById('plan-benefits');

    if (planDisplay) {
        const planNames = {
            semilla: 'GRATUITO',
            gratuito: 'GRATUITO',
            mensual: 'IMPULSO',
            impulso: 'IMPULSO',
            experto: 'EXPERTO',
            semestral: 'EXPERTO'
        };
        planDisplay.textContent = planNames[plan] || plan.toUpperCase();
    }

    if (planBenefits) {
        const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.semilla;
        planBenefits.innerHTML = `
            <li class="flex items-center gap-2">
                ${limits.mapa ? '✅' : '❌'} <span>Visible en Mapa</span>
            </li>
            <li class="flex items-center gap-2">
                ${limits.fotos > 0 ? '✅' : '❌'} <span>${limits.fotos} Fotos en Galería</span>
            </li>
            <li class="flex items-center gap-2">
                ${limits.redes_sociales ? '✅' : '❌'} <span>Redes Sociales</span>
            </li>
        `;
    }
}

/**
 * Inicializar restricciones
 */
export async function initPlanRestrictions() {
    console.log('🔒 Iniciando restricciones (Versión Lightweight)...');

    // Esperar auth
    await new Promise(resolve => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            unsubscribe();
            resolve(user);
        });
    });

    const user = auth.currentUser;

    if (!user) {
        console.log('👤 No usuario: Restricciones Free');
        displayPlanInfo('gratuito');
        updatePhotoLimitText(0);
        restrictSocialMedia();
        return;
    }

    try {
        const docRef = doc(db, 'profesionales', user.uid);
        const snap = await getDoc(docRef);

        if (!snap.exists()) {
            console.log('📄 No perfil: Restricciones Free');
            displayPlanInfo('gratuito');
            updatePhotoLimitText(0);
            restrictSocialMedia();
            return;
        }

        const data = snap.data();
        const plan = data.plan || 'semilla';
        const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.semilla;

        console.log(`✅ Plan: ${plan}`, limits);

        displayPlanInfo(plan);
        updatePhotoLimitText(limits.fotos);

        if (!limits.redes_sociales) {
            restrictSocialMedia();
        }

    } catch (e) {
        console.error('❌ Error restricciones:', e);
    }
}

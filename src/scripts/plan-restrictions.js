/**
 * Plan Restrictions Enforcer
 * Aplica restricciones dinámicamente según el plan del usuario
 * Sin modificar código HTML existente
 * Versión Modulo ES
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
 * Aplicar efecto glassmorfismo a un elemento
 */
function applyGlassmorphism(element, planRequired, featureText) {
    // Wrapper contenedor
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
    position: relative;
    border-radius: 12px;
    overflow: hidden;
    width: 100%;
  `;

    // Insertar wrapper antes del elemento
    element.parentNode.insertBefore(wrapper, element);
    wrapper.appendChild(element);

    // Aplicar blur al contenido
    element.style.cssText += `
    filter: blur(8px);
    pointer-events: none;
    user-select: none;
    opacity: 0.4;
  `;

    // Crear overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.18);
    z-index: 10;
  `;

    // Card de bloqueo
    const card = document.createElement('div');
    card.style.cssText = `
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    padding: 2rem;
    border-radius: 16px;
    text-align: center;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    max-width: 300px;
    border: 2px solid rgba(255, 138, 0, 0.2);
  `;

    card.innerHTML = `
    <div style="font-size: 3rem; margin-bottom: 1rem; animation: shake 0.5s ease-in-out infinite alternate;">🔒</div>
    <h4 style="margin: 0 0 0.5rem; color: #1e293b; font-size: 1.2rem;">Feature Premium</h4>
    <p style="margin: 0 0 1.5rem; color: #64748b; font-size: 0.9rem;">${featureText}</p>
    <a href="/planes" style="
      display: inline-block;
      padding: 0.75rem 1.5rem;
      background: linear-gradient(135deg, #FF8A00, #FF6B00);
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(255, 138, 0, 0.3);
      transition: transform 0.2s, box-shadow 0.2s;
    ">
      Desbloquear con Plan ${planRequired === 'experto' ? 'Experto' : 'Impulso'}
    </a>
  `;

    overlay.appendChild(card);
    wrapper.appendChild(overlay);

    // Animación shake
    if (!document.getElementById('plan-restrictions-styles')) {
        const style = document.createElement('style');
        style.id = 'plan-restrictions-styles';
        style.textContent = `
      @keyframes shake {
        0% { transform: rotate(-5deg); }
        100% { transform: rotate(5deg); }
      }
    `;
        document.head.appendChild(style);
    }
}

/**
 * Aplicar restricción de redes sociales
 */
function restrictSocialMedia() {
    const socialIds = ['instagram', 'facebook', 'tiktok', 'twitter', 'linkedin'];
    const socialInputs = [];

    socialIds.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            socialInputs.push(input);
        }
    });

    if (socialInputs.length > 0) {
        let socialSection = socialInputs[0].closest('.grid, .tab-panel, section, [class*="tab"]');

        if (!socialSection) {
            socialSection = socialInputs[0].parentElement;
        }

        if (socialSection && !socialSection.classList.contains('plan-restricted')) {
            socialSection.classList.add('plan-restricted');
            applyGlassmorphism(
                socialSection,
                'experto',
                'Conecta tus redes sociales para aumentar tu credibilidad. Solo disponible en Plan Experto.'
            );
        }
    }
}

/**
 * Actualizar límite de fotos en el texto
 */
function updatePhotoLimitText(limite) {
    const allText = document.querySelectorAll('p, span, div, label');
    allText.forEach(el => {
        if (el.textContent.includes('de 12 fotos')) {
            el.textContent = el.textContent.replace(/\d+ de 12 fotos/, `X de ${limite} fotos`);
            // Más genérico: replace('12 fotos', `${limite} fotos`)
            el.textContent = el.textContent.replace('12 fotos', `${limite} fotos`);
        }
    });

    // Limitar subida
    if (limite === 0) {
        // Updated selector to match 'galeria' which is used in the new components
        const fotosTab = document.querySelector('[data-tab="galeria"], #tab-galeria');
        if (fotosTab && !fotosTab.classList.contains('plan-restricted')) {
            fotosTab.classList.add('plan-restricted');
            // Encontrar el contenido real
            const content = document.getElementById('tab-galeria') || fotosTab;
            applyGlassmorphism(content, 'impulso', 'Sube fotos de tus trabajos. Función para planes Impulso y Experto.');
        }
    }
}

/**
 * Inicializar restricciones
 */
export async function initPlanRestrictions() {
    console.log('🔒 Iniciando restricciones (ES Module)...');

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
        updatePhotoLimitText(0);
        restrictSocialMedia();
        return;
    }

    try {
        const docRef = doc(db, 'profesionales', user.uid);
        const snap = await getDoc(docRef);

        if (!snap.exists()) {
            console.log('📄 No perfil: Restricciones Free');
            updatePhotoLimitText(0);
            restrictSocialMedia();
            return;
        }

        const data = snap.data();
        const plan = data.plan || 'semilla';
        const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.semilla;

        console.log(`✅ Plan: ${plan}`, limits);

        updatePhotoLimitText(limits.fotos);
        if (!limits.redes_sociales) restrictSocialMedia();

        // Badge
        const planNames = {
            semilla: '🌱 Semilla (Gratis)',
            mensual: '💎 Impulso',
            impulso: '💎 Impulso',
            experto: '🏆 Experto',
            semestral: '🏆 Experto'
        };
        const planBadge = document.getElementById('badge-plan');
        if (planBadge) planBadge.textContent = planNames[plan] || plan;

    } catch (e) {
        console.error('❌ Error restricciones:', e);
    }
}

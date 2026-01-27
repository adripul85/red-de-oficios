// seed.js
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { createRequire } from "module";

// Importar el JSON de credenciales
const require = createRequire(import.meta.url);
// Asegúrate de que este archivo exista en tu carpeta y tenga el nombre correcto
const serviceAccount = require("./serviceAccountKey.json");

initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore();

// --- DATOS FALSOS EXPANDIDOS ---
const nombres = [
    "Juan", "Carlos", "Maria", "Ana", "Pedro", "Sofia", "Miguel", "Lucia", "Diego", "Valentina",
    "Martin", "Julia", "Lucas", "Camila", "Fernando", "Facundo", "Agustina", "Enzo", "Micaela", "Roberto",
    "Santiago", "Nicolas", "Gabriela", "Daniela", "Alejandro", "Pablo", "Federico", "Natalia", "Julieta", "Mariano",
    "Esteban", "Lorena", "Cecilia", "Gustavo", "Andres", "Veronica", "Gaston", "Rocio", "Mauro", "Melina",
    "Joaquin", "Victoria", "Tomas", "Morena", "Santino", "Isabella", "Bautista", "Catalina", "Thiago", "Emma"
];

const apellidos = [
    "Garcia", "Rodriguez", "Gomez", "Fernandez", "Lopez", "Martinez", "Gonzalez", "Perez", "Sanchez", "Romero",
    "Diaz", "Alvarez", "Torres", "Ruiz", "Benitez", "Ramirez", "Flores", "Acosta", "Medina", "Herrera",
    "Aguirre", "Pereyra", "Gutierrez", "Gimenez", "Molina", "Silva", "Castro", "Rojas", "Ortiz", "Nunez",
    "Luna", "Juarez", "Cabrera", "Rios", "Ferreyra", "Dominguez", "Morales", "Peralta", "Vega", "Carrizo"
];

// --- LISTA COMPLETA DE RUBROS ---
const rubros = [
    // Construcción y Reformas
    "Albañil", "Pintor", "Techista", "Colocador de Pisos", "Ceramista", "Durlockero", "Herrero", "Carpintero",
    // Instalaciones
    "Plomero", "Electricista Matriculado", "Gasista Matriculado", "Cerrajero", "Técnico Aire Acondicionado", "Destapaciones",
    // Carpintería Metálica y Vidrios
    "Vidriero", "Persianista",
    // Exteriores
    "Jardinero", "Piletero", "Fletero", "Fumigador",
    // Servicios Especializados
    "Tapicero", "Técnico de Electrodomésticos", "Instalador de Cámaras",
    // Estética
    "Peinador / Estilista", "Maquillador/a", "Barbero", "Manicura / Pedicura",
    // Reparación y Confección
    "Zapatero", "Sastre / Modista", "Relojero"
];

// --- UBICACIONES FEDERALES (Más ciudades y zonas) ---
const UBICACIONES_ARGENTINA = [
    // CABA
    { ciudad: "Capital Federal", provincia: "CABA", lat: -34.6037, lng: -58.3816 },
    { ciudad: "Palermo, CABA", provincia: "CABA", lat: -34.5889, lng: -58.4305 },
    { ciudad: "Belgrano, CABA", provincia: "CABA", lat: -34.5611, lng: -58.4619 },
    { ciudad: "Caballito, CABA", provincia: "CABA", lat: -34.6176, lng: -58.4452 },

    // GBA Norte
    { ciudad: "San Isidro", provincia: "Buenos Aires", lat: -34.4718, lng: -58.5285 },
    { ciudad: "Vicente López", provincia: "Buenos Aires", lat: -34.5268, lng: -58.4735 },
    { ciudad: "Tigre", provincia: "Buenos Aires", lat: -34.4251, lng: -58.5797 },
    { ciudad: "Pilar", provincia: "Buenos Aires", lat: -34.4587, lng: -58.9142 },

    // GBA Sur
    { ciudad: "Lomas de Zamora", provincia: "Buenos Aires", lat: -34.7610, lng: -58.4046 },
    { ciudad: "Lanús", provincia: "Buenos Aires", lat: -34.7005, lng: -58.3973 },
    { ciudad: "Quilmes", provincia: "Buenos Aires", lat: -34.7248, lng: -58.2612 },
    { ciudad: "Avellaneda", provincia: "Buenos Aires", lat: -34.6611, lng: -58.3662 },

    // GBA Oeste
    { ciudad: "Morón", provincia: "Buenos Aires", lat: -34.6525, lng: -58.6202 },
    { ciudad: "Ramos Mejía", provincia: "Buenos Aires", lat: -34.6409, lng: -58.5638 },
    { ciudad: "Merlo", provincia: "Buenos Aires", lat: -34.6652, lng: -58.7291 },

    // Buenos Aires Interior
    { ciudad: "La Plata", provincia: "Buenos Aires", lat: -34.9205, lng: -57.9542 },
    { ciudad: "Mar del Plata", provincia: "Buenos Aires", lat: -38.0055, lng: -57.5426 },
    { ciudad: "Bahía Blanca", provincia: "Buenos Aires", lat: -38.7196, lng: -62.2724 },
    { ciudad: "Tandil", provincia: "Buenos Aires", lat: -37.3217, lng: -59.1332 },
    { ciudad: "San Nicolás", provincia: "Buenos Aires", lat: -33.3335, lng: -60.2110 },

    // Córdoba
    { ciudad: "Córdoba Capital", provincia: "Córdoba", lat: -31.4201, lng: -64.1888 },
    { ciudad: "Villa Carlos Paz", provincia: "Córdoba", lat: -31.4241, lng: -64.4977 },
    { ciudad: "Río Cuarto", provincia: "Córdoba", lat: -33.1232, lng: -64.3493 },
    { ciudad: "Villa María", provincia: "Córdoba", lat: -32.4075, lng: -63.2402 },

    // Santa Fe
    { ciudad: "Rosario", provincia: "Santa Fe", lat: -32.9442, lng: -60.6505 },
    { ciudad: "Santa Fe Capital", provincia: "Santa Fe", lat: -31.6107, lng: -60.6973 },
    { ciudad: "Rafaela", provincia: "Santa Fe", lat: -31.2503, lng: -61.4867 },
    { ciudad: "Venado Tuerto", provincia: "Santa Fe", lat: -33.7456, lng: -61.9688 },

    // Entre Ríos
    { ciudad: "Paraná", provincia: "Entre Ríos", lat: -31.7333, lng: -60.5175 },
    { ciudad: "Concordia", provincia: "Entre Ríos", lat: -31.3930, lng: -58.0209 },
    { ciudad: "Gualeguaychú", provincia: "Entre Ríos", lat: -33.0116, lng: -58.5197 },

    // Cuyo
    { ciudad: "Mendoza Capital", provincia: "Mendoza", lat: -32.8895, lng: -68.8458 },
    { ciudad: "San Rafael", provincia: "Mendoza", lat: -34.6177, lng: -68.3301 },
    { ciudad: "San Juan Capital", provincia: "San Juan", lat: -31.5351, lng: -68.5386 },
    { ciudad: "San Luis Capital", provincia: "San Luis", lat: -33.2950, lng: -66.3356 },
    { ciudad: "Villa de Merlo", provincia: "San Luis", lat: -32.3432, lng: -65.0049 },

    // NOA
    { ciudad: "San Miguel de Tucumán", provincia: "Tucumán", lat: -26.8083, lng: -65.2176 },
    { ciudad: "Salta Capital", provincia: "Salta", lat: -24.7821, lng: -65.4232 },
    { ciudad: "San Salvador de Jujuy", provincia: "Jujuy", lat: -24.1858, lng: -65.2995 },
    { ciudad: "Santiago del Estero", provincia: "Santiago del Estero", lat: -27.7951, lng: -64.2615 },
    { ciudad: "Catamarca Capital", provincia: "Catamarca", lat: -28.4696, lng: -65.7852 },
    { ciudad: "La Rioja Capital", provincia: "La Rioja", lat: -29.4111, lng: -66.8507 },

    // NEA
    { ciudad: "Posadas", provincia: "Misiones", lat: -27.3671, lng: -55.8961 },
    { ciudad: "Puerto Iguazú", provincia: "Misiones", lat: -25.5991, lng: -54.5736 },
    { ciudad: "Corrientes Capital", provincia: "Corrientes", lat: -27.4692, lng: -58.8306 },
    { ciudad: "Resistencia", provincia: "Chaco", lat: -27.4514, lng: -58.9867 },
    { ciudad: "Formosa Capital", provincia: "Formosa", lat: -26.1849, lng: -58.1731 },

    // Patagonia
    { ciudad: "Neuquén Capital", provincia: "Neuquén", lat: -38.9516, lng: -68.0591 },
    { ciudad: "San Carlos de Bariloche", provincia: "Río Negro", lat: -41.1335, lng: -71.3103 },
    { ciudad: "Viedma", provincia: "Río Negro", lat: -40.8135, lng: -62.9967 },
    { ciudad: "Puerto Madryn", provincia: "Chubut", lat: -42.7692, lng: -65.0350 },
    { ciudad: "Comodoro Rivadavia", provincia: "Chubut", lat: -45.8667, lng: -67.5000 },
    { ciudad: "Santa Rosa", provincia: "La Pampa", lat: -36.6167, lng: -64.2833 },
    { ciudad: "Río Gallegos", provincia: "Santa Cruz", lat: -51.6226, lng: -69.2181 },
    { ciudad: "Ushuaia", provincia: "Tierra del Fuego", lat: -54.8019, lng: -68.3030 }
];

// Servicios base para el cotizador
const serviciosBase = [
    { nombre: "Visita Técnica", precio_min: 15000, precio_max: 20000, descripcion: "Diagnóstico y presupuesto en domicilio." },
    { nombre: "Mano de Obra (Hora)", precio_min: 25000, precio_max: 35000, descripcion: "Costo por hora de trabajo estándar." },
    { nombre: "Urgencia 24hs", precio_min: 40000, precio_max: 60000, descripcion: "Atención fuera de horario comercial." },
    { nombre: "Instalación Básica", precio_min: 50000, precio_max: 80000, descripcion: "Instalación de artefactos simples." }
];

// --- FUNCIONES AUXILIARES ---
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max) => (Math.random() * (max - min) + min).toFixed(1);
const addJitter = (coord) => coord + (Math.random() - 0.5) * 0.08;

// Función para determinar el plan basado en probabilidades
// 40% experto, 40% impulso, 20% gratuito
const getPlanAleatorio = () => {
    const r = Math.random();
    if (r < 0.40) return "experto";
    if (r < 0.80) return "impulso";
    return "gratuito";
};

// --- FUNCIÓN PRINCIPAL ---
async function crearPerfiles() {
    // Aumenté a 500 para que se note la distribución de planes y localidades
    const batchSize = 500;
    console.log(`🚀 Iniciando creación de ${batchSize} perfiles con distribución: 40% Experto, 40% Impulso, 20% Gratuito...`);

    const promesas = [];

    for (let i = 0; i < batchSize; i++) {
        const nombre = pick(nombres);
        const apellido = pick(apellidos);
        const rubro = pick(rubros);

        // Elegir ubicación
        const ubicacionBase = pick(UBICACIONES_ARGENTINA);
        const lat = addJitter(ubicacionBase.lat);
        const lng = addJitter(ubicacionBase.lng);

        // Definir plan con la nueva lógica
        const planAsignado = getPlanAleatorio();

        // Ajustar visualización según plan (opcional, para dar realismo)
        // Si es experto o impulso, es más probable que esté verificado
        const esPago = planAsignado !== "gratuito";
        const estaVerificado = esPago ? (Math.random() > 0.3) : (Math.random() > 0.8);

        const misServicios = serviciosBase
            .sort(() => 0.5 - Math.random())
            .slice(0, randomInt(2, 4));

        const nuevoPerfil = {
            is_fake: true,
            nombre: `${nombre} ${apellido}`,
            email: `${nombre.toLowerCase()}.${apellido.toLowerCase()}${i}@test.com`,
            rol: "profesional",

            // Datos del Oficio
            rubro_principal: rubro,
            categoria: rubro,

            // Datos Geográficos
            zona: ubicacionBase.ciudad,
            provincia: ubicacionBase.provincia,
            direccion_visible: `${ubicacionBase.ciudad}, ${ubicacionBase.provincia}`,

            descripcion: `Hola, soy ${nombre}. Soy ${rubro} con experiencia en ${ubicacionBase.ciudad}. Presupuestos sin cargo y garantía escrita.`,
            telefono: "5491112345678",
            foto: `https://ui-avatars.com/api/?name=${nombre}+${apellido}&background=random&size=256`,

            // LÓGICA DE PLANES ACTUALIZADA
            plan: planAsignado,
            verificado: estaVerificado,

            es_24hs: Math.random() > 0.8,
            precio_desde: `$${randomInt(15, 35)}.000`,

            // Estadísticas
            promedio: parseFloat(randomFloat(3.8, 5.0)),
            total_votos: randomInt(0, 60),
            likes: randomInt(0, 120),
            vistas_perfil: randomInt(50, 600),
            contactos_whatsapp: randomInt(2, 45),

            // Ubicación Mapa
            ubicacion_exacta: {
                lat: lat,
                lng: lng,
                direccion: `Calle ${randomInt(1, 100)} N° ${randomInt(100, 9000)}, ${ubicacionBase.ciudad}, ${ubicacionBase.provincia}, Argentina`
            },

            etiquetas: [rubro, "Profesional", planAsignado === "experto" ? "Destacado" : "Servicio", ubicacionBase.ciudad],

            presupuestos_config: {
                activo: true,
                mensaje_base: `Hola, gracias por contactar a un ${rubro}. ¿En qué puedo ayudarte?`,
                servicios: misServicios
            },

            portfolio: [],
            portfolio_categorizado: { "Mis Trabajos": [] },

            createdAt: new Date()
        };

        promesas.push(db.collection('profesionales').add(nuevoPerfil));
    }

    await Promise.all(promesas);
    console.log(`✅ ¡Listo! ${batchSize} perfiles creados.`);
    console.log("📊 Distribución aproximada: ~40% Experto, ~40% Impulso, ~20% Gratuito.");
}

// Ejecutar la función
crearPerfiles().catch(console.error);
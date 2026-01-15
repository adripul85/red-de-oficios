// seed.js
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { createRequire } from "module";

// Importar el JSON de credenciales
const require = createRequire(import.meta.url);
// Asegúrate de que este archivo exista en tu carpeta
const serviceAccount = require("./serviceAccountKey.json");

initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore();

// --- DATOS FALSOS ---
const nombres = ["Juan", "Carlos", "Maria", "Ana", "Pedro", "Sofia", "Miguel", "Lucia", "Diego", "Valentina", "Martin", "Julia", "Lucas", "Camila", "Fernando", "Facundo", "Agustina", "Enzo", "Micaela", "Roberto"];
const apellidos = ["Garcia", "Rodriguez", "Gomez", "Fernandez", "Lopez", "Martinez", "Gonzalez", "Perez", "Sanchez", "Romero", "Diaz", "Alvarez", "Torres", "Ruiz", "Benitez", "Ramirez", "Flores", "Acosta"];

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

// --- UBICACIONES FEDERALES (Todas las provincias) ---
const UBICACIONES_ARGENTINA = [
    // CABA y GBA
    { ciudad: "Capital Federal", provincia: "CABA", lat: -34.6037, lng: -58.3816 },
    { ciudad: "San Isidro", provincia: "Buenos Aires", lat: -34.4718, lng: -58.5285 },
    { ciudad: "Lomas de Zamora", provincia: "Buenos Aires", lat: -34.7610, lng: -58.4046 },
    { ciudad: "Morón", provincia: "Buenos Aires", lat: -34.6525, lng: -58.6202 },
    { ciudad: "La Plata", provincia: "Buenos Aires", lat: -34.9205, lng: -57.9542 },
    { ciudad: "Mar del Plata", provincia: "Buenos Aires", lat: -38.0055, lng: -57.5426 },
    { ciudad: "Bahía Blanca", provincia: "Buenos Aires", lat: -38.7196, lng: -62.2724 },
    { ciudad: "Tandil", provincia: "Buenos Aires", lat: -37.3217, lng: -59.1332 },

    // Centro
    { ciudad: "Córdoba Capital", provincia: "Córdoba", lat: -31.4201, lng: -64.1888 },
    { ciudad: "Villa Carlos Paz", provincia: "Córdoba", lat: -31.4241, lng: -64.4977 },
    { ciudad: "Río Cuarto", provincia: "Córdoba", lat: -33.1232, lng: -64.3493 },
    { ciudad: "Rosario", provincia: "Santa Fe", lat: -32.9442, lng: -60.6505 },
    { ciudad: "Santa Fe Capital", provincia: "Santa Fe", lat: -31.6107, lng: -60.6973 },
    { ciudad: "Paraná", provincia: "Entre Ríos", lat: -31.7333, lng: -60.5175 },
    { ciudad: "Concordia", provincia: "Entre Ríos", lat: -31.3930, lng: -58.0209 },
    { ciudad: "Santa Rosa", provincia: "La Pampa", lat: -36.6167, lng: -64.2833 },

    // Cuyo
    { ciudad: "Mendoza Capital", provincia: "Mendoza", lat: -32.8895, lng: -68.8458 },
    { ciudad: "San Rafael", provincia: "Mendoza", lat: -34.6177, lng: -68.3301 },
    { ciudad: "San Juan Capital", provincia: "San Juan", lat: -31.5351, lng: -68.5386 },
    { ciudad: "San Luis Capital", provincia: "San Luis", lat: -33.2950, lng: -66.3356 },
    { ciudad: "Villa Mercedes", provincia: "San Luis", lat: -33.6757, lng: -65.4578 },
    { ciudad: "La Rioja Capital", provincia: "La Rioja", lat: -29.4111, lng: -66.8507 },

    // NOA (Noroeste)
    { ciudad: "San Miguel de Tucumán", provincia: "Tucumán", lat: -26.8083, lng: -65.2176 },
    { ciudad: "Salta Capital", provincia: "Salta", lat: -24.7821, lng: -65.4232 },
    { ciudad: "San Salvador de Jujuy", provincia: "Jujuy", lat: -24.1858, lng: -65.2995 },
    { ciudad: "San Fernando del Valle", provincia: "Catamarca", lat: -28.4696, lng: -65.7852 },
    { ciudad: "Santiago del Estero", provincia: "Santiago del Estero", lat: -27.7951, lng: -64.2615 },

    // NEA (Noreste)
    { ciudad: "Posadas", provincia: "Misiones", lat: -27.3671, lng: -55.8961 },
    { ciudad: "Puerto Iguazú", provincia: "Misiones", lat: -25.5991, lng: -54.5736 },
    { ciudad: "Corrientes Capital", provincia: "Corrientes", lat: -27.4692, lng: -58.8306 },
    { ciudad: "Resistencia", provincia: "Chaco", lat: -27.4514, lng: -58.9867 },
    { ciudad: "Formosa Capital", provincia: "Formosa", lat: -26.1849, lng: -58.1731 },

    // Patagonia
    { ciudad: "Neuquén Capital", provincia: "Neuquén", lat: -38.9516, lng: -68.0591 },
    { ciudad: "San Martín de los Andes", provincia: "Neuquén", lat: -40.1579, lng: -71.3534 },
    { ciudad: "San Carlos de Bariloche", provincia: "Río Negro", lat: -41.1335, lng: -71.3103 },
    { ciudad: "Viedma", provincia: "Río Negro", lat: -40.8135, lng: -62.9967 },
    { ciudad: "Trelew", provincia: "Chubut", lat: -43.2490, lng: -65.3050 },
    { ciudad: "Comodoro Rivadavia", provincia: "Chubut", lat: -45.8667, lng: -67.5000 },
    { ciudad: "Río Gallegos", provincia: "Santa Cruz", lat: -51.6226, lng: -69.2181 },
    { ciudad: "El Calafate", provincia: "Santa Cruz", lat: -50.3380, lng: -72.2652 },
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

// --- FUNCIÓN PRINCIPAL ---
async function crearPerfiles() {
    // TIP: Aumenta este número para poblar más (ej: 200 o 300) ahora que tienes más ciudades
    const batchSize = 100;
    console.log(`🚀 Iniciando creación de ${batchSize} perfiles FEDERALES en Argentina...`);

    const promesas = [];

    for (let i = 0; i < batchSize; i++) {
        const nombre = pick(nombres);
        const apellido = pick(apellidos);
        const rubro = pick(rubros);

        // 1. Elegimos una ubicación aleatoria (Ciudad + Provincia)
        const ubicacionBase = pick(UBICACIONES_ARGENTINA);

        // 2. Generamos coordenadas con "ruido" alrededor de esa ciudad
        const lat = addJitter(ubicacionBase.lat);
        const lng = addJitter(ubicacionBase.lng);

        const esPremium = Math.random() > 0.7;

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
            categoria: rubro, // Simplificamos usando el mismo rubro como categoría

            // Datos Geográficos Completos
            zona: ubicacionBase.ciudad,
            provincia: ubicacionBase.provincia, // AGREGADO IMPORTANTE
            direccion_visible: `${ubicacionBase.ciudad}, ${ubicacionBase.provincia}`,

            descripcion: `Hola, soy ${nombre}. Soy ${rubro} con experiencia en la zona de ${ubicacionBase.ciudad}. Trabajo con responsabilidad, limpieza y garantía. ¡Tu consulta no molesta!`,
            telefono: "5491112345678", // Teléfono genérico
            foto: `https://ui-avatars.com/api/?name=${nombre}+${apellido}&background=random&size=256`,

            // Datos de Negocio
            plan: esPremium ? "mensual" : "gratuito",
            verificado: Math.random() > 0.6,
            es_24hs: Math.random() > 0.8,
            precio_desde: `$${randomInt(15, 35)}.000`,

            // Estadísticas Falsas
            promedio: parseFloat(randomFloat(3.8, 5.0)),
            total_votos: randomInt(0, 60),
            likes: randomInt(0, 120),
            vistas_perfil: randomInt(50, 600),
            contactos_whatsapp: randomInt(2, 45),

            // Ubicación Mapa
            ubicacion_exacta: {
                lat: lat,
                lng: lng,
                // Generamos una dirección ficticia acorde a la ciudad
                direccion: `Calle ${randomInt(1, 100)} N° ${randomInt(100, 9000)}, ${ubicacionBase.ciudad}, ${ubicacionBase.provincia}, Argentina`
            },

            // Etiquetas (Tags)
            etiquetas: [rubro, "Profesional", "A domicilio", ubicacionBase.ciudad],

            // Configuración COTIZADOR
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
    console.log(`✅ ¡Listo! ${batchSize} perfiles creados cubriendo todos los rubros y provincias. 🇦🇷`);
    console.log("💡 Tip: Recuerda usar 'node borrar_falsos.js' si necesitas limpiar.");
}

// Ejecutar la función
crearPerfiles().catch(console.error);
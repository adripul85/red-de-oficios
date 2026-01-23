// seed.js
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { createRequire } from "module";

// --- CONFIGURACIÓN DE FIREBASE ---
const require = createRequire(import.meta.url);
// ⚠️ Asegúrate de que el nombre del archivo JSON sea correcto
const serviceAccount = require("./serviceAccountKey.json");

initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore();

// --- DATOS GENÉRICOS ---
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

// --- NUEVA ESTRUCTURA DE UBICACIONES ---
const LOCATIONS = [
    {
        group: "Capital Federal (CABA)",
        zones: ["Agronomía", "Almagro", "Balvanera", "Barracas", "Belgrano", "Boedo", "Caballito", "Chacarita", "Coghlan", "Colegiales", "Constitución", "Flores", "Floresta", "La Boca", "La Paternal", "Liniers", "Mataderos", "Monte Castro", "Monserrat", "Nueva Pompeya", "Nuñez", "Palermo", "Parque Avellaneda", "Parque Chacabuco", "Parque Chas", "Parque Patricios", "Puerto Madero", "Recoleta", "Retiro", "Saavedra", "San Cristóbal", "San Nicolás", "San Telmo", "Vélez Sársfield", "Versalles", "Villa Crespo", "Villa del Parque", "Villa Devoto", "Villa General Mitre", "Villa Lugano", "Villa Luro", "Villa Ortúzar", "Villa Pueyrredón", "Villa Real", "Villa Riachuelo", "Villa Santa Rita", "Villa Soldati", "Villa Urquiza"]
    },
    {
        group: "Zona Norte (GBA)",
        zones: ["Vicente López", "Olivos", "Florida", "La Lucila", "Munro", "Villa Martelli", "San Isidro", "Martínez", "Acassuso", "Beccar", "Boulogne", "Villa Adelina", "San Fernando", "Victoria", "Virreyes", "Tigre", "Don Torcuato", "General Pacheco", "Benavídez", "Rincón de Milberg", "Nordelta", "San Martín", "Villa Ballester", "San Andrés", "José León Suárez", "Pilar", "Escobar", "Malvinas Argentinas"]
    },
    {
        group: "Zona Oeste (GBA)",
        zones: ["La Matanza", "San Justo", "Ramos Mejía", "Lomas del Mirador", "Isidro Casanova", "Gregorio de Laferrere", "Virrey del Pino", "González Catán", "Morón", "Castelar", "Haedo", "El Palomar", "Villa Sarmiento", "Hurlingham", "Villa Tesei", "William C. Morris", "Ituzaingó", "Parque Leloir", "Merlo", "San Antonio de Padua", "Libertad", "Moreno", "Paso del Rey", "General Rodríguez", "Luján"]
    },
    {
        group: "Zona Sur (GBA)",
        zones: ["Avellaneda", "Wilde", "Sarandí", "Gerli", "Piñeyro", "Dock Sud", "Lanús", "Remedios de Escalada", "Valentín Alsina", "Monte Chingolo", "Lomas de Zamora", "Banfield", "Temperley", "Turdera", "Llavallol", "Quilmes", "Bernal", "Don Bosco", "Ezpeleta", "San Francisco Solano", "Almirante Brown", "Adrogué", "Burzaco", "Longchamps", "Rafael Calzada", "Claypole", "Esteban Echeverría", "Monte Grande", "Ezeiza", "Canning", "Berazategui", "Florencio Varela", "La Plata", "Ensenada", "Berisso"]
    },
    {
        group: "Buenos Aires (Interior)",
        zones: ["La Plata", "Mar del Plata", "Batán", "Bahía Blanca", "Punta Alta", "Tandil", "Olavarría", "Azul", "Pergamino", "Junín", "Chacabuco", "Mercedes", "Chivilcoy", "San Nicolás", "Ramallo", "San Pedro", "Zárate", "Campana", "Cañuelas", "Lobos", "Navarro", "Saladillo", "25 de Mayo", "9 de Julio", "Bolívar", "Pehuajó", "Trenque Lauquen", "Necochea", "Quequén", "Miramar", "Balcarce", "Dolores", "Maipú", "Chascomús", "Lezama"]
    },
    {
        group: "Córdoba",
        zones: ["Córdoba Capital", "Nueva Córdoba", "Cerro de las Rosas", "Villa Carlos Paz", "Río Cuarto", "Villa María", "San Francisco", "Alta Gracia", "Cosquín", "La Falda", "Jesús María", "Bell Ville", "Marcos Juárez", "Cruz del Eje"]
    },
    {
        group: "Santa Fe",
        zones: ["Rosario", "Centro Rosario", "Fisherton", "Funes", "Santa Fe Capital", "Recreo", "Santo Tomé", "Rafaela", "Venado Tuerto", "Reconquista", "Esperanza", "San Lorenzo", "Capitán Bermúdez", "Villa Gobernador Gálvez"]
    },
    {
        group: "Mendoza",
        zones: ["Mendoza Capital", "Godoy Cruz", "Luján de Cuyo", "Maipú", "Guaymallén", "San Rafael", "Malargüe", "Tunuyán", "San Martín"]
    },
    {
        group: "Tucumán",
        zones: ["San Miguel de Tucumán", "Yerba Buena", "Tafí Viejo", "Concepción", "Famaillá", "Monteros"]
    },
    {
        group: "Salta",
        zones: ["Salta Capital", "Metán", "Tartagal", "Orán", "Cafayate", "General Güemes"]
    },
    {
        group: "Entre Ríos",
        zones: ["Paraná", "Concordia", "Gualeguaychú", "Concepción del Uruguay", "Victoria", "Colón"]
    },
    {
        group: "Misiones",
        zones: ["Posadas", "Garupá", "Oberá", "Eldorado", "Puerto Iguazú"]
    },
    {
        group: "Neuquén",
        zones: ["Neuquén Capital", "Centenario", "Plottier", "San Martín de los Andes", "Villa La Angostura", "Zapala", "Cutral-Có"]
    },
    {
        group: "Río Negro",
        zones: ["Viedma", "San Carlos de Bariloche", "General Roca", "Cipolletti", "El Bolsón"]
    },
    // Se agregan grupos representativos de las demás provincias para no hacer el código infinito, 
    // pero usando la lógica de "jitter" se ubicarán bien.
    { group: "Chubut", zones: ["Comodoro Rivadavia", "Trelew", "Puerto Madryn", "Esquel"] },
    { group: "Santa Cruz", zones: ["Río Gallegos", "El Calafate", "Caleta Olivia"] },
    { group: "Tierra del Fuego", zones: ["Ushuaia", "Río Grande"] },
    { group: "San Juan", zones: ["San Juan Capital", "Rawson", "Rivadavia"] },
    { group: "San Luis", zones: ["San Luis Capital", "Villa Mercedes", "Merlo"] },
    { group: "Corrientes", zones: ["Corrientes Capital", "Goya", "Paso de los Libres"] },
    { group: "Chaco", zones: ["Resistencia", "Sáenz Peña", "Villa Ángela"] },
    { group: "Jujuy", zones: ["San Salvador de Jujuy", "Palpalá", "Tilcara"] },
    { group: "Santiago del Estero", zones: ["Santiago del Estero Capital", "La Banda", "Termas de Río Hondo"] }
];

// --- MAPEO DE COORDENADAS BASE (Aproximadas por Grupo) ---
// Esto sirve para que, al elegir "Zona Norte", el mapa caiga cerca de ahí.
const COORD_BASES = {
    "Capital Federal (CABA)": { lat: -34.6037, lng: -58.3816 },
    "Zona Norte (GBA)": { lat: -34.4700, lng: -58.5300 },
    "Zona Oeste (GBA)": { lat: -34.6500, lng: -58.6200 },
    "Zona Sur (GBA)": { lat: -34.7600, lng: -58.4000 },
    "Buenos Aires (Interior)": { lat: -37.3200, lng: -59.1300 }, // Centro PBA (Tandil aprox)
    "Córdoba": { lat: -31.4201, lng: -64.1888 },
    "Santa Fe": { lat: -32.9442, lng: -60.6505 },
    "Mendoza": { lat: -32.8895, lng: -68.8458 },
    "Tucumán": { lat: -26.8083, lng: -65.2176 },
    "Salta": { lat: -24.7821, lng: -65.4232 },
    "Entre Ríos": { lat: -31.7333, lng: -60.5175 },
    "Misiones": { lat: -27.3671, lng: -55.8961 },
    "Neuquén": { lat: -38.9516, lng: -68.0591 },
    "Río Negro": { lat: -41.1335, lng: -71.3103 },
    "Chubut": { lat: -45.8667, lng: -67.5000 },
    "Santa Cruz": { lat: -51.6226, lng: -69.2181 },
    "Tierra del Fuego": { lat: -54.8019, lng: -68.3030 },
    "San Juan": { lat: -31.5351, lng: -68.5386 },
    "San Luis": { lat: -33.2950, lng: -66.3356 },
    "Corrientes": { lat: -27.4692, lng: -58.8306 },
    "Chaco": { lat: -27.4514, lng: -58.9867 },
    "Jujuy": { lat: -24.1858, lng: -65.2995 },
    "Santiago del Estero": { lat: -27.7951, lng: -64.2615 },
    // Default si no matchea
    "Default": { lat: -34.6037, lng: -58.3816 }
};

// --- NUEVA ESTRUCTURA DE RUBROS Y CATEGORÍAS ---
const CATEGORIES = [
    {
        group: "🚨 Urgencias e Instalaciones Críticas",
        trades: [
            { name: "Plomero", subtrades: ["Cañerías", "Tanques", "Bombas de agua", "Filtraciones"] },
            { name: "Electricista", subtrades: ["Tableros", "Cortocircuitos", "Cableados", "Iluminación"] },
            { name: "Gasista", subtrades: ["Instalaciones aprobadas", "Estufas", "Termotanques", "Cocinas"] },
            { name: "Cerrajero", subtrades: ["Urgencias 24hs", "Cambio de combinación", "Apertura de autos/casas"] },
            { name: "Destapaciones", subtrades: ["Cloacas", "Pluviales", "Cámaras sépticas"] },
            { name: "Técnico de Aire Acondicionado", subtrades: ["Instalación", "Carga de gas", "Limpieza", "Service"] },
            { name: "Técnico de Electrodomésticos", subtrades: ["Lavarropas", "Heladeras", "Microondas"] }
        ]
    },
    {
        group: "🧱 Construcción, Reformas e Infraestructura",
        trades: [
            { name: "Albañil", subtrades: ["Cimientos", "Paredes", "Revoques", "Losas"] },
            { name: "Techista", subtrades: ["Filtraciones", "Membranas", "Techos de teja o chapa"] },
            { name: "Pintor", subtrades: ["Interiores", "Exteriores", "Altura", "Durlock"] },
            { name: "Durlockero", subtrades: ["Tabiques", "Cielorrasos", "Muebles de placa de yeso"] },
            { name: "Colocador de Pisos/Ceramista", subtrades: ["Porcelanato", "Flotantes", "Pulido de parqué"] },
            { name: "Herrero", subtrades: ["Rejas", "Portones", "Estructuras metálicas", "Soldadura"] },
            { name: "Carpintero", subtrades: ["Muebles a medida", "Aberturas", "Restauración de maderas"] },
            { name: "Vidriero", subtrades: ["Reparación de vidrios", "Mamparas de baño", "Espejos"] }
        ]
    },
    {
        group: "🎨 Mantenimiento, Estética y Oficios Clásicos",
        trades: [
            { name: "Jardinero", subtrades: ["Corte de césped", "Poda de altura", "Paisajismo"] },
            { name: "Piletero", subtrades: ["Mantenimiento de piscinas", "Pintura", "Bombas"] },
            { name: "Persianista", subtrades: ["Reparación de persianas de PVC", "Madera", "Aluminio"] },
            { name: "Tapicero", subtrades: ["Restauración de sillones", "Sillas", "Sommiers", "Autos"] },
            { name: "Sastre / Modista", subtrades: ["Arreglos de ropa", "Confección", "Cierres", "Dobladillos"] },
            { name: "Zapatero", subtrades: ["Reparación de calzado", "Cambio de suelas"] },
            { name: "Relojero", subtrades: ["Reparación de relojes de pulsera", "Pared"] },
            { name: "Matricero", subtrades: ["Moldes", "Piezas técnicas"] }
        ]
    },
    {
        group: "🥳 Eventos, Gastronomía y Logística",
        trades: [
            { name: "Pastelero/a", subtrades: ["Tortas personalizadas", "Mesas dulces", "Eventos"] },
            { name: "Souvenirs", subtrades: ["Personalizados", "Eventos", "Regalos corporativos", "Artesanías"] },
            { name: "DJ / Sonido", subtrades: ["Musicalización de fiestas", "Iluminación"] },
            { name: "Fletero", subtrades: ["Mudanzas", "Traslados cortos", "Repartos"] },
            { name: "Fumigador", subtrades: ["Control de plagas", "Desinfección"] }
        ]
    },
    {
        group: "💇 Estética y Cuidado Personal",
        trades: [
            { name: "Peinador / Estilista", subtrades: ["Cortes", "Peinados para eventos"] },
            { name: "Barbero", subtrades: ["Corte de barba", "Cabello masculino"] },
            { name: "Maquillador / Maquilladora", subtrades: ["Social", "Novias", "Artístico"] },
            { name: "Manicura / Pedicura", subtrades: ["Cuidado de uñas", "Manos"] }
        ]
    },
    {
        group: "🔐 Seguridad y Tecnología",
        trades: [
            { name: "Instalador de Cámaras de Seguridad", subtrades: ["Alarmas", "CCTV", "Domótica"] },
            { name: "Técnico de PC / Celulares", subtrades: ["Reparación de software", "Hardware"] }
        ]
    }
];

// --- FUNCIONES AUXILIARES ---
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max) => (Math.random() * (max - min) + min).toFixed(1);

// Genera ruido geográfico (aprox 5-10km) para que no estén todos en el mismo punto exacto
const addJitter = (coord) => coord + (Math.random() - 0.5) * 0.1;

// Selecciona múltiples elementos aleatorios de un array (para subtrades)
const pickMultiple = (arr, count) => {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
};

// --- LOGICA DE PLANES ---
const PLANES = ["gratuito", "profesional", "impulso", "experto"];

// --- FUNCIÓN PRINCIPAL ---
async function crearPerfiles() {
    const batchSize = 500; // Cantidad de perfiles a crear
    console.log(`🚀 Iniciando creación de ${batchSize} perfiles con NUEVA estructura (Ubicaciones y Rubros)...`);

    const promesas = [];

    for (let i = 0; i < batchSize; i++) {
        // 1. Datos Personales
        const nombre = pick(nombres);
        const apellido = pick(apellidos);
        const planSeleccionado = pick(PLANES); // Selección aleatoria variada

        // 2. Selección de Rubro y Categoría
        const categoriaGrupo = pick(CATEGORIES);
        const rubroObj = pick(categoriaGrupo.trades);
        const rubroNombre = rubroObj.name;
        // Elegimos algunos sub-rubros para usar como etiquetas o servicios
        const subRubrosElegidos = pickMultiple(rubroObj.subtrades, randomInt(2, 4));

        // 3. Selección de Ubicación (Región + Zona)
        const regionObj = pick(LOCATIONS);
        const zonaEspecifica = pick(regionObj.zones);

        // Obtener coordenadas base según la región
        const coordsBase = COORD_BASES[regionObj.group] || COORD_BASES["Default"];
        const lat = addJitter(coordsBase.lat);
        const lng = addJitter(coordsBase.lng);

        // Lógica de "verificado": Expertos y Profesionales tienen más chance
        let verificado = false;
        if (planSeleccionado === "experto" || planSeleccionado === "impulso") {
            verificado = Math.random() > 0.2; // 80% chance
        } else if (planSeleccionado === "profesional") {
            verificado = Math.random() > 0.4; // 60% chance
        } else {
            verificado = Math.random() > 0.9; // 10% chance para gratuitos
        }

        const nuevoPerfil = {
            is_fake: true,
            nombre: `${nombre} ${apellido}`,
            email: `${nombre.toLowerCase()}.${apellido.toLowerCase()}${i}@test.com`,
            rol: "profesional",

            // --- DATOS DEL OFICIO ACTUALIZADOS ---
            rubro_principal: rubroNombre,
            categoria: categoriaGrupo.group, // Guardamos el nombre del grupo (ej: "Construcción...")

            // --- DATOS GEOGRÁFICOS ---
            zona: zonaEspecifica, // Ej: "Palermo" o "Tigre"
            provincia: regionObj.group, // Ej: "Capital Federal (CABA)" o "Zona Norte (GBA)"
            direccion_visible: `${zonaEspecifica}, ${regionObj.group}`,

            descripcion: `Hola, soy ${nombre}. Ofrezco servicios de ${rubroNombre} en ${zonaEspecifica}. Especialista en ${subRubrosElegidos.join(", ")}. Trabajo garantizado.`,
            telefono: "5491112345678",
            foto: `https://ui-avatars.com/api/?name=${nombre}+${apellido}&background=random&size=256`,

            // --- PLANES Y NEGOCIO ---
            plan: planSeleccionado,
            verificado: verificado,
            es_24hs: Math.random() > 0.7,
            precio_desde: `$${randomInt(10, 40)}.000`,

            // --- ESTADÍSTICAS (Variadas para realismo) ---
            promedio: parseFloat(randomFloat(3.5, 5.0)),
            total_votos: randomInt(0, 80),
            likes: randomInt(0, 150),
            vistas_perfil: randomInt(20, 800),
            contactos_whatsapp: randomInt(1, 60),

            // --- UBICACIÓN EXACTA (Simulada) ---
            ubicacion_exacta: {
                lat: lat,
                lng: lng,
                direccion: `Calle Falsa ${randomInt(100, 5000)}, ${zonaEspecifica}`
            },

            // --- ETIQUETAS (Usando los subtrades reales) ---
            etiquetas: [rubroNombre, ...subRubrosElegidos, planSeleccionado === "experto" ? "Destacado" : "Profesional"],

            // --- COTIZADOR ---
            presupuestos_config: {
                activo: true,
                mensaje_base: `Hola, soy ${rubroNombre}. Contame qué necesitas arreglar en ${subRubrosElegidos[0]} o similar.`,
                servicios: subRubrosElegidos.map(sub => ({
                    nombre: sub,
                    precio_min: randomInt(15000, 30000),
                    precio_max: randomInt(35000, 60000),
                    descripcion: "Mano de obra y revisión técnica."
                }))
            },

            portfolio: [],
            portfolio_categorizado: { "Trabajos Realizados": [] },

            createdAt: new Date()
        };

        promesas.push(db.collection('profesionales').add(nuevoPerfil));
    }

    await Promise.all(promesas);
    console.log(`✅ ¡Éxito! ${batchSize} perfiles creados.`);
    console.log(`🗺️ Distribuidos en: CABA, GBA (Norte, Sur, Oeste) y Provincias.`);
    console.log(`💼 Rubros actualizados con sub-categorías reales.`);
    console.log(`⭐ Planes variados: Gratuito, Profesional, Impulso, Experto.`);
}

// Ejecutar la función
crearPerfiles().catch(console.error);
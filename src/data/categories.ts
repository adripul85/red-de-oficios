export interface Trade {
    name: string;
    subtrades: string[];
}

export interface CategoryGroup {
    group: string;
    trades: Trade[];
}

export const CATEGORIES: CategoryGroup[] = [
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

export const ALL_TRADES = CATEGORIES.flatMap(cat => cat.trades.map(t => t.name));

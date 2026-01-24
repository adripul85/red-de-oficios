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
        group: "Urgencias e Instalaciones Criticas",
        trades: [
            { name: "Plomero", subtrades: ["Canerias", "Tanques", "Bombas de agua", "Filtraciones"] },
            { name: "Electricista", subtrades: ["Tableros", "Cortocircuitos", "Cableados", "Iluminacion"] },
            { name: "Gasista", subtrades: ["Instalaciones aprobadas", "Estufas", "Termotanques", "Cocinas"] },
            { name: "Cerrajero", subtrades: ["Urgencias 24hs", "Cambio de combinacion", "Apertura de autos/casas"] },
            { name: "Destapaciones", subtrades: ["Cloacas", "Pluviales", "Camaras septicas"] },
            { name: "Tecnico de Aire Acondicionado", subtrades: ["Instalacion", "Carga de gas", "Limpieza", "Service"] },
            { name: "Tecnico de Electrodomesticos", subtrades: ["Lavarropas", "Heladeras", "Microondas"] }
        ]
    },
    {
        group: "Construccion, Reformas e Infraestructura",
        trades: [
            { name: "Albanil", subtrades: ["Cimientos", "Paredes", "Revoques", "Losas"] },
            { name: "Techista", subtrades: ["Filtraciones", "Membranas", "Techos de teja o chapa"] },
            { name: "Pintor", subtrades: ["Interiores", "Exteriores", "Altura", "Durlock"] },
            { name: "Durlockero", subtrades: ["Tabiques", "Cielorrasos", "Muebles de placa de yeso"] },
            { name: "Colocador de Pisos/Ceramista", subtrades: ["Porcelanato", "Flotantes", "Pulido de parque"] },
            { name: "Herrero", subtrades: ["Rejas", "Portones", "Estructuras metalicas", "Soldadura"] },
            { name: "Carpintero", subtrades: ["Muebles a medida", "Aberturas", "Restauracion de maderas"] },
            { name: "Vidriero", subtrades: ["Reparacion de vidrios", "Mamparas de bano", "Espejos"] }
        ]
    },
    {
        group: "Mantenimiento, Estetica y Oficios Clasicos",
        trades: [
            { name: "Jardinero", subtrades: ["Corte de cesped", "Poda de altura", "Paisajismo"] },
            { name: "Piletero", subtrades: ["Mantenimiento de piscinas", "Pintura", "Bombas"] },
            { name: "Persianista", subtrades: ["Reparacion de persianas de PVC", "Madera", "Aluminio"] },
            { name: "Tapicero", subtrades: ["Restauracion de sillones", "Sillas", "Sommiers", "Autos"] },
            { name: "Sastre / Modista", subtrades: ["Arreglos de ropa", "Confeccion", "Cierres", "Dobladillos"] },
            { name: "Zapatero", subtrades: ["Reparacion de calzado", "Cambio de suelas"] },
            { name: "Relojero", subtrades: ["Reparacion de relojes de pulsera", "Pared"] },
            { name: "Matricero", subtrades: ["Moldes", "Piezas tecnicas"] }
        ]
    },
    {
        group: "Eventos, Gastronomia y Logistica",
        trades: [
            { name: "Pastelero/a", subtrades: ["Tortas personalizadas", "Mesas dulces", "Eventos"] },
            { name: "Souvenirs", subtrades: ["Personalizados", "Eventos", "Regalos corporativos", "Artesanias"] },
            { name: "DJ / Sonido", subtrades: ["Musicalizacion de fiestas", "Iluminacion"] },
            { name: "Fletero", subtrades: ["Mudanzas", "Traslados cortos", "Repartos"] },
            { name: "Fumigador", subtrades: ["Control de plagas", "Desinfeccion"] }
        ]
    },
    {
        group: "Estetica y Cuidado Personal",
        trades: [
            { name: "Peinador / Estilista", subtrades: ["Cortes", "Peinados para eventos"] },
            { name: "Barbero", subtrades: ["Corte de barba", "Cabello masculino"] },
            { name: "Maquillador / Maquilladora", subtrades: ["Social", "Novias", "Artistico"] },
            { name: "Manicura / Pedicura", subtrades: ["Cuidado de unas", "Manos"] }
        ]
    },
    {
        group: "Seguridad y Tecnologia",
        trades: [
            { name: "Instalador de Camaras de Seguridad", subtrades: ["Alarmas", "CCTV", "Domotica"] },
            { name: "Tecnico de PC / Celulares", subtrades: ["Reparacion de software", "Hardware"] }
        ]
    }
];

export const ALL_TRADES = CATEGORIES.flatMap(cat => cat.trades.map(t => t.name));

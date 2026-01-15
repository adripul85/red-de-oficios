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
        group: "Construcción y Reformas",
        trades: [
            { name: "Albañil", subtrades: ["Cimientos", "Paredes", "Revoques", "Losa", "Encadenado"] },
            { name: "Pintor", subtrades: ["Interiores", "Exteriores", "Altura", "Durlock", "Impermeabilización"] },
            { name: "Techista", subtrades: ["Filtraciones", "Membranas", "Tejas", "Chapa", "Zinguería"] },
            { name: "Colocador de Pisos/Ceramista", subtrades: ["Porcelanato", "Flotantes", "Pulido", "Zócalos", "Revestimientos"] },
            { name: "Durlockero", subtrades: ["Tabiques", "Cielorrasos", "Muebles", "Estanterías", "Aislaciones"] },
            { name: "Herrero", subtrades: ["Rejas", "Portones", "Estructuras", "Soldadura", "Reparaciones"] },
            { name: "Carpintero", subtrades: ["Muebles a medida", "Aberturas", "Restauración", "Placards", "Deck"] }
        ]
    },
    {
        group: "Instalaciones y Mantenimiento Urgente",
        trades: [
            { name: "Plomero", subtrades: ["Cañerías", "Tanques", "Bombas de agua", "Grifería", "Filtraciones"] },
            { name: "Electricista Matriculado", subtrades: ["Tableros", "Cableados", "Cortocircuitos", "Iluminación", "Medidores"] },
            { name: "Gasista Matriculado", subtrades: ["Estufas", "Termotanques", "Calefones", "Fugas", "Planos"] },
            { name: "Técnico de Aire Acondicionado", subtrades: ["Instalación", "Carga de gas", "Limpieza", "Reparación"] },
            { name: "Destapaciones", subtrades: ["Cloacas", "Pluviales", "Cámaras sépticas", "Cocinas", "Baños"] }
        ]
    },
    {
        group: "Carpintería Metálica y Vidriería",
        trades: [
            { name: "Vidriero", subtrades: ["Reposición", "Mamparas", "Espejos", "Doble Vidrio", "Ventanales"] },
            { name: "Cerrajero", subtrades: ["Urgencias 24hs", "Cambio de combinación", "Autos", "Cajas fuertes"] },
            { name: "Persianista", subtrades: ["PVC", "Madera", "Aluminio", "Cambio de cinta", "Motores"] }
        ]
    },
    {
        group: "Exteriores y Logística",
        trades: [
            { name: "Jardinero", subtrades: ["Corte de pasto", "Poda", "Paisajismo", "Mantenimiento", "Huertas"] },
            { name: "Piletero", subtrades: ["Limpieza", "Pintura", "Bombas", "Filtros", "Climatización"] },
            { name: "Fletero", subtrades: ["Mudanzas", "Cortadistancia", "Repartos", "Mini flete"] },
            { name: "Fumigador", subtrades: ["Cucarachas", "Roedores", "Desinfección", "Jardín"] }
        ]
    },
    {
        group: "Servicios Especializados",
        trades: [
            { name: "Tapicero", subtrades: ["Sillones", "Sillas", "Autos", "Resortes", "Fundas"] },
            { name: "Técnico de Electrodomésticos", subtrades: ["Lavarropas", "Heladeras", "Microondas", "Secarropas"] },
            { name: "Instalador de Cámaras de Seguridad", subtrades: ["CCTV", "IP", "Sensores", "Monitoreo", "Porteros"] }
        ]
    },
    {
        group: "Estética y Cuidado Personal",
        trades: [
            { name: "Peinador / Estilista", subtrades: ["Cortes", "Color", "Peinados", "Alisados"] },
            { name: "Maquillador / Maquilladora", subtrades: ["Social", "Novias", "Artístico", "Eventos"] },
            { name: "Barbero", subtrades: ["Corte", "Barba", "Perfilado", "Diseños"] },
            { name: "Manicura / Pedicura", subtrades: ["Esmaltado", "Esculpidas", "Limpieza", "Spa"] }
        ]
    },
    {
        group: "Oficios de Reparación y Confección",
        trades: [
            { name: "Zapatero", subtrades: ["Suelas", "Tacos", "Teñido", "Horma", "Costuras"] },
            { name: "Sastre / Modista", subtrades: ["Ruedos", "Cierres", "Ajustes", "Vestidos", "Trajes"] },
            { name: "Relojero", subtrades: ["Pilas", "Mallas", "Mecanismos", "Restauración"] }
        ]
    }
];

export const ALL_TRADES = CATEGORIES.flatMap(cat => cat.trades.map(t => t.name));

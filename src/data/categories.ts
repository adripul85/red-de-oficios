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
        group: "🚨 Urgencias 24hs",
        trades: [
            { name: "Plomero (Urgencias)", subtrades: ["Filtraciones", "Cañerías", "Bombas", "Destapaciones"] },
            { name: "Electricista (Urgencias)", subtrades: ["Cortocircuitos", "Tableros", "Fase", "Térmicas"] },
            { name: "Gasista (Urgencias)", subtrades: ["Fugas", "Estufas", "Calefones", "Planos"] },
            { name: "Cerrajero (24hs)", subtrades: ["Aperturas", "Cerraduras", "Puertas blindadas", "Automóviles"] }
        ]
    },
    {
        group: "🏗️ Construcción y Obra",
        trades: [
            { name: "Albañil", subtrades: ["Cimientos", "Paredes", "Revoques", "Losa", "Encadenado"] },
            { name: "Pintor", subtrades: ["Interiores", "Exteriores", "Altura", "Durlock", "Impermeabilización"] },
            { name: "Techista", subtrades: ["Filtraciones", "Membranas", "Tejas", "Chapa", "Zinguería"] },
            { name: "Colocador de Pisos / Revestimientos", subtrades: ["Porcelanato", "Flotantes", "Pulido", "Zócalos", "Revestimientos"] },
            { name: "Durlockero", subtrades: ["Tabiques", "Cielorrasos", "Muebles", "Estanterías", "Aislaciones"] },
            { name: "Herrero", subtrades: ["Rejas", "Portones", "Estructuras", "Soldadura", "Reparaciones"] },
            { name: "Carpintero", subtrades: ["Muebles a medida", "Aberturas", "Restauración", "Placards", "Deck"] }
        ]
    },
    {
        group: "🌿 Mantenimiento y Hogar",
        trades: [
            { name: "Jardinero", subtrades: ["Poda", "Césped", "Riego", "Mantenimiento", "Paisajismo"] },
            { name: "Piletero", subtrades: ["Limpieza", "Mantenimiento", "Filtros", "Bombas", "Pintura"] },
            { name: "Persianista", subtrades: ["Cintas", "Cambio de lamas", "Motorización", "Ejes", "PVC/Madera"] },
            { name: "Vidriero", subtrades: ["DVH", "Templado", "Reparación", "Colocación", "Espejos"] },
            { name: "Fumigador", subtrades: ["Cucarachas", "Hormigas", "Ratones", "Mosquitos", "Desinfección"] },
            { name: "Limpieza", subtrades: ["Fin de obra", "Casas/Deptos", "Oficinas", "Vidrios", "Tapizados"] }
        ]
    },
    {
        group: "🚛 Servicios y Logística",
        trades: [
            { name: "Fletero / Mudanzas", subtrades: ["Mini flete", "Mudanza completa", "Carga/Descarga", "Embalaje", "Interior"] },
            { name: "Técnico de Aire Acondicionado", subtrades: ["Instalación", "Carga de gas", "Limpieza", "Service Anual", "Service Reparación"] },
            { name: "Técnico de Electrodomésticos", subtrades: ["Lavarropas", "Heladeras", "Hornos", "Microondas", "Secarropas"] },
            { name: "Instalador de Cámaras y Alarmas", subtrades: ["CCTV", "Alarmas", "Interiores", "Exteriores", "Configuración de App"] }
        ]
    },
    {
        group: "💇 Estética y Cuidado",
        trades: [
            { name: "Peluquero / Estilista", subtrades: ["Corte", "Color", "Alisados", "Peinados", "Barbería"] },
            { name: "Manicura / Pedicura", subtrades: ["Esmaltado", "Uñas esculpidas", "Limpieza", "Tratamientos", "Diseño"] },
            { name: "Maquillador / Maquilladora", subtrades: ["Social", "Novias", "Eventos", "Cursos", "Automaquillaje"] },
            { name: "Masajista", subtrades: ["Descontracturante", "Relajante", "Deportivo", "Piedras calientes", "Kinesiología"] }
        ]
    },
    {
        group: "🥳 Eventos y Otros",
        trades: [
            { name: "Pastelero / Catering", subtrades: ["Tortas", "Mesa dulce", "Salado", "Viandas", "Eventos"] },
            { name: "DJ / Sonidista", subtrades: ["Fiestas", "Iluminación", "Sonido", "Cumpleaños", "Bodas"] },
            { name: "Tapicero", subtrades: ["Sillones", "Sillas", "Butacas auto", "Restauración", "Cuerinas/Telas"] },
            { name: "Zapatero / Modista", subtrades: ["Arreglo zapatos", "Ropa a medida", "Remiendos", "Cierres", "Dobladillos"] }
        ]
    }
];

export const ALL_TRADES = CATEGORIES.flatMap(cat => cat.trades.map(t => t.name));

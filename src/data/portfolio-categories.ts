export const PORTFOLIO_CATEGORIES_BY_TRADE: Record<string, string[]> = {
    // Construcción y Reformas
    "Albañil": ["Baños Terminados", "Cocinas y Reformas", "Pisos y Revestimientos", "Obras Completas", "Parrillas y Exteriores"],
    "Pintor": ["Interiores", "Exteriores y Fachadas", "Impermeabilización", "Detalles Decorativos", "Antes y Después"],
    "Techista": ["Techos de Teja", "Techos de Chapa", "Impermeabilización", "Zinguería", "Reparaciones"],
    "Colocador de Pisos/Ceramista": ["Porcelanato", "Cerámicos", "Pisos Flotantes/Madera", "Baños y Cocinas", "Exteriores"],
    "Durlockero": ["Cielorrasos", "Tabiques Divisorios", "Muebles y Estanterías", "Diseños Especiales", "Aislaciones"],
    "Herrero": ["Rejas y Seguridad", "Portones", "Escaleras y Barandas", "Muebles Industriales", "Estructuras"],
    "Carpintero": ["Muebles a Medida", "Cocinas y Placards", "Aberturas", "Restauración", "Decks y Pérgolas"],

    // Instalaciones
    "Plomero": ["Baños Completos", "Cocinas", "Instalaciones de Agua", "Desagües y Cloacas", "Bombas y Tanques"],
    "Electricista Matriculado": ["Tableros y Seguridad", "Iluminación", "Cableados", "Obras Nuevas", "Automatización"],
    "Gasista Matriculado": ["Instalaciones de Gas", "Estufas y Calefacción", "Termotanques/Calefones", "Planos y Trámites", "Reparaciones"],
    "Técnico de Aire Acondicionado": ["Instalaciones", "Reparaciones", "Mantenimiento", "Pre-instalaciones", "Equipos Industriales"],

    // Estética
    "Jardinero": ["Mantenimiento", "Paisajismo", "Poda", "Huertas", "Limpieza de Terrenos"],
    "Piletero": ["Mantenimiento y Limpieza", "Pintura y Reparaciones", "Instalación de Equipos", "Climatización", "Construcción"],

    // Default
    "default": ["Trabajos Destacados", "Antes y Después", "Proceso de Trabajo", "Detalles", "Otros"]
};

export const getPortfolioCategories = (trade: string): string[] => {
    // Normalizar strings si es necesario o buscar coincidencia exacta
    return PORTFOLIO_CATEGORIES_BY_TRADE[trade] || PORTFOLIO_CATEGORIES_BY_TRADE["default"];
};

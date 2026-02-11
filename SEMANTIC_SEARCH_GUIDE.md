# Guía de Uso: Búsqueda Semántica con IA

## 🎯 ¿Qué es la Búsqueda Semántica?

La búsqueda semántica permite a los usuarios describir problemas en lenguaje natural y encontrar resultados relevantes, incluso sin usar las palabras exactas.

**Ejemplo:**

- Usuario escribe: "tengo humedad en el techo"
- Sistema encuentra: Impermeabilizadores, Albañiles, Plomeros
- Sin IA necesitaría buscar exactamente "Impermeabilizador"

## 📦 Componentes Implementados

### 1. Cloud Functions (`functions/src/index.ts`)

**Funciones disponibles:**

#### `onSolicitudCreated` (Trigger Automático)

Se ejecuta automáticamente cuando se crea una solicitud nueva.

- Genera embedding del texto usando Vertex AI (`text-multilingual-embedding-002`)
- Guarda el vector en Firestore

#### `onProfessionalWritten` (Trigger Automático)

Se ejecuta automáticamente cuando se crea o actualiza un perfil profesional.

- Genera embedding del perfil (rubro, descripción, zona)
- Guarda el vector en Firestore

#### `semanticSearch` (Callable)

Búsqueda semántica de solicitudes.

```typescript
// Desde el frontend:
const results = await searchSolicitudes(
  "se me rompió un caño",
  "CABA",
  10
);
```

#### `findProfessionals` (Callable)

Busca profesionales por descripción de necesidad.

```typescript
const pros = await findProfessionalsByDescription(
  "necesito arreglar la electricidad",
  "CABA"
);
```

### 2. Cliente Frontend (`src/firebase/semanticSearch.ts`)

Funciones helper para llamar a las Cloud Functions desde Astro/React.

## 🚀 Cómo Usar en Oportunidades

### Opción 1: Búsqueda Mejorada (Recomendado)

Agregar input de búsqueda semántica en `oportunidades.astro`:

```typescript
import { searchSolicitudes } from "../../firebase/semanticSearch";

// En el script de la página:
async function buscarConIA(query: string) {
  try {
    const results = await searchSolicitudes(query, miZona);
    
    // Mostrar resultados ordenados por relevancia
    renderOportunidades(results);
  } catch (error) {
    console.error("Error en búsqueda:", error);
    // Fallback a búsqueda tradicional
  }
}
```

### Opción 2: Sugerencias Automáticas

Cuando el profesional ve una solicitud, sugerir otras similares:

```typescript
// Al abrir una solicitud:
const solicitudActual = "Reparación de filtración en baño";

const similares = await searchSolicitudes(
  solicitudActual,
  undefined, // todas las zonas
  5 // top 5
);

// Mostrar: "También te puede interesar..."
```

## 📊 Estructura de Datos

### Solicitud con Embedding

```typescript
{
  id: "abc123",
  detalle: "Tengo humedad en la pared del living",
  rubro: "Albañilería",
  zona: "CABA",
  fecha: Timestamp,
  embedding: [0.123, 0.456, ...], // 768 números
  embeddingGeneratedAt: Timestamp
}
```

### Profesional con Embedding

```typescript
{
  id: "prof123",
  nombre: "Juan Perez",
  rubro_principal: "Plomero",
  descripcion: "Especialista en filtraciones",
  zona: "CABA",
  embedding: [0.123, 0.456, ...], // 768 números
  embeddingGeneratedAt: Timestamp
}
```

## 🔧 Próximos Pasos

### 1. Habilitar Vertex AI (IMPORTANTE)

Asegúrate de que la API de Vertex AI esté habilitada en Google Cloud Console para el proyecto.

```bash
# En Google Cloud Console:
# 1. Ir a https://console.cloud.google.com
# 2. Seleccionar proyecto
# 3. Buscar "Vertex AI API"
# 4. Hacer clic en "Habilitar"
```

### 2. Migrar Datos Existentes

Para solicitudes y profesionales antiguos que no tienen embeddings, se necesita un script de migración que recorra la colección y genere los embeddings.

## 💰 Costos Estimados

| Operación | Costo | Ejemplo |
|-----------|-------|---------|
| Generar embedding | $0.000025/request | 1000 items = $0.025 |
| Búsqueda | Gratis (cálculo local en Cloud Function) | Ilimitado |
| Cloud Function | $0.40/millón | 10k búsquedas = $0.004 |

**Total mensual estimado (1000 items + 5000 búsquedas): ~$0.03**

## 🧪 Testing

### Probar Localmente

```bash
cd functions
npm run serve
```

### Probar en Producción

```bash
firebase deploy --only functions
```

## 📚 Recursos

- [Vertex AI Text Embeddings](https://cloud.google.com/vertex-ai/docs/generative-ai/embeddings/get-text-embeddings)
- [Firebase Functions](https://firebase.google.com/docs/functions)
- [Similitud de Coseno](https://en.wikipedia.org/wiki/Cosine_similarity)

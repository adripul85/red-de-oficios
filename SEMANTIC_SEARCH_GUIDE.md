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

- Genera embedding del texto
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

### Resultado de Búsqueda

```typescript
{
  id: "abc123",
  data: {
    detalle: "...",
    rubro: "...",
    zona: "...",
    clienteNombre: "..."
  },
  similarity: 0.85 // 0-1, mayor = más similar
}
```

## 🔧 Próximos Pasos

### 1. Habilitar Vertex AI (IMPORTANTE)

```bash
# En Google Cloud Console:
# 1. Ir a https://console.cloud.google.com
# 2. Seleccionar proyecto "red-oficios-lucas"
# 3. Buscar "Vertex AI API"
# 4. Hacer clic en "Habilitar"
```

### 2. Implementar Embeddings Reales

Actualmente usa embeddings simulados. Para producción:

```typescript
// Reemplazar en functions/src/index.ts
import {PredictionServiceClient} from "@google-cloud/aiplatform";

async function generateEmbedding(text: string): Promise<number[]> {
  const client = new PredictionServiceClient();
  const endpoint = `projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL}`;
  
  const [response] = await client.predict({
    endpoint,
    instances: [{content: text}],
  });
  
  return response.predictions[0].embeddings.values;
}
```

### 3. Migrar Solicitudes Existentes

Ejecutar script para agregar embeddings a solicitudes antiguas:

```bash
# Crear script: functions/src/migrateEmbeddings.ts
# Ejecutar: npm run migrate
```

### 4. Integrar en Frontend

Modificar `oportunidades.astro` para usar búsqueda semántica.

## 💰 Costos Estimados

| Operación | Costo | Ejemplo |
|-----------|-------|---------|
| Generar embedding | $0.000025/request | 1000 solicitudes = $0.025 |
| Búsqueda | Gratis (cálculo local) | Ilimitado |
| Cloud Function | $0.40/millón | 10k búsquedas = $0.004 |

**Total mensual estimado (1000 solicitudes + 5000 búsquedas): ~$0.03**

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

### Ejemplo de Prueba

```typescript
// En consola del navegador:
const { searchSolicitudes } = await import("./firebase/semanticSearch");

const results = await searchSolicitudes("tengo humedad");
console.log(results);
```

## ⚠️ Notas Importantes

1. **Embeddings Simulados**: La versión actual usa embeddings aleatorios para testing
2. **Vertex AI**: Necesitas habilitarlo en Google Cloud Console
3. **Costos**: Muy bajos (~$0.03/mes para 1000 solicitudes)
4. **Performance**: Primera búsqueda puede tardar ~2s, luego es instantánea

## 📚 Recursos

- [Vertex AI Text Embeddings](https://cloud.google.com/vertex-ai/docs/generative-ai/embeddings/get-text-embeddings)
- [Firebase Functions](https://firebase.google.com/docs/functions)
- [Similitud de Coseno](https://en.wikipedia.org/wiki/Cosine_similarity)

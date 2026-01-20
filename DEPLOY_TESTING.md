# Guía Rápida: Deploy de Testing

## 🚀 Deploy Ahora (Con Embeddings Simulados)

### Paso 1: Verificar Build

```bash
cd functions
npm run build
```

✅ Ya completado - Build exitoso

### Paso 2: Deploy a Firebase

```bash
firebase deploy --only functions
```

Esto desplegará:

- `onSolicitudCreated` - Trigger automático
- `semanticSearch` - Búsqueda semántica
- `findProfessionals` - Buscar profesionales

**Tiempo estimado:** 2-3 minutos

### Paso 3: Probar las Funciones

Una vez desplegado, puedes probar desde la consola del navegador:

```javascript
// Importar cliente
import { searchSolicitudes } from "./firebase/semanticSearch";

// Probar búsqueda
const results = await searchSolicitudes("tengo humedad en la pared", "CABA");
console.log(results);
```

## ⚠️ Importante: Embeddings Simulados

**Estado actual:**

- ✅ Infraestructura completa funcionando
- ✅ Todas las funciones operativas
- ⚠️ Resultados aleatorios (embeddings simulados)

**Qué esperar:**

- La búsqueda funcionará
- Retornará resultados
- Los resultados NO serán relevantes (son aleatorios)

## 🔄 Migración a Producción (Cuando estés listo)

### Opción A: Vertex AI (Recomendado)

1. Habilitar Vertex AI en Google Cloud Console
2. Actualizar `functions/src/index.ts`:

```typescript
import {PredictionServiceClient} from "@google-cloud/aiplatform";

async function generateEmbedding(text: string): Promise<number[]> {
  const client = new PredictionServiceClient();
  const endpoint = `projects/red-oficios-lucas/locations/us-central1/publishers/google/models/text-embedding-004`;
  
  const [response] = await client.predict({
    endpoint,
    instances: [{content: text}],
  });
  
  return response.predictions[0].embeddings.values;
}
```

1. Re-deploy: `firebase deploy --only functions`

### Opción B: OpenAI (Alternativa)

1. Obtener API key de OpenAI
2. Instalar: `npm install openai`
3. Actualizar función (ver documentación)

## 📊 Costos

**Testing (Actual):**

- Gratis (embeddings simulados)

**Producción (Vertex AI):**

- ~$0.03/mes para 1000 solicitudes

## ✅ Checklist de Deploy

- [x] Build exitoso
- [ ] Ejecutar `firebase deploy --only functions`
- [ ] Verificar en Firebase Console
- [ ] Probar desde frontend
- [ ] (Futuro) Habilitar Vertex AI para producción

## 🎯 Próximo Paso

Ejecuta en la terminal:

```bash
firebase deploy --only functions
```

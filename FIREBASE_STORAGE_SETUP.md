# 🔥 Configuración de Firebase Storage

## Paso 1: Desplegar Reglas de Seguridad

Las reglas de seguridad están en el archivo `storage.rules`. Para desplegarlas:

### Opción A: Desde la Consola de Firebase (Recomendado)

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. En el menú lateral, ve a **Storage** → **Rules**
4. Copia y pega el contenido del archivo `storage.rules`
5. Click en **Publicar**

### Opción B: Usando Firebase CLI

Si tienes Firebase CLI instalado:

```bash
# Instalar Firebase CLI (si no lo tienes)
npm install -g firebase-tools

# Login
firebase login

# Inicializar (solo primera vez)
firebase init storage

# Desplegar reglas
firebase deploy --only storage:rules
```

## Paso 2: Verificar Configuración

1. En Firebase Console → Storage
2. Verifica que el bucket esté creado
3. Las reglas deberían permitir:
   - ✅ Lectura pública de imágenes
   - ✅ Escritura solo para usuarios autenticados (sus propias imágenes)
   - ✅ Límite de 5MB por imagen
   - ✅ Solo formatos de imagen

## Estructura de Archivos en Storage

```
storage/
├── portfolios/
│   ├── {userId}/
│   │   ├── banos_terminados/
│   │   │   ├── 1234567890_imagen1.jpg
│   │   │   └── 1234567891_imagen2.jpg
│   │   ├── instalaciones_electricas/
│   │   └── trabajos_generales/
└── avatars/ (futuro)
```

## Límites del Plan Gratuito

- **Almacenamiento**: 5 GB total
- **Descarga**: 1 GB/día
- **Operaciones**: 50,000 lecturas/día, 20,000 escrituras/día

## Monitoreo de Uso

Para ver el uso actual:

1. Firebase Console → Storage → Usage
2. Monitorear especialmente las descargas diarias

## Troubleshooting

### Error: "Storage bucket not configured"

- Verifica que `storageBucket` esté en `.env`
- Debe ser: `{project-id}.appspot.com`

### Error: "Permission denied"

- Verifica que las reglas estén desplegadas
- Verifica que el usuario esté autenticado

### Imágenes no se comprimen

- Verifica que el navegador soporte Canvas API
- Revisa la consola del navegador para errores

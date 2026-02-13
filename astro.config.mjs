// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';

import sitemap from '@astrojs/sitemap';

// Si prefieres usar Node.js (para VPS o Render), descomenta la línea de abajo y comenta la de vercel
// import node from '@astrojs/node';

export default defineConfig({
  // URL de producción para sitemap y canonicals
  site: 'https://deoficios.com.ar',

  // 'server' es obligatorio porque usamos autenticación y base de datos en vivo (SSR)
  output: 'server',

  // ADAPTADOR: Conecta tu código con el servidor
  adapter: vercel(),

  // Si usaras Node.js, sería así:
  // adapter: node({ mode: 'standalone' }),

  // INTEGRACIONES: Tailwind re-activado
  integrations: [tailwind(), react(), sitemap()],

  // PERFORMANCE
  prefetch: true,
  compressHTML: true,

  // VITE: Configuraciones extra del empaquetador (limpio por ahora)
  vite: {
    build: {
      // Esto ayuda a evitar conflictos con librerías antiguas de JS
      target: 'esnext'
    }
  }
});
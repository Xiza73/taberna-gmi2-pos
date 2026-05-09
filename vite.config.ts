import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

/**
 * Convención de puertos del workspace (definida en `backend/.env`):
 *   5173 = ecommerce
 *   5174 = backoffice
 *   5175 = pos (este front)
 *
 * PWA: precachea el app shell (todos los assets buildeados) y deja
 * `runtimeCaching` para las llamadas a la API. Por ahora la API NO se
 * cachea — la mayoría de mutations POS necesitan online (validar stock,
 * cancelar, etc.). El caching real del catálogo + cola offline de ventas
 * vive en Dexie/IndexedDB, manejado a nivel app (no SW).
 */
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      devOptions: {
        // Habilita el SW también en `pnpm dev` para poder probar offline en local.
        enabled: true,
        type: 'module',
      },
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'POS Lumière',
        short_name: 'POS',
        description: 'Punto de venta para Lumière',
        theme_color: '#0a0b0f',
        background_color: '#0a0b0f',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        scope: '/',
        // SVG icon es suficiente para Chrome/Firefox/Edge modernos en
        // tablets Android y desktop. Para iOS Safari "Add to Home Screen"
        // se necesitan PNGs (180x180 apple-touch-icon, 192x192, 512x512).
        // TODO: generar PNGs desde el branding final con
        // `pwa-assets-generator` o equivalente antes de producción.
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,ico,woff2}'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5175,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});

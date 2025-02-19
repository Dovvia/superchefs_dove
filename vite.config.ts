import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from 'vite-plugin-pwa';
import path from "path";


// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 3000,
  },
  plugins: [
    react(),
    VitePWA({
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/ckkvnnphgceesuftupyj\.supabase\.co\//,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-api",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 86400,
              },
            },
          },
        ],
      },

      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon.ico', 'robots.txt', 'apple-touch-icon.png', 'favicon-16x16.png', 'favicon-32x32.png', 'safari-pinned-tab.svg', 'site.webmanifest', 'mstile-150x150.png'],
      manifest: {
        name: 'Dovvia',
        short_name: 'Dovvia',
        description: 'Dovvia is a platform for businesses to administer and manage their operations easily.',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'dovvia-logo.png',
            sizes: 'any',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'apple-touch-icon.png',
            sizes: 'any',
            type: 'image/png',
          },
          {
            src: 'dovvia-logo.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'dovvia-logo.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'safari-pinned-tab.svg',
            sizes: 'any',
            type: 'image/svg+xml',
          },
          {
            src: 'site.webmanifest',
            sizes: 'any',
            type: 'application/manifest+json',
          },
          {
            src: 'mstile-150x150.png',
            sizes: '150x150',
            type: 'image/png',
          },
        ],
      },
      devOptions: {
        enabled: true,
      },
    }),],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      devOptions: {
        enabled: true,
      },
      manifest: {
        name: "BodyWise AI",
        short_name: "BodyWise",
        description: "AI-powered Health & Wellness Platform",
        lang: "en",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        theme_color: "#0F172A",
        background_color: "#0F172A",
        categories: ["health", "fitness", "medical", "lifestyle"],
        prefer_related_applications: false,
        icons: [
          {
            src: "icons/icon-72x72.png",
            sizes: "72x72",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "icons/maskable-icon-72x72.png",
            sizes: "72x72",
            type: "image/png",
            purpose: "maskable"
          },
          {
            src: "icons/icon-96x96.png",
            sizes: "96x96",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "icons/maskable-icon-96x96.png",
            sizes: "96x96",
            type: "image/png",
            purpose: "maskable"
          },
          {
            src: "icons/icon-128x128.png",
            sizes: "128x128",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "icons/maskable-icon-128x128.png",
            sizes: "128x128",
            type: "image/png",
            purpose: "maskable"
          },
          {
            src: "icons/icon-144x144.png",
            sizes: "144x144",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "icons/maskable-icon-144x144.png",
            sizes: "144x144",
            type: "image/png",
            purpose: "maskable"
          },
          {
            src: "icons/icon-152x152.png",
            sizes: "152x152",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "icons/maskable-icon-152x152.png",
            sizes: "152x152",
            type: "image/png",
            purpose: "maskable"
          },
          {
            src: "icons/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "icons/maskable-icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable"
          },
          {
            src: "icons/icon-384x384.png",
            sizes: "384x384",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "icons/maskable-icon-384x384.png",
            sizes: "384x384",
            type: "image/png",
            purpose: "maskable"
          },
          {
            src: "icons/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "icons/maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable"
          }
        ],
        shortcuts: [
          {
            name: "Dashboard",
            url: "/",
            icons: [{ src: "icons/icon-192x192.png", sizes: "192x192" }]
          },
          {
            name: "Analyze Signals",
            url: "/analyze",
            icons: [{ src: "icons/icon-192x192.png", sizes: "192x192" }]
          },
          {
            name: "AI Coach",
            url: "/coach",
            icons: [{ src: "icons/icon-192x192.png", sizes: "192x192" }]
          },
          {
            name: "History Logs",
            url: "/history",
            icons: [{ src: "icons/icon-192x192.png", sizes: "192x192" }]
          },
          {
            name: "Calorie Tracker",
            url: "/calories",
            icons: [{ src: "icons/icon-192x192.png", sizes: "192x192" }]
          },
          {
            name: "Profile Settings",
            url: "/profile",
            icons: [{ src: "icons/icon-192x192.png", sizes: "192x192" }]
          }
        ],
        screenshots: [
          {
            src: "icons/screenshot-desktop.png",
            sizes: "1280x720",
            type: "image/png",
            form_factor: "wide",
            label: "BodyWise AI Dashboard View"
          },
          {
            src: "icons/screenshot-mobile.png",
            sizes: "750x1334",
            type: "image/png",
            form_factor: "narrow",
            label: "BodyWise AI Mobile View"
          }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
        navigateFallback: "/offline.html",
        navigateFallbackDenylist: [/^\/api/, /^\/auth/, /supabase/, /realtime/],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === "navigate",
            handler: "NetworkFirst",
            options: {
              cacheName: "html-cache",
              expiration: { maxEntries: 10 },
              networkTimeoutSeconds: 3
            }
          },
          {
            urlPattern: ({ request }) => request.destination === "style",
            handler: "CacheFirst",
            options: {
              cacheName: "css-cache",
              expiration: { maxEntries: 20, maxAgeSeconds: 30 * 24 * 60 * 60 }
            }
          },
          {
            urlPattern: ({ request }) => request.destination === "script",
            handler: "CacheFirst",
            options: {
              cacheName: "js-cache",
              expiration: { maxEntries: 30, maxAgeSeconds: 30 * 24 * 60 * 60 }
            }
          },
          {
            urlPattern: ({ request }) => request.destination === "font",
            handler: "CacheFirst",
            options: {
              cacheName: "font-cache",
              expiration: { maxEntries: 10, maxAgeSeconds: 90 * 24 * 60 * 60 }
            }
          },
          {
            urlPattern: ({ request }) => request.destination === "image",
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "images-cache",
              expiration: { maxEntries: 50, maxAgeSeconds: 30 * 24 * 60 * 60 }
            }
          }
        ]
      }
    })
  ],
  server: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: true,
    allowedHosts: true,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/health": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: true,
    allowedHosts: true,
  },
});

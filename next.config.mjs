// next.config.mjs
import withPWA from 'next-pwa';

/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/e-checksheet-ga',
  assetPrefix: '/e-checksheet-ga',
  
  // ✅ Konfigurasi PWA untuk offline mode
  ...withPWA({
    dest: 'public',
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV === 'development',
    // ✅ Penting: sesuaikan scope dengan basePath
    scope: '/e-checksheet-ga/',
    sw: 'service-worker.js',
    // Runtime caching untuk resource statis
    runtimeCaching: [
      {
        // Cache gambar, font, dan static assets
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'imageCache',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 hari
          },
        },
      },
      {
        // Cache font
        urlPattern: /\.(?:woff|woff2|ttf|eot)$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'fontCache',
          expiration: {
            maxEntries: 30,
            maxAgeSeconds: 365 * 24 * 60 * 60, // 1 tahun
          },
        },
      },
      {
        // Cache halaman HTML - Network First (prioritas online)
        urlPattern: ({ url }) => {
          return url.pathname.startsWith('/e-checksheet-ga/') && 
                 url.pathname !== '/e-checksheet-ga/manifest.json';
        },
        handler: 'NetworkFirst',
        options: {
          cacheName: 'pageCache',
          networkTimeoutSeconds: 5,
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 7 hari
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      {
        // API calls - Network Only (jangan cache API, biar smartFetch yang handle)
        urlPattern: ({ url }) => url.pathname.includes('/api/'),
        handler: 'NetworkOnly',
      },
    ],
  }),
};

export default nextConfig;
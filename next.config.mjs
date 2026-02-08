import withPWA from '@ducanh2912/next-pwa';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Enable Turbopack config (silences warning about webpack)
  turbopack: {},

  // Image optimization for FPL player images and jerseys
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'resources.premierleague.com',
        pathname: '/premierleague/photos/players/**',
      },
      {
        protocol: 'https',
        hostname: 'fantasy.premierleague.com',
        pathname: '/dist/img/**',
      },
    ],
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};

const pwaConfig = withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fantasy\.premierleague\.com\/api\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'fpl-api-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 5,
        },
        networkTimeoutSeconds: 10,
      },
    },
    {
      urlPattern: /^https:\/\/resources\.premierleague\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'fpl-images-cache',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 60 * 60 * 24 * 30,
        },
      },
    },
    {
      urlPattern: /^https:\/\/fantasy\.premierleague\.com\/dist\/img\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'fpl-shirts-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 30,
        },
      },
    },
    {
      urlPattern: /\.(?:js|css)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-resources',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24,
        },
      },
    },
  ],
});

export default pwaConfig(nextConfig);

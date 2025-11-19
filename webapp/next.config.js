// Файл: webapp/next.config.js
const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,

  eslint: {
    ignoreDuringBuilds: true,
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  // Настройка Webpack
  webpack: (config) => {
    // Правильный алиас '@' → корень проекта webapp
    config.resolve.alias['@'] = path.join(__dirname);

    return config;
  },
};

module.exports = nextConfig;

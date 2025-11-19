// Файл: webapp/next.config.js
const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Отключаем строгий режим React, чтобы избежать двойного вызова useEffect в dev-режиме
  reactStrictMode: false,

  // Игнорируем ошибки линтинга при сборке (для ускорения и стабильности на Vercel)
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Игнорируем ошибки TypeScript при сборке
  typescript: {
    ignoreBuildErrors: true,
  },

  // Явная настройка Webpack для правильной работы путей в монорепозитории
  webpack: (config, { isServer }) => {
    // 1. Устанавливаем алиас '@/' на текущую папку (webapp)
    config.resolve.alias['@/'] = path.join(__dirname, './');

    // 2. Гарантируем, что Webpack ищет модули в правильной папке node_modules
    config.resolve.modules.push(path.resolve('./node_modules'));

    return config;
  },
};

// ✅ ИСПРАВЛЕНИЕ: Правильный синтаксис экспорта
module.exports = nextConfig;

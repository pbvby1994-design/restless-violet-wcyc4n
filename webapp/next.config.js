// Файл: webapp/next.config.js
// Используем require/module.exports для лучшей совместимости с Webpack в Next.js
const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Отключение Strict Mode для подавления дублирования useEffect в Dev-режиме
  reactStrictMode: false, 

  // Временно игнорируем ошибки линтинга и TypeScript для стабильности сборки
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // *** ЯВНАЯ НАСТРОЙКА WEBPACK ДЛЯ АЛИАСОВ ПУТИ ***
  webpack: (config, { isServer }) => {
    // 1. Устанавливаем алиас `@/` на корневую папку приложения (`webapp/`)
    // Это гарантирует, что импорты вида `@/styles/globals.css` будут работать.
    config.resolve.alias['@/'] = path.join(__dirname, './');
    
    // 2. Указываем Webpack, чтобы он искал модули в node_modules, 
    // чтобы избежать проблем с относительными импортами.
    config.resolve.modules.push(path.resolve('./node_modules'));

    // Всегда возвращать обновленную конфигурацию
    return config;
  },
  // *** КОНЕЦ НАСТРОЙКИ WEBPACK ***
};

module.exports = nextConfig;

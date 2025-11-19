// Используем require/module.exports для лучшей совместимости с Webpack в Next.js
const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Настройка Webpack для явного указания алиасов.
  // Это критично для монорепозиториев и решает проблему "falls outside of the project folder".
  webpack: (config, { isServer }) => {
    // Устанавливаем алиас `@/` на корневую папку приложения (`webapp/`)
    config.resolve.alias['@/'] = path.join(__dirname, './');
    
    // Также явно укажем пути для компонентов и стилей (для лучшей надежности)
    config.resolve.alias['@/components'] = path.join(__dirname, './components');
    config.resolve.alias['@/styles'] = path.join(__dirname, './styles');

    // Важно: всегда возвращать обновленную конфигурацию
    return config;
  },
};

module.exports = nextConfig;

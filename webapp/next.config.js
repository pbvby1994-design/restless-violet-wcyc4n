// Файл: webapp/next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Указывает Next.js, что результаты сборки нужно разместить в папке, 
  // которую Vercel ожидает после установки Root Directory в 'webapp'
  distDir: '.next', 
  
  // Включает общие настройки для статических файлов, если они не работают
  // output: 'export', // Только если вы не используете API-маршруты (но вы используете)
};

module.exports = nextConfig;

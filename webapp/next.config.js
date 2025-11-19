/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. Оптимизация производительности: Уменьшает размер бандла и улучшает холодный старт
  output: 'standalone', 

  // 2. Настройка заголовков для Edge Caching (Vercel)
  async headers() {
    return [
      {
        // Применяем кэширование ко всем статическим ресурсам (JS, CSS, изображения)
        source: '/_next/static/:path*',
        headers: [
          // Кэшируем на 1 год, что безопасно, так как Next.js сам управляет хешами
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // **Важно для API TTS: запрещаем кэширование на Edge и в браузере**, 
        // так как каждый ответ уникален для текста пользователя.
        source: '/api/tts/generate',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0, must-revalidate',
          },
        ],
      },
    ];
  },

  // 3. Указываем директорию для статических файлов
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').join(__dirname, 'webapp'),
    };
    return config;
  },

  // 4. Настройки ESLint (отключено для ускорения сборки, если не требуется)
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // 5. Настройки Transpile (если нужны для внешних пакетов, типа TWA SDK)
  transpilePackages: ['@twa-dev/sdk'],
};

module.exports = nextConfig;

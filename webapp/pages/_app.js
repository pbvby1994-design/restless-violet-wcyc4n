// Файл: webapp/pages/_app.js
// Основной файл приложения Next.js, который оборачивает все страницы.

import '../styles/globals.css'; 

// ✅ ДОБАВЛЯЕМ dynamic
import dynamic from 'next/dynamic'; 

// Импорты:
import { PlayerProvider } from '@/context/PlayerContext'; // Контекст состояния приложения и Telegram/Firebase
// 🛑 УДАЛЯЕМ: import Layout from '@/components/Layout'; // Обычный импорт Layout

import Head from 'next/head'; // Для управления заголовком и метаданными

// ✅ ИСПРАВЛЕНИЕ: Динамический импорт Layout с отключением SSR
const DynamicLayout = dynamic(() => import('@/components/Layout'), { 
  ssr: false, 
  loading: () => (
    <div className="flex justify-center items-center h-screen text-lg text-txt-primary bg-bg-default">
      Инициализация WebApp...
    </div>
  )
});


/**
 * Главный компонент приложения.
 * * @param {object} props - Свойства компонента.
 * @param {React.Component} props.Component - Текущая активная страница (например, index.js, generator.js).
 * @param {object} props.pageProps - Свойства, переданные активной странице.
 */
function App({ Component, pageProps }) {
  return (
    // 1. PlayerProvider: Оборачивает все, предоставляя доступ к TWA SDK, теме и Auth/DB.
    <PlayerProvider>
      <Head>
        <title>TTS App</title>
        {/* Настройка viewport критична для TWA, чтобы избежать масштабирования */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        {/* Подключение шрифта Inter, который используется в globals.css */}
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
      </Head>
      
      {/* 2. Используем динамически загруженный Layout */}
      <DynamicLayout>
        {/* Component - это активная страница */}
        <Component {...pageProps} />
      </DynamicLayout>
    </PlayerProvider>
  );
}

export default App;

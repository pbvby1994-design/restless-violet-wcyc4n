// Файл: webapp/pages/_app.js (Финальная версия с динамическими импортами)

import '../styles/globals.css'; 

import dynamic from 'next/dynamic';
import Head from 'next/head'; 
// Импорт Vercel Analytics
import { Analytics } from '@vercel/analytics/react'; 

// --- ДИНАМИЧЕСКИЕ ИМПОРТЫ (SSR: false) ---

// 1. PlayerProvider (из-за TWA SDK, Firebase, Audio API)
// ⚠️ КЛЮЧЕВОЙ МОМЕНТ: Используем .then(mod => mod.PlayerProvider), 
// так как это ИМЕНОВАННЫЙ ЭКСПОРТ (PlayerProvider) в файле контекста.
const DynamicPlayerProvider = dynamic(
  () => import('@/context/PlayerContext').then(mod => mod.PlayerProvider), 
  { 
    ssr: false, // ⬅️ Отключаем SSR
    loading: () => <div className="flex justify-center items-center h-screen bg-bg-default text-txt-secondary">Загрузка контекста...</div>
  }
);

// 2. Layout (из-за использования хуков, зависящих от PlayerProvider, и WebApp SDK)
// Layout.js использует 'export default Layout', поэтому .then не нужен.
const DynamicLayout = dynamic(
  () => import('@/components/Layout'),
  { 
    ssr: false, // ⬅️ Отключаем SSR
    loading: () => <div className="flex justify-center items-center h-screen bg-bg-default text-txt-secondary">Инициализация макета...</div>
  }
);


/**
 * Главный компонент приложения Next.js.
 */
function App({ Component, pageProps }) {
  return (
    // 1. PlayerProvider должен быть самым внешним
    <DynamicPlayerProvider>
      <Head>
        <title>TTS App</title>
        {/* Настройка viewport критична для TWA */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
      </Head>
      
      {/* 2. Layout оборачивает контент страницы */}
      <DynamicLayout>
        <Component {...pageProps} />
      </DynamicLayout>

      {/* Vercel Analytics (если подключен) */}
      <Analytics />
      
    </DynamicPlayerProvider>
  );
}

export default App;

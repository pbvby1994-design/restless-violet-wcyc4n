// Файл: webapp/pages/_app.js

// Основной файл приложения Next.js, который оборачивает все страницы.

// ИСПРАВЛЕНИЕ: Используем относительный путь для globals.css
import '../styles/globals.css'; 

// ✅ ДОБАВЛЯЕМ dynamic
import dynamic from 'next/dynamic'; 

// Импорты:
import { PlayerProvider } from '@/context/PlayerContext'; 
import Head from 'next/head'; 

// 🛑 УДАЛИТЬ:
// import Layout from '@/components/Layout'; // Удаляем обычный импорт

// ✅ ДОБАВЛЯЕМ ДИНАМИЧЕСКИЙ ИМПОРТ:
// Отключаем SSR для Layout, так как он импортирует TWA SDK.
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
 */
function App({ Component, pageProps }) {
  return (
    // 1. PlayerProvider: Оборачивает все
    <PlayerProvider>
      <Head>
        <title>TTS App</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
      </Head>
      
      {/* ✅ ИСПОЛЬЗУЕМ ДИНАМИЧЕСКИЙ ЛЭЙАУТ */}
      <DynamicLayout>
        {/* Component - это активная страница (Generator, Library) */}
        <Component {...pageProps} />
      </DynamicLayout>
    </PlayerProvider>
  );
}

export default App;

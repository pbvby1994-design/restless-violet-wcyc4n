// Файл: webapp/pages/_app.js
// Основной файл приложения Next.js, который оборачивает все страницы.

// Импорты:
import '@/styles/globals.css'; // Общие стили и Tailwind
import { PlayerProvider } from '@/context/PlayerContext'; // Контекст состояния приложения и Telegram/Firebase
import Layout from '@/components/Layout'; // Основной макет приложения (центрирование, карточка)
import Head from 'next/head'; // Для управления заголовком и метаданными

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
      
      {/* 2. Layout: Оборачивает контент страницы. 
          Применяет фоновые стили, центрирует контент и включает оболочку "стеклянной карточки". */}
      <Layout>
        {/* Component - это активная страница (например, index.js), отображаемая внутри макета */}
        <Component {...pageProps} />
      </Layout>
    </PlayerProvider>
  );
}

export default App;

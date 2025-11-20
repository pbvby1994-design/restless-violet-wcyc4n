// Файл: webapp/pages/_app.js
// Основной файл приложения Next.js, который оборачивает все страницы.

import '../styles/globals.css'; 

// ✅ ИСПРАВЛЕНИЕ 1.1: Импортируем провайдеры из новых, логически корректных контекстов
import { AuthProvider } from '@/context/AuthContext'; 
import { PlayerProvider } from '@/context/PlayerContext'; 

import Layout from '@/components/Layout'; 
import Head from 'next/head'; 
import { Analytics } from "@vercel/analytics/react";


/**
 * Главный компонент приложения.
 */
function App({ Component, pageProps }) {
  return (
    // 1. AuthProvider: Оборачивает все, предоставляя доступ к TWA SDK, теме и Auth/DB.
    <AuthProvider>
      {/* 2. PlayerProvider: Оборачивает компоненты, которым нужно управление аудио. */}
      <PlayerProvider>
        <Head>
          <title>TTS App</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
        </Head>
        
        <Layout>
          <Component {...pageProps} />
        </Layout>
        <Analytics />
      </PlayerProvider>
    </AuthProvider>
  );
}

export default App;

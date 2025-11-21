// Файл: webapp/pages/_app.js

import AuthProvider from '@/context/AuthContext';
import { PlayerProvider } from '@/context/PlayerContext';
import { Analytics } from "@vercel/analytics/react";

// ✅ Импорт глобальных стилей (если они у вас есть)
// import '../styles/globals.css'; 


function MyApp({ Component, pageProps }) {
  return (
    // 1. Оборачиваем всё в AuthProvider (для Firebase и TWA SDK)
    <AuthProvider>
      {/* 2. Оборачиваем в PlayerProvider (для управления аудио) */}
      <PlayerProvider>
        
        {/* Рендеринг текущей страницы (IndexPage или LibraryPage) */}
        <Component {...pageProps} />
        
        {/* 3. Vercel Analytics (Размещается в корне) */}
        <Analytics />
      </PlayerProvider>
    </AuthProvider>
  );
}

export default MyApp;

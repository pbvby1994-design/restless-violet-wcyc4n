// Файл: webapp/pages/_app.js

// 1. Импорт глобальных стилей
import '../styles/globals.css';
// Для аналитики на Vercel (необязательно)
import { Analytics } from "@vercel/analytics/react"; 

// 2. Импорт контекста плеера для глобального доступа к состоянию аудио
import { PlayerProvider } from '../context/PlayerContext';

/**
 * Основной компонент приложения Next.js.
 * Обертывает все страницы (Component) и позволяет применять глобальные стили/обертки.
 *
 * Оборачиваем приложение в PlayerProvider здесь, чтобы контекст плеера
 * был доступен на всех страницах и в любых компонентах.
 */
function MyApp({ Component, pageProps }) {
  return (
    // Оборачиваем все приложение в PlayerProvider
    <PlayerProvider>
      {/* Оборачиваем все приложение в React Fragment */}
      <>
        {/* Основной компонент страницы */}
        <Component {...pageProps} />
        
        {/* Интеграция Vercel Analytics */}
        <Analytics />
      </>
    </PlayerProvider>
  );
}

export default MyApp;

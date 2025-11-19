// Файл: webapp/pages/_app.js
import dynamic from 'next/dynamic';
import '../styles/globals.css';

// Для аналитики на Vercel (сохраняем, если это было в предыдущей версии)
import { Analytics } from "@vercel/analytics/react"; 

// Динамический импорт Layout с отключенным SSR. 
// Layout содержит PlayerProvider и логику Telegram SDK, 
// поэтому он должен работать только на клиенте.
const ClientLayout = dynamic(() => import('../components/Layout'), { 
  ssr: false, 
  loading: () => (
    // Загрузочный экран, пока инициализируется SDK/компонент
    <div className="flex justify-center items-center h-screen text-lg text-txt-primary bg-bg-default">
        Инициализация WebApp...
    </div>
  )
});

/**
 * Основной компонент приложения Next.js.
 * Обертывает все страницы (Component) и позволяет применять глобальные стили/обертки.
 */
function MyApp({ Component, pageProps }) {
  // Весь компонент оборачивается в ClientLayout
  return (
    <>
      <ClientLayout>
        {/* Основной компонент страницы */}
        <Component {...pageProps} />
      </ClientLayout>
      
      {/* Интеграция Vercel Analytics */}
      <Analytics />
    </>
  );
}

export default MyApp;

// Файл: webapp/pages/_app.js
import '../styles/globals.css';
// Для аналитики на Vercel
import { Analytics } from "@vercel/analytics/react"; 

/**
 * Основной компонент приложения Next.js.
 * Обертывает все страницы (Component) и позволяет применять глобальные стили/обертки.
 */
function MyApp({ Component, pageProps }) {
  return (
    <>
      {/* Основной компонент страницы */}
      <Component {...pageProps} />
      
      {/* Интеграция Vercel Analytics для отслеживания (необязательно, но полезно) */}
      <Analytics />
    </>
  );
}

export default MyApp;

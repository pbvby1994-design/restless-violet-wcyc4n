// Файл: webapp/pages/_app.js
import '../styles/globals.css';
// УДАЛЕНО: import { Analytics } from "@vercel/analytics/react"; 

/**
 * Основной компонент приложения Next.js.
 * Обертывает все страницы (Component) и позволяет применять глобальные стили/обертки.
 */
function MyApp({ Component, pageProps }) {
  return (
    <>
      {/* Основной компонент страницы */}
      <Component {...pageProps} />
      
      {/* УДАЛЕНО: Интеграция Vercel Analytics */}
      {/* <Analytics /> */}
    </>
  );
}

export default MyApp;

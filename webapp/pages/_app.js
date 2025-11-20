// Файл: webapp/pages/_app.js
// Основной файл приложения Next.js.

import '../styles/globals.css'; 
import Head from 'next/head'; 
import dynamic from 'next/dynamic'; 

// 🛑 ВАЖНО: УДАЛЯЕМ статический импорт PlayerProvider и Layout.

// 1. Динамический импорт Layout (содержит WebApp.setHeaderColor и т.д.)
const DynamicLayout = dynamic(() => import('@/components/Layout'), { 
  ssr: false, 
  loading: () => null
});

/**
 * 2. Динамический компонент-обертка для всего клиентского кода.
 * Он выполняет динамический импорт PlayerProvider, чтобы избежать
 * загрузки WebApp SDK и Firebase на сервере.
 */
const DynamicClientOnlyWrapper = dynamic(
    async () => {
        // ✅ КЛЮЧЕВОЙ ШАГ: Динамический импорт PlayerProvider ВНУТРИ dynamic()
        // Это предотвращает загрузку WebApp SDK на сервере.
        const { PlayerProvider } = await import('@/context/PlayerContext');
        
        // Возвращаем компонент-обертку, который использует PlayerProvider и DynamicLayout
        const ClientOnlyWrapper = ({ Component, pageProps }) => (
            <PlayerProvider>
                <DynamicLayout>
                    <Component {...pageProps} />
                </DynamicLayout>
            </PlayerProvider>
        );
        return ClientOnlyWrapper;
    },
    {
        ssr: false, // <-- Ключевой параметр! Отключаем Server-Side Rendering
        loading: () => (
            <div className="flex justify-center items-center h-screen text-lg text-txt-primary bg-bg-default">
                Загрузка приложения...
            </div>
        )
    }
);


/**
 * Главный компонент приложения.
 */
function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>TTS App</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
      </Head>
      
      {/* Весь клиентский контент загружается динамически */}
      <DynamicClientOnlyWrapper Component={Component} pageProps={pageProps} />
    </>
  );
}

export default App;

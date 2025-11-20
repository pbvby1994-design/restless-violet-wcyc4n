// Файл: webapp/pages/_app.js
// Основной файл приложения Next.js.

import '../styles/globals.css'; 
import Head from 'next/head'; 
// ✅ Добавляем dynamic для динамического импорта
import dynamic from 'next/dynamic'; 

// Импортируем провайдер и страницу (импорт здесь не вызывает ошибку, 
// поскольку мы будем использовать их внутри динамической обертки).
import { PlayerProvider } from '@/context/PlayerContext'; 

// 1. Динамический импорт Layout (из предыдущего шага)
// Мы делаем это для очистки Tree-Shaking, хотя DynamicClientOnlyWrapper его уже покроет.
const DynamicLayout = dynamic(() => import('@/components/Layout'), { 
  ssr: false, 
  loading: () => null // Загрузка будет обрабатываться DynamicClientOnlyWrapper
});

// 2. Компонент-оболочка, который включает ВЕСЬ клиентский код (Контекст + Макет + Страница)
// Это необходимо, так как PlayerProvider также содержит статический импорт WebApp/Firebase.
const ClientOnlyWrapper = ({ Component, pageProps }) => {
  // Весь код здесь выполняется ТОЛЬКО на клиенте
  return (
    <PlayerProvider>
      <DynamicLayout>
        <Component {...pageProps} />
      </DynamicLayout>
    </PlayerProvider>
  );
};

// 3. Делаем саму ClientOnlyWrapper динамической, чтобы Next.js не пытался 
// рендерить ее на сервере (ssr: false).
const DynamicClientOnlyWrapper = dynamic(() => 
    Promise.resolve(ClientOnlyWrapper), 
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
    <> {/* Используем Fragment, чтобы Head и глобальные стили оставались статическими */}
      <Head>
        <title>TTS App</title>
        {/* Настройка viewport критична для TWA */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
      </Head>
      
      {/* Весь клиентский контент загружается динамически */}
      <DynamicClientOnlyWrapper Component={Component} pageProps={pageProps} />
    </>
  );
}

export default App;

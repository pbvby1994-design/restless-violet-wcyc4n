import { useEffect, useState } from 'react';
import { PlayerProvider } from '../context/PlayerContext'; // Импорт провайдера
import WebApp from '@twa-dev/sdk';

// Этот компонент теперь служит оберткой для всего приложения
const Layout = ({ children }) => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Проверка наличия SDK (чтобы не падало в обычном браузере)
    if (typeof window !== 'undefined' && WebApp) {
        try {
            WebApp.ready(); 
            WebApp.expand(); // Раскрываем на весь экран сразу
            
            // Устанавливаем черный хедер и фон для соответствия дизайну
            WebApp.setHeaderColor('#0B0F15'); 
            WebApp.setBackgroundColor('#0B0F15');
            
            // Отключаем свайп закрытия (для полноэкранного опыта)
            if (WebApp.isVersionAtLeast('7.7')) {
               WebApp.disableVerticalSwipes();
            }

            setIsReady(true);
        } catch (e) {
            console.error("Telegram WebApp Init Error", e);
            setIsReady(true);
        }
    } else {
        setIsReady(true);
    }
  }, []);

  if (!isReady) {
    return <div className="bg-[#0B0F15] h-screen w-screen" />;
  }

  // Оборачиваем все в PlayerProvider
  // Важно: Используем шрифт sans (Inter) и черный фон
  return (
    <PlayerProvider>
      <main className="min-h-screen bg-[#0B0F15] text-white font-sans selection:bg-[#8850FF] selection:text-white overflow-hidden">
        {children}
      </main>
    </PlayerProvider>
  );
};

export default Layout;

import { useEffect, useState } from 'react';
import { PlayerProvider } from '../context/PlayerContext'; // Импорт провайдера
import WebApp from '@twa-dev/sdk';

// Этот компонент теперь служит оберткой для всего приложения
const Layout = ({ children }) => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && WebApp.ready) {
        try {
            WebApp.ready(); 
            WebApp.expand(); // Раскрываем на весь экран сразу
            
            // Устанавливаем черный хедер для соответствия дизайну
            WebApp.setHeaderColor('#0C0C0F'); 
            WebApp.setBackgroundColor('#0C0C0F');

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
    return <div className="bg-[#0C0C0F] h-screen w-screen" />;
  }

  // Оборачиваем все в PlayerProvider
  return (
    <PlayerProvider>
      <main className="min-h-screen bg-[#0C0C0F] text-white font-sans selection:bg-brand-accent selection:text-white overflow-hidden">
        {children}
      </main>
    </PlayerProvider>
  );
};

export default Layout;

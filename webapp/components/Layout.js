// Файл: webapp/components/Layout.js
import { useEffect } from 'react';
import WebApp from '@twa-dev/sdk'; // ✅ Исправлено: импортируем WebApp по умолчанию
import { usePlayer } from '@/context/PlayerContext';
import Header from './Header';
import Footer from './Footer';

/**
 * Основной компонент-обертка для макета приложения.
 * Инициализирует Telegram WebApp SDK и управляет основными стилями.
 */
const Layout = ({ children }) => {
  const { themeParams } = usePlayer();

  useEffect(() => {
    // Убеждаемся, что SDK готов и раскрываем WebApp на весь экран.
    if (WebApp.initDataUnsafe) {
      WebApp.ready();
      WebApp.expand();
      
      // Настройка цвета фона, если Telegram поддерживает
      const mainBg = themeParams.bg_color || '#0B0F15';
      const headerBg = themeParams.header_bg_color || mainBg;
      
      WebApp.setHeaderColor(headerBg);
      WebApp.setBackgroundColor(mainBg);
    } else {
      console.warn("Telegram WebApp SDK not fully initialized or not running in Telegram environment.");
    }
  }, [themeParams]);


  return (
    <div className="min-h-screen bg-bg-default text-txt-primary flex flex-col">
      <Header />
      <div className="flex-grow">
        {children}
      </div>
      {/* Footer можно использовать для глобальных элементов, таких как мини-плеер */}
      <Footer />
    </div>
  );
};

export default Layout;

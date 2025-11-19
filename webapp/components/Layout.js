// Файл: webapp/components/Layout.js
import { useEffect } from 'react';
import WebApp from '@twa-dev/sdk'; // Импорт TWA SDK
import Header from './Header'; // Импорт Header (теперь должен быть доступен)
import Footer from './Footer'; // Импорт Footer (теперь должен быть доступен)
import { usePlayer } from '@/context/PlayerContext';

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
      
      // Установка цветов, адаптированных к теме Telegram
      WebApp.setHeaderColor(headerBg);
      WebApp.setBackgroundColor(mainBg);
    } else {
      console.warn("Telegram WebApp SDK not fully initialized or not running in Telegram environment.");
    }
  }, [themeParams]);


  return (
    // Обновленный Layout использует Header и Footer.
    // Класс flex-col и min-h-screen гарантируют, что футер будет внизу.
    <div className="min-h-screen bg-bg-default text-txt-primary flex flex-col">
      <Header />
      <main className="flex-grow max-w-lg w-full mx-auto p-4 md:p-6 lg:p-8">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;

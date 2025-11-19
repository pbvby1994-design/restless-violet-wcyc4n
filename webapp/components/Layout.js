// Файл: webapp/components/Layout.js
import { useEffect } from 'react';
import WebApp from '@twa-dev/sdk'; // Импорт TWA SDK
import Header from './Header'; // Импорт Header
import Footer from './Footer'; // Импорт Footer
import { usePlayer } from '@/context/PlayerContext';

/**
 * Основной компонент-обертка для макета приложения.
 * Инициализирует Telegram WebApp SDK и управляет основными стилями.
 */
const Layout = ({ children }) => {
  // Получаем themeParams из контекста. Теперь он гарантированно будет объектом,
  // что устраняет ошибку 'Cannot read properties of undefined (reading 'bg_color')'
  const { themeParams } = usePlayer();

  useEffect(() => {
    // Убеждаемся, что SDK готов и раскрываем WebApp на весь экран.
    if (WebApp.initDataUnsafe) {
      WebApp.ready();
      WebApp.expand();
      
      // Используем безопасный доступ к свойствам themeParams
      // В PlayerContext мы уже позаботились о том, чтобы themeParams был хотя бы {}
      const mainBg = themeParams?.bg_color || '#0B0F15';
      const headerBg = themeParams?.header_bg_color || mainBg;
      
      // Установка цветов, адаптированных к теме Telegram
      WebApp.setHeaderColor(headerBg);
      WebApp.setBackgroundColor(mainBg);
    } else {
      // Это сообщение выводится, если приложение запущено вне среды Telegram,
      // что обычно не является ошибкой, но полезно для отладки.
      console.warn("Telegram WebApp SDK not fully initialized or not running in Telegram environment.");
    }
  }, [themeParams]); // Зависимость от themeParams, чтобы обновить цвета при смене темы в Telegram


  return (
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

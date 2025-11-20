// Файл: webapp/components/Layout.js
import React, { useEffect } from 'react';
import WebApp from '@twa-dev/sdk';
import Header from './Header';
import Footer from './Footer';
import { usePlayer } from '@/context/PlayerContext';

/**
 * Компонент макета, который оборачивает все приложение,
 * применяет стили темы Telegram и центрирует контент.
 * * NOTE: ЭТОТ КОМПОНЕНТ РИСУЕТ ВНУТРЕННИЙ "КАРТОЧНЫЙ" КОНТЕЙНЕР ПРИЛОЖЕНИЯ.
 */
const Layout = ({ children }) => {
  // Получаем themeParams из контекста. Теперь он гарантированно будет объектом.
  const { themeParams } = usePlayer();
  
  // Получаем цвета из контекста. Fallback на цвета по умолчанию.
  const bgColor = themeParams?.bg_color || '#0B0F15';
  const headerBgColor = themeParams?.header_bg_color || '#1A1E24';
  const textColor = themeParams?.text_color || '#FFFFFF';

  // Логика установки цветов TWA SDK и расширения
  useEffect(() => {
    if (WebApp.initDataUnsafe) {
      WebApp.ready();
      WebApp.expand();
      
      const mainBg = themeParams?.bg_color || '#0B0F15';
      const headerBg = themeParams?.header_bg_color || mainBg;
      
      // Установка цветов, адаптированных к теме Telegram
      WebApp.setHeaderColor(headerBg);
      WebApp.setBackgroundColor(mainBg);
    } else {
      console.warn("Telegram WebApp SDK not fully initialized or not running in Telegram environment.");
    }
  }, [themeParams]); 

  return (
    // Внешняя обертка: занимает весь экран и центрирует внутренний контейнер
    <div 
      className="min-h-screen flex items-center justify-center p-4 transition-colors duration-300"
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      {/* Внутренний контейнер-карточка: 
        Применяет стили card-glass, ограничивает ширину (max-w-md),
        использует цвет фона для хедера TWA. 
      */}
      <div 
        className="w-full max-w-md card-glass backdrop-blur-lg"
        // Используем headerBgColor для основного фона карточки,
        // чтобы создать контраст с внешним фоном.
        style={{ backgroundColor: headerBgColor }}
      >
        <Header />
        <main className="p-4">
            {children}
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default Layout;

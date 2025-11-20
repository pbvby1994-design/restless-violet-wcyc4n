// Файл: webapp/components/Layout.js
import React, { useEffect } from 'react';
// Импортируем WebApp
import WebApp from '@twa-dev/sdk';
import Header from './Header';
import Footer from './Footer';
import { usePlayer } from '@/context/PlayerContext';

/**
 * Компонент макета, который оборачивает все приложение,
 * применяет стили темы Telegram и центрирует контент.
 */
const Layout = ({ children }) => {
  // Получаем themeParams и isWebAppReady из контекста
  const { themeParams, isWebAppReady } = usePlayer();
  
  // Используем надежные заглушки для SSR
  const bgColor = themeParams?.bg_color || '#0B0F15';
  const headerBgColor = themeParams?.header_bg_color || '#1A1E24';
  const textColor = themeParams?.text_color || '#FFFFFF';

  // Установка цветов TWA SDK (ТОЛЬКО на клиенте и после готовности SDK)
  useEffect(() => {
    // Проверяем, что мы на клиенте И что WebApp SDK инициализирован
    if (typeof window !== 'undefined' && isWebAppReady) {
      const mainBg = themeParams?.bg_color || '#0B0F15';
      const headerBg = themeParams?.header_bg_color || mainBg;
      
      // Устанавливаем цвета для нативных элементов Telegram
      WebApp.setHeaderColor(headerBg);
      WebApp.setBackgroundColor(mainBg);
    }
  }, [isWebAppReady, themeParams]); 

  return (
    // Внешняя обертка: занимает весь экран и центрирует внутренний контейнер
    <div 
      className="min-h-screen flex items-center justify-center p-4 transition-colors duration-300"
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      {/* Внутренний контейнер-карточка: 
        Применяет стили card-glass, ограничивает ширину (max-w-md).
      */}
      <div 
        className="w-full max-w-md card-glass backdrop-blur-lg"
        // Используем headerBgColor для основного фона карточки
        style={{ backgroundColor: headerBgColor }}
      >
        {/* Header и Footer должны существовать */}
        <Header /> 
        <main className="p-4 flex-grow w-full">
            {children}
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default Layout;

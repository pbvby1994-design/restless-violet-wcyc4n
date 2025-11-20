// Файл: webapp/components/Layout.js
import React, { useEffect } from 'react';
// Импортируем WebApp
import WebApp from '@twa-dev/sdk';
import Header from './Header';
import Footer from './Footer';
// ✅ ИСПРАВЛЕНИЕ 1.1: Импортируем useAuth для данных TWA/Auth
import { usePlayer } from '@/context/PlayerContext';;

/**
 * Компонент макета, который оборачивает все приложение,
 * применяет стили темы Telegram и центрирует контент.
 */
const Layout = ({ children }) => {
  // ✅ ИСПРАВЛЕНИЕ 1.1: Получаем themeParams и isWebAppReady из нового AuthContext
  const { themeParams, isWebAppReady } = useAuth();
  
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
      {/* Внутренний контейнер-карточка */}
      <div 
        className="w-full max-w-md card-glass backdrop-blur-lg"
        style={{ backgroundColor: headerBgColor }}
      >
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


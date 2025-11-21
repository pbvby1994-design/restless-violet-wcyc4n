// Файл: webapp/components/Layout.js
"use client"; // <-- КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ

import React, { useEffect } from 'react';
// Импортируем WebApp
import WebApp from '@twa-dev/sdk';
import Header from './Header';
import Footer from './Footer';
// ✅ ИСПРАВЛЕНИЕ: Импортируем usePlayer из нового файла контекста
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
      
      // Дополнительно: показываем главную кнопку, если она нужна
      // WebApp.MainButton.setText('Сохранить');
      // WebApp.MainButton.show();
    }
  }, [isWebAppReady, themeParams]); 

  return (
    // Внешняя обертка: занимает весь экран и центрирует внутренний контейнер
    <div 
      className="min-h-screen flex flex-col items-center justify-start p-0 transition-colors duration-300"
      // Используем цвета из TWA или заглушки
      style={{ backgroundColor: bgColor, color: textColor }} 
    >
        {/* Максимальная ширина для контента */}
        <div className="w-full max-w-xl flex flex-col flex-1">
            <Header bgColor={headerBgColor} textColor={textColor} />
            
            <main className="flex-1 p-4">
                {children}
            </main>
            
            <Footer bgColor={headerBgColor} textColor={textColor} />
        </div>
    </div>
  );
};

export default Layout;

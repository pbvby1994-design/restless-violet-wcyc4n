// Файл: webapp/components/Layout.js
import { useEffect, useState } from 'react';
import WebApp from '@twa-dev/sdk';  // Измените импорт на default (для типов, если используете TS)
import { PlayerProvider } from '../context/PlayerContext';

const Layout = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const [isSdkInitialized, setIsSdkInitialized] = useState(false);

  useEffect(() => {
    let tg;
    try {
      // Удалите init(); — оно не нужно и не экспортируется
      tg = window.Telegram.WebApp;  // Или tg = WebApp; для использования импорта
      
      // Добавьте это для правильной инициализации
      tg.ready();

      // Остальной код без изменений
      document.body.style.backgroundColor = tg.themeParams.bg_color || '#1e1e2d';
      tg.HapticFeedback.impactOccurred('light');
      tg.MainButton.setParams({
        text_color: tg.themeParams.button_text_color || '#ffffff',
        color: tg.themeParams.button_color || '#8850ff',
      });
      tg.BackButton.hide();

      setIsSdkInitialized(true);
    } catch (e) {
      console.error("Telegram WebApp SDK failed to initialize:", e.message);
      setIsSdkInitialized(true); // Все равно продолжаем работу
    } finally {
      setIsReady(true);
    }
  }, []);

  if (!isReady) {
    return (
      <div className="flex justify-center items-center h-screen text-lg bg-bg-default text-txt-primary">
        Загрузка приложения...
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 flex flex-col items-center bg-bg-default transition-colors duration-300">
      <div className="w-full max-w-lg">
        {children}
      </div>
    </div>
  );
};

export default Layout;

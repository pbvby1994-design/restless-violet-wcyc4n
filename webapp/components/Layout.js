// Файл: webapp/components/Layout.js
import { useEffect, useState } from 'react';
import WebApp from '@twa-dev/sdk'; // Импорт для типов (опционально)
import { PlayerProvider } from '../context/PlayerContext';

const Layout = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  // Состояние для отслеживания инициализации SDK (в основном для отладки)
  const [isSdkInitialized, setIsSdkInitialized] = useState(false); 

  useEffect(() => {
    let tg;
    try {
      // ✅ ИСПРАВЛЕНИЕ: Проверка наличия Telegram объекта (для запуска в браузере)
      if (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) {
        tg = window.Telegram.WebApp;
        
        // Стандартная инициализация SDK
        tg.ready();

        // Настройка UI
        document.body.style.backgroundColor = tg.themeParams.bg_color || '#1e1e2d';
        
        // Проверка наличия функций перед вызовом
        if (tg.HapticFeedback && tg.HapticFeedback.impactOccurred) {
           tg.HapticFeedback.impactOccurred('light');
        }

        if (tg.MainButton && tg.MainButton.setParams) {
          tg.MainButton.setParams({
            text_color: tg.themeParams.button_text_color || '#ffffff',
            color: tg.themeParams.button_color || '#8850ff',
          });
        }
        
        if (tg.BackButton && tg.BackButton.hide) {
           tg.BackButton.hide();
        }

        setIsSdkInitialized(true);
      } else {
        // Fallback для браузера (без Telegram)
        console.warn('Telegram WebApp SDK not available - running in browser mode');
        document.body.style.backgroundColor = '#0B0F15'; // Запасной цвет из tailwind.config.js
        setIsSdkInitialized(true);
      }
    } catch (e) {
      console.error("Telegram WebApp SDK failed to initialize:", e.message);
      setIsSdkInitialized(true); // Продолжаем без SDK
    } finally {
      setIsReady(true);
    }
  }, []); // Пустой массив зависимостей гарантирует вызов только один раз при монтировании

  if (!isReady) {
    return (
      <div className="flex justify-center items-center h-screen text-lg bg-bg-default text-txt-primary">
        Загрузка приложения...
      </div>
    );
  }

  // Оборачиваем дочерние элементы в PlayerProvider
  return (
    <PlayerProvider>
      <div className="min-h-screen p-4 flex flex-col items-center bg-bg-default transition-colors duration-300">
        <div className="w-full max-w-lg">
          {children}
        </div>
      </div>
    </PlayerProvider>
  );
};

export default Layout;

// Файл: webapp/components/Layout.js
import { useEffect, useState } from 'react';
// ❌ Исходный код: import { init } from '@twa-dev/sdk';
// ✅ ИСПРАВЛЕНИЕ: Импортируем весь SDK как объект WebApp
import WebApp from '@twa-dev/sdk';

const Layout = ({ children }) => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Добавляем проверку, чтобы код не падал в обычном браузере (вне Telegram)
    if (WebApp.ready) { 
        try {
            // ✅ ИСПРАВЛЕНИЕ: Используем WebApp.ready() вместо init()
            WebApp.ready(); 
            const tg = WebApp; // Теперь tg — это объект SDK

            // Настройка цвета фона (используем цвета, предоставленные Telegram)
            if (tg.themeParams && tg.themeParams.bg_color) {
                document.body.style.backgroundColor = tg.themeParams.bg_color;
            } else {
                document.body.style.backgroundColor = '#f4f4f5'; // Fallback
            }
            
            // Включаем виброотклик
            tg.HapticFeedback.impactOccurred('light');

            setIsReady(true);
        } catch (e) {
            // Выводим ошибку, но продолжаем, чтобы можно было тестировать в браузере
            console.error("Telegram WebApp SDK failed to initialize:", e);
            setIsReady(true);
        }
    } else {
        // Запуск в обычном браузере (вне Telegram)
        console.warn("Telegram WebApp SDK not found. Running in standard browser mode.");
        setIsReady(true);
    }
  }, []);

  if (!isReady) {
    return (
      <div className="flex justify-center items-center h-screen text-lg bg-zinc-100 dark:bg-zinc-800">
        Загрузка приложения...
      </div>
    );
  }

  return (
    // Добавляем классы dark: для поддержки темной темы Telegram
    <div className="min-h-screen p-4 bg-zinc-50 dark:bg-zinc-900 transition-colors duration-300">
      {children}
    </div>
  );
};

export default Layout;

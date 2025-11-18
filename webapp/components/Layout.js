import { useEffect, useState } from 'react';
import { init } from '@twa-dev/sdk';

const Layout = ({ children }) => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      // Инициализация SDK
      init();
      const tg = window.Telegram.WebApp;
      
      // Настройка цвета фона
      document.body.style.backgroundColor = tg.themeParams.bg_color || '#f4f4f5';
      
      // Включаем виброотклик при нажатии
      tg.HapticFeedback.impactOccurred('light');

      setIsReady(true);
    } catch (e) {
      // Выводим ошибку, но продолжаем, чтобы можно было тестировать в браузере
      console.error("Telegram WebApp SDK failed to initialize:", e);
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
    // ИСПРАВЛЕНО: Классная строка завершена корректно.
    <div className="min-h-screen p-4 bg-zinc-50 dark:bg-zinc-900 transition-colors duration-300">
      {children}
    </div>
  );
};

export default Layout;

// Файл: webapp/components/Layout.js
import { useEffect, useState } from 'react';
import { init } from '@twa-dev/sdk'; 
import { PlayerProvider } from '../context/PlayerContext';

const Layout = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const [isSdkInitialized, setIsSdkInitialized] = useState(false);

  useEffect(() => {
    let tg;
    try {
      // 1. Инициализация SDK
      init(); 
      tg = window.Telegram.WebApp; 
      
      // 2. Настройка UI:
      // Устанавливаем основной цвет
      document.body.style.backgroundColor = tg.themeParams.bg_color || '#1e1e2d';
      
      // Включаем виброотклик при нажатии
      tg.HapticFeedback.impactOccurred('light');

      // Устанавливаем цвет кнопки (MainButton)
      tg.MainButton.setParams({
        text_color: tg.themeParams.button_text_color || '#ffffff',
        color: tg.themeParams.button_color || '#8850ff',
      });

      // Скрываем навигационную кнопку "назад"
      tg.BackButton.hide();

      setIsSdkInitialized(true);
    } catch (e) {
      // Если это не Telegram, или ошибка инициализации
      console.error("Telegram WebApp SDK failed to initialize:", e.message);
      setIsSdkInitialized(true); // Все равно продолжаем работу
    } finally {
      // Это нужно, чтобы контент не рендерился, пока не завершится useEffect
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

  // Обновляем корневой элемент для соответствия стилям Tailwind
  return (
    // PlayerProvider теперь внутри Layout
    <PlayerProvider>
      <div className="min-h-screen max-w-md mx-auto relative overflow-hidden pb-32">
        {children}
      </div>
    </PlayerProvider>
  );
};

export default Layout;

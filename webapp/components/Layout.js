import { useEffect, useState } from 'react';
// Импортируем WebApp по умолчанию для лучшей типизации (при использовании TypeScript).
// В JavaScript это можно использовать как хинт, хотя доступ к SDK идет через window.Telegram.WebApp.
import WebApp from '@twa-dev/sdk'; 
import { PlayerProvider } from '../context/PlayerContext';

const Layout = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const [isSdkInitialized, setIsSdkInitialized] = useState(false);

  useEffect(() => {
    let tg;
    try {
      // 1. Получаем глобальный объект SDK, который инициализируется автоматически.
      // Вызов init() удален, поскольку он не экспортируется и не нужен.
      tg = window.Telegram.WebApp; 
      
      // 2. Сигнализируем Telegram, что приложение готово к отображению.
      tg.ready(); 
      
      // 3. Настройка UI:
      // Устанавливаем основной цвет и цвет текста из темы Telegram
      document.body.style.backgroundColor = tg.themeParams.bg_color || '#0B0F15';
      document.body.style.color = tg.themeParams.text_color || '#FFFFFF';
      
      // Включаем виброотклик при нажатии
      tg.HapticFeedback.impactOccurred('light');

      // Настройка кнопки (MainButton)
      tg.MainButton.setParams({
        text_color: tg.themeParams.button_text_color || '#ffffff',
        color: tg.themeParams.button_color || '#8850ff',
      });

      // Скрываем навигационную кнопку "назад"
      tg.BackButton.hide();

      setIsSdkInitialized(true);
    } catch (e) {
      // Если это не Telegram (например, локальная разработка)
      console.error("Telegram WebApp SDK failed to initialize:", e.message);
      setIsSdkInitialized(true); 
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

  // Оборачиваем дочерние элементы в провайдер плеера
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

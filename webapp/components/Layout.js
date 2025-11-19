import { useEffect, useState, useMemo } from 'react';
import { init } from '@twa-dev/sdk'; 
import { PlayerProvider } from '../context/PlayerContext';
import { Settings } from 'lucide-react'; // Для заглушки в случае ошибки/загрузки

/**
 * Компонент Layout:
 * 1. Инициализирует Telegram WebApp SDK.
 * 2. Устанавливает начальные параметры UI (цвет фона, MainButton).
 * 3. Обеспечивает глобальный контекст для аудиоплеера (PlayerProvider).
 * 4. Отображает экран загрузки, пока SDK не инициализирован.
 * * NOTE: Компонент динамически импортируется в pages/index.js с ssr: false.
 */
const Layout = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const [isSdkInitialized, setIsSdkInitialized] = useState(false);

  // Инициализация SDK и настройка TWA UI
  useEffect(() => {
    let tg;
    try {
      // 1. Инициализация SDK
      init(); 
      tg = window.Telegram.WebApp; 
      
      // 2. Настройка UI:
      // Устанавливаем основной цвет (fallback на цвет из Tailwind)
      document.body.style.backgroundColor = tg.themeParams.bg_color || '#0B0F15';
      
      // Настраиваем MainButton (она не будет видна, но ее параметры важны для темы)
      tg.MainButton.setParams({
        text_color: tg.themeParams.button_text_color || '#ffffff',
        color: tg.themeParams.button_color || '#8850ff',
      });

      // Скрываем навигационную кнопку "назад" (она нам не нужна на главной странице)
      tg.BackButton.hide();
      
      // Включаем виброотклик для лучшего UX
      if (tg.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('light');
      }

      setIsSdkInitialized(true);
    } catch (e) {
      // Если это не Telegram, или ошибка инициализации
      console.error("Telegram WebApp SDK failed to initialize:", e.message);
      setIsSdkInitialized(true); // Все равно продолжаем работу, но без TWA функций
    } finally {
      setIsReady(true); // Приложение готово к отображению контента
    }
  }, []);

  // Экран загрузки
  if (!isReady) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-bg-default text-txt-primary">
        <Settings size={32} className="animate-spin text-accent-neon mb-4"/>
        <p className="text-lg">
          Загрузка приложения...
        </p>
      </div>
    );
  }

  // Основная разметка приложения
  return (
    // Оборачиваем все в PlayerProvider для доступа к состоянию плеера из любого места
    <PlayerProvider>
      {/* Корневой контейнер. Класс 'min-h-screen' гарантирует, 
        что он занимает всю высоту, а 'mx-auto' центрирует контент. 
      */}
      <div className="relative min-h-screen w-full mx-auto max-w-md bg-bg-default text-txt-primary">
        {/* Рендерим дочерние элементы (страницы) */}
        {children}
      </div>
    </PlayerProvider>
  );
};

export default Layout;

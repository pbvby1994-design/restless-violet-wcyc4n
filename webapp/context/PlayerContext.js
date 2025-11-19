import React, { createContext, useContext, useState, useEffect } from 'react';

// Важно: Мы импортируем WebApp, но не используем его до тех пор, пока не убедимся, что находимся в браузере.
// TWA-SDK сам по себе безопасен для импорта, но его методы (WebApp.themeParams, WebApp.ready) должны вызываться осторожно.
import WebApp from '@twa-dev/sdk';

// 1. Создание контекста
const PlayerContext = createContext();

// 2. Определение полностью безопасного начального состояния (без WebApp)
// Используем безопасные заглушки для цветов, которые будут перезаписаны в useEffect.
const SAFE_DEFAULT_THEME = {
  bg_color: '#0B0F15',
  header_bg_color: '#1A1E24',
  text_color: '#FFFFFF',
};

const initialPlayerState = {
  // Инициализация themeParams безопасным объектом, чтобы избежать ошибки undefined.
  themeParams: SAFE_DEFAULT_THEME,
  textToSpeak: '',
  isReady: false, // Флаг для отслеживания готовности контекста
};

/**
 * Провайдер контекста для управления глобальным состоянием, включая
 * параметры темы Telegram WebApp и данные, связанные с TTS.
 */
export const PlayerProvider = ({ children }) => {
  const [state, setState] = useState(initialPlayerState);

  // Инициализация WebApp SDK и прослушивание изменений темы.
  // Этот хук гарантированно запускается только на клиенте (в браузере),
  // что делает вызовы WebApp безопасными.
  useEffect(() => {
    // Проверка, что мы в браузере и TWA SDK загрузился
    if (typeof window !== 'undefined' && WebApp.initDataUnsafe) {
      
      // Инициализируем themeParams из SDK
      const currentTheme = WebApp.themeParams || SAFE_DEFAULT_THEME;
      
      setState(prev => ({
        ...prev,
        themeParams: currentTheme,
        isReady: true,
      }));
      
      // Добавляем прослушиватель для отслеживания изменений темы
      const handleThemeChange = () => {
        setState(prev => ({
          ...prev,
          themeParams: WebApp.themeParams || SAFE_DEFAULT_THEME,
        }));
      };
      WebApp.onEvent('themeChanged', handleThemeChange);

      return () => {
        WebApp.offEvent('themeChanged', handleThemeChange);
      };
    } else {
       // Если не в TWA (или на сервере при сборке), используем дефолты и помечаем как готовое
       setState(prev => ({
        ...prev,
        isReady: true,
        themeParams: SAFE_DEFAULT_THEME,
      }));
    }
  }, []);
  
  // Упрощенный доступ к themeParams для внешних компонентов
  const themeParams = state.themeParams; 

  const updateTextToSpeak = (text) => {
    setState(prev => ({ ...prev, textToSpeak: text }));
  };

  const contextValue = {
    ...state,
    themeParams,
    updateTextToSpeak,
  };

  // Показываем контент, только если контекст готов
  if (!state.isReady) {
    // Временно покажем лоадер или пустой экран во время инициализации.
    // Используем только Tailwind-классы, безопасные для SSR.
    return (
      <div className="min-h-screen bg-[#0B0F15] text-[#FFFFFF] flex items-center justify-center">
        <div className="flex space-x-2 animate-pulse">
            <div className="w-3 h-3 bg-accent-neon rounded-full"></div>
            <div className="w-3 h-3 bg-accent-neon rounded-full animation-delay-200"></div>
            <div className="w-3 h-3 bg-accent-neon rounded-full animation-delay-400"></div>
        </div>
      </div>
    );
  }

  return (
    <PlayerContext.Provider value={contextValue}>
      {children}
    </PlayerContext.Provider>
  );
};

// 3. Хук для использования контекста
export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};

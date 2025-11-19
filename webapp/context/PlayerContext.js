import React, { createContext, useContext, useState, useEffect } from 'react';
import WebApp from '@twa-dev/sdk';

// 1. Создание контекста
const PlayerContext = createContext();

// 2. Определение начального состояния с безопасными значениями по умолчанию
// themeParams: {} — ЭТО КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ ДЛЯ ОШИБКИ 'bg_color'
const initialPlayerState = {
  // Параметры темы Telegram. Начинаем с пустого объекта, чтобы избежать ошибки undefined.
  themeParams: WebApp.themeParams || {},
  // Остальные необходимые состояния
  textToSpeak: '',
  isReady: false, // Флаг, указывающий, что контекст инициализирован
};

/**
 * Провайдер контекста для управления глобальным состоянием, включая
 * параметры темы Telegram WebApp и данные, связанные с TTS.
 */
export const PlayerProvider = ({ children }) => {
  const [state, setState] = useState(initialPlayerState);

  // Инициализация WebApp SDK и прослушивание изменений темы
  useEffect(() => {
    if (WebApp.initDataUnsafe) {
      // Инициализируем themeParams из SDK, если он доступен
      setState(prev => ({
        ...prev,
        themeParams: WebApp.themeParams || {},
        isReady: true,
      }));
      
      // Добавляем прослушиватель для отслеживания изменений темы
      const handleThemeChange = () => {
        setState(prev => ({
          ...prev,
          themeParams: WebApp.themeParams,
        }));
      };
      WebApp.onEvent('themeChanged', handleThemeChange);

      return () => {
        WebApp.offEvent('themeChanged', handleThemeChange);
      };
    } else {
       // Если не в TWA, используем безопасные заглушки
       setState(prev => ({
        ...prev,
        isReady: true,
        // Здесь можно установить любые пользовательские дефолты, если TWA недоступен
        themeParams: {
          bg_color: '#0B0F15',
          header_bg_color: '#1A1E24',
          text_color: '#FFFFFF'
        }
      }));
    }
  }, []);
  
  // Упрощенный доступ к themeParams для внешних компонентов
  const themeParams = state.themeParams; 

  // Вы можете добавить сюда другие функции для обновления состояния
  const updateTextToSpeak = (text) => {
    setState(prev => ({ ...prev, textToSpeak: text }));
  };

  const contextValue = {
    ...state,
    themeParams,
    updateTextToSpeak,
    // Добавьте сюда другие функции и состояния
  };

  // Показываем контент, только если контекст готов
  if (!state.isReady) {
    // Временно покажем лоадер или пустой экран во время инициализации
    return (
      <div className="min-h-screen bg-bg-default text-txt-primary flex items-center justify-center">
        Загрузка приложения...
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

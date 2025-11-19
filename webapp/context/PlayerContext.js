// Файл: webapp/context/PlayerContext.js
import React, { createContext, useContext, useState, useRef, useCallback } from 'react';

// 1. Создание контекста
const PlayerContext = createContext();

// 2. Пользовательский хук для использования контекста
export const usePlayer = () => useContext(PlayerContext);

// 3. Компонент провайдера
export const PlayerProvider = ({ children }) => {
  // Состояние аудио
  const [currentAudioUrl, setCurrentAudioUrl] = useState(null); // URL текущего аудиофайла
  const [isPlaying, setIsPlaying] = useState(false);             // Статус воспроизведения
  const [isLoading, setIsLoading] = useState(false);             // Статус загрузки/генерации
  const [error, setError] = useState(null);                      // Сообщение об ошибке
  const [duration, setDuration] = useState(0);                   // Общая длительность
  const [currentTime, setCurrentTime] = useState(0);             // Текущая позиция

  // Ссылка на объект Audio, чтобы управлять воспроизведением
  const audioRef = useRef(null);

  /**
   * Инициализация нового аудиофайла и запуск его воспроизведения.
   * @param {string} url - URL аудиофайла (Blob URL или API URL).
   */
  const setAudioUrl = useCallback((url) => {
    // 1. Очистка предыдущего аудио
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      // Освобождаем память, если это был Blob URL
      if (currentAudioUrl && currentAudioUrl.startsWith('blob:')) {
        URL.revokeObjectURL(currentAudioUrl);
      }
      audioRef.current = null;
    }

    // 2. Установка нового URL и состояния
    setCurrentAudioUrl(url);
    setIsLoading(false); // Загрузка завершена, если мы получили URL
    setError(null);

    // 3. Создание нового объекта Audio
    const audio = new Audio(url);
    audioRef.current = audio;

    // 4. Настройка слушателей событий
    audio.onloadedmetadata = () => {
      setDuration(audio.duration);
      setCurrentTime(0);
      // Автоматический запуск воспроизведения
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch(e => {
        console.error("Audio playback failed:", e);
        setError("Ошибка воспроизведения. Проверьте настройки браузера.");
        setIsPlaying(false);
      });
    };

    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
    };

    audio.onended = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.onerror = (e) => {
      console.error("Audio error:", e);
      setError("Произошла ошибка при загрузке аудио.");
      setIsPlaying(false);
      setIsLoading(false);
    };

  }, [currentAudioUrl]); // currentAudioUrl добавлен для корректного revokeObjectURL

  /**
   * Переключение состояния воспроизведения (Пауза/Воспроизведение)
   */
  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(e => {
        console.error("Play failed after pause:", e);
        setError("Ошибка воспроизведения.");
      });
    }
    setIsPlaying(prev => !prev);
  }, [isPlaying]);

  /**
   * Установка новой позиции воспроизведения
   * @param {number} time - Новая позиция в секундах
   */
  const seekTo = useCallback((time) => {
    const audio = audioRef.current;
    if (audio && isFinite(time) && time >= 0 && time <= duration) {
      audio.currentTime = time;
      setCurrentTime(time);
    }
  }, [duration]);

  /**
   * Сброс всех состояний плеера (например, при очистке формы)
   */
  const resetPlayer = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    if (currentAudioUrl && currentAudioUrl.startsWith('blob:')) {
      URL.revokeObjectURL(currentAudioUrl); // Освобождаем Blob URL
    }
    setCurrentAudioUrl(null);
    setIsPlaying(false);
    setIsLoading(false);
    setError(null);
    setDuration(0);
    setCurrentTime(0);
  }, [currentAudioUrl]); // currentAudioUrl добавлен для корректного revokeObjectURL

  // Объект контекста, который будет передан дочерним элементам
  const contextValue = {
    currentAudioUrl,
    isPlaying,
    isLoading,
    error,
    duration,
    currentTime,
    setIsLoading, // Позволяет компоненту Home устанавливать загрузку
    setError,     // Позволяет компоненту Home устанавливать ошибку
    setAudioUrl,  // Запускает воспроизведение нового аудио
    togglePlay,   // Переключает Пауза/Воспроизведение
    seekTo,       // Перематывает аудио
    resetPlayer,  // Сброс
  };

  return (
    <PlayerContext.Provider value={contextValue}>
      {children}
    </PlayerContext.Provider>
  );
};

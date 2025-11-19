// Файл: webapp/context/PlayerContext.js
import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';

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
   * Устанавливает слушателей событий для аудиоэлемента
   */
  useEffect(() => {
    // Создаем Audio-объект только один раз, если его нет
    if (!audioRef.current) {
        audioRef.current = new Audio();
    }
    const audio = audioRef.current;
    
    // Если аудио не инициализировано (например, при первом рендере), выходим
    if (!audio) return; 

    // Слушатели событий
    const setAudioData = () => {
      setDuration(audio.duration);
    };

    const updateTime = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = (e) => {
      console.error("Audio playback error:", e);
      setError(`Ошибка воспроизведения: ${e.message || 'Неизвестная ошибка'}`);
      setIsLoading(false);
      setIsPlaying(false);
    };

    audio.addEventListener('loadedmetadata', setAudioData);
    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    // Функция очистки: удаляем слушатели при размонтировании
    return () => {
      audio.removeEventListener('loadedmetadata', setAudioData);
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, []); // Пустой массив зависимостей: слушатели ставятся один раз

  /**
   * Инициализация нового аудиофайла и запуск его воспроизведения.
   * @param {string} url - URL аудиофайла (Blob URL или API URL).
   */
  const setAudioUrl = useCallback((url) => {
    const audio = audioRef.current;
    if (!audio) return;

    // 1. Очистка предыдущего Blob URL (если он был)
    if (currentAudioUrl && currentAudioUrl.startsWith('blob:')) {
      URL.revokeObjectURL(currentAudioUrl);
    }
    
    // 2. Установка нового URL, сброс времени и запуск
    audio.src = url;
    audio.load(); // Принудительно загружаем метаданные
    audio.currentTime = 0;
    setCurrentTime(0);
    setDuration(0);
    setCurrentAudioUrl(url);
    setIsPlaying(true);
    
    audio.play().catch(e => {
        // Ошибка может возникнуть из-за политики браузера (автовоспроизведение)
        console.error("Error playing audio automatically:", e);
        // Не показываем ошибку пользователю, если это просто политика автовоспроизведения
        // Просто устанавливаем паузу.
        // setError("Для воспроизведения нажмите кнопку 'Play'."); 
        setIsPlaying(false);
    });
    
    setError(null);
    setIsLoading(false);
  }, [currentAudioUrl]); // currentAudioUrl нужен для корректной очистки Blob URL

  /**
   * Переключение Пауза/Воспроизведение.
   */
  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (audio && currentAudioUrl) {
      if (isPlaying) {
        audio.pause();
      } else {
        audio.play().catch(e => {
             console.error("Error toggling play:", e);
             setError("Ошибка воспроизведения. Попробуйте снова.");
             setIsPlaying(false);
        });
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying, currentAudioUrl]); // ✅ ИСПРАВЛЕНИЕ: Добавлен currentAudioUrl для надежности

  /**
   * Перемотка на указанное время.
   * @param {number} time - Новая позиция в секундах
   */
  const seekTo = useCallback((time) => {
    const audio = audioRef.current;
    // Проверка, что время валидно и находится в пределах длительности
    if (audio && isFinite(time) && time >= 0 && duration > 0 && time <= duration) {
      audio.currentTime = time;
      setCurrentTime(time);
    }
  }, [duration]); // ✅ ИСПРАВЛЕНИЕ: Только duration в зависимостях

  /**
   * Сброс всех состояний плеера (например, при очистке формы)
   */
  const resetPlayer = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = ''; // Очистка src
    }
    // Освобождаем память, если это был Blob URL
    if (currentAudioUrl && currentAudioUrl.startsWith('blob:')) {
      URL.revokeObjectURL(currentAudioUrl); 
    }
    setCurrentAudioUrl(null);
    setIsPlaying(false);
    setIsLoading(false);
    setError(null);
    setDuration(0);
    setCurrentTime(0);
  }, [currentAudioUrl]); // ✅ ИСПРАВЛЕНИЕ: currentAudioUrl нужен для корректной очистки Blob URL

  // Объект контекста, который будет передан дочерним элементам
  const contextValue = {
    currentAudioUrl,
    isPlaying,
    isLoading,
    error,
    duration,
    currentTime,
    setIsLoading, 
    setError,     
    setAudioUrl,  
    togglePlay,   
    seekTo,       
    resetPlayer   
  };

  return (
    <PlayerContext.Provider value={contextValue}>
      {children}
    </PlayerContext.Provider>
  );
};

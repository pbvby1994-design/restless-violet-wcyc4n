import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';

// 1. Создание контекста
const PlayerContext = createContext();

// 2. Пользовательский хук для использования контекста
export const usePlayer = () => useContext(PlayerContext);

// 3. Компонент провайдера
export const PlayerProvider = ({ children }) => {
  // Состояние аудио
  const [currentAudioUrl, setCurrentAudioUrl] = useState(null); 
  const [isPlaying, setIsPlaying] = useState(false);             
  const [isLoading, setIsLoading] = useState(false);             
  const [error, setError] = useState(null);                      
  const [duration, setDuration] = useState(0);                   
  const [currentTime, setCurrentTime] = useState(0);             
  
  // НОВЫЕ СОСТОЯНИЯ ДЛЯ УПРАВЛЕНИЯ ПЛЕЕРОМ
  const [volume, setVolumeState] = useState(1.0); // Громкость (0.0 до 1.0)
  const [playbackRate, setPlaybackRateState] = useState(1.0); // Скорость (0.5 до 2.0)

  // Ссылка на объект Audio, чтобы управлять воспроизведением
  const audioRef = useRef(null);

  // --- Функции управления ---

  /**
   * Обновляет громкость и применяет к аудиоэлементу.
   */
  const setVolume = useCallback((newVolume) => {
    // Убедимся, что значение находится в пределах [0, 1]
    const safeVolume = Math.min(1.0, Math.max(0.0, newVolume));
    setVolumeState(safeVolume);
    if (audioRef.current) {
      audioRef.current.volume = safeVolume;
    }
  }, []);

  /**
   * Обновляет скорость воспроизведения и применяет к аудиоэлементу.
   */
  const setPlaybackRate = useCallback((newRate) => {
    // Убедимся, что значение находится в пределах [0.5, 2.0]
    const safeRate = Math.min(2.0, Math.max(0.5, newRate));
    setPlaybackRateState(safeRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = safeRate;
    }
  }, []);


  /**
   * Инициализация нового аудиофайла и запуск его воспроизведения.
   * @param {string} url - URL аудиофайла (Blob URL или API URL).
   * @param {string} text - Исходный текст (для сохранения в библиотеке)
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
    }
    
    // 2. Создание нового аудиоэлемента
    const audio = new Audio(url);
    audioRef.current = audio;
    setCurrentAudioUrl(url);
    setIsPlaying(false); // Начнем с паузы, но затем вызовем play()
    setError(null);
    setDuration(0);
    setCurrentTime(0);

    // 3. Установка текущих настроек
    audio.volume = volume; // Применяем текущую громкость
    audio.playbackRate = playbackRate; // Применяем текущую скорость

    // 4. Установка обработчиков событий
    audio.oncanplay = () => {
      setDuration(audio.duration);
      audio.play().then(() => setIsPlaying(true)).catch(e => {
        console.error("Audio playback failed:", e);
        setError("Не удалось начать воспроизведение. Проверьте настройки браузера.");
        setIsPlaying(false);
      });
    };
    audio.onended = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
    };
    audio.onerror = (e) => {
        console.error("Audio error:", e);
        setError("Ошибка при загрузке или воспроизведении аудио.");
        setIsLoading(false);
    };

    // Устанавливаем статус загрузки обратно в false, так как аудио уже загружено/запущено
    setIsLoading(false);

  }, [currentAudioUrl, volume, playbackRate]); 

  /**
   * Переключение между воспроизведением и паузой.
   */
  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      if (isPlaying) {
        audio.pause();
      } else {
        audio.play().catch(e => {
            console.error("Toggle play failed:", e);
            setError("Не удалось возобновить воспроизведение.");
        });
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  /**
   * Перемотка на заданную позицию.
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
    volume, // НОВОЕ
    playbackRate, // НОВОЕ
    setIsLoading, 
    setError,     
    setAudioUrl,  
    togglePlay,   
    seekTo,       
    resetPlayer,
    setVolume, // НОВОЕ
    setPlaybackRate, // НОВОЕ
  };

  return (
    <PlayerContext.Provider value={contextValue}>
      {children}
    </PlayerContext.Provider>
  );
};

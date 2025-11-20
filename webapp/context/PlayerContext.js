// Файл: webapp/context/PlayerContext.js (Аудио плеер)
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
  
  // НОВЫЕ СОСТОЯНИЯ ДЛЯ УПРАВЛЕНИЯ ПЛЕЕРОМ (Подготовка к Приоритету 2.2)
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
   * Устанавливает новый URL для аудио и запускает воспроизведение.
   * @param {string} url - URL аудиофайла (Blob URL или внешний URL)
   */
  const setAudioUrl = useCallback((url) => {
    resetPlayer(); // Сбрасываем предыдущий плеер
    
    if (!url) return;

    // Инициализируем Audio
    if (!audioRef.current) {
      // Используем window.audioPlayer как синглтон
      if (typeof window !== 'undefined') {
          window.audioPlayer = new Audio();
          audioRef.current = window.audioPlayer;
      }
    }
    
    const audio = audioRef.current;
    if (audio) {
      // Устанавливаем текущие настройки
      audio.volume = volume;
      audio.playbackRate = playbackRate;

      // Устанавливаем новый URL
      audio.src = url;
      
      // Запускаем воспроизведение
      audio.play().then(() => {
        setCurrentAudioUrl(url);
        setIsPlaying(true);
        setIsLoading(false);
      }).catch(e => {
        console.error("Failed to play audio:", e);
        setError("Не удалось начать воспроизведение.");
        setIsLoading(false);
        setIsPlaying(false);
      });
    }

  }, [volume, playbackRate]); 


  /**
   * Функция, которая управляет паузой/воспроизведением.
   */
  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !currentAudioUrl) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(e => {
        console.error("Play failed after toggle:", e);
        setError("Не удалось возобновить воспроизведение.");
      });
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, currentAudioUrl]);

  /**
   * Функция для принудительной остановки и сброса плеера.
   */
  const stopSpeech = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  }, []);

  /**
   * Устанавливает URL аудио, не запуская воспроизведение немедленно.
   * Используется для подготовки плеера при выборе из библиотеки.
   */
  const playSpeech = useCallback((url) => {
    if (!audioRef.current) {
        if (typeof window !== 'undefined') {
            window.audioPlayer = new Audio();
            audioRef.current = window.audioPlayer;
        }
    }

    const audio = audioRef.current;

    if (audio && url) {
        // Если URL не меняется, просто продолжаем/начинаем воспроизведение
        if (audio.src === url && !isPlaying) {
            audio.play().then(() => {
                setIsPlaying(true);
            }).catch(e => {
                console.error("Resume play failed:", e);
                setError("Не удалось возобновить воспроизведение.");
            });
            return;
        }
        
        // Если URL изменился, устанавливаем новый и начинаем играть
        if (audio.src !== url) {
            setCurrentAudioUrl(url);
            // Фактическая установка audio.src происходит в MiniPlayer/FullPlayer, 
            // чтобы избежать гонки состояний и проблем с DOM.
        }
        
        setCurrentAudioUrl(url); 
        setIsPlaying(true); 
    }

  }, [isPlaying]);


  // --- Эффекты: Прослушивание событий аудиоэлемента ---

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = (e) => {
        console.error("Audio playback error:", e);
        setError("Ошибка при воспроизведении аудио. Возможно, неверный формат.");
        setIsPlaying(false);
        setIsLoading(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    
    // Применение настроек
    audio.volume = volume;
    audio.playbackRate = playbackRate;


    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [volume, playbackRate]);


  // Отслеживание состояния isPlaying для синхронизации с audio.paused
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
        setIsPlaying(!audio.paused);
    }
  }, [isPlaying]);

  /**
   * Перемотка на заданную позицию.
   */
  const seekTo = useCallback((time) => {
    const audio = audioRef.current;
    if (audio && isFinite(time) && time >= 0 && time <= duration) {
      audio.currentTime = time;
      setCurrentTime(time);
    }
  }, [duration]);

  /**
   * Сброс всех состояний плеера (при очистке формы)
   */
  const resetPlayer = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    if (currentAudioUrl && currentAudioUrl.startsWith('blob:')) {
      URL.revokeObjectURL(currentAudioUrl); 
    }
    setCurrentAudioUrl(null);
    setIsPlaying(false);
    setIsLoading(false);
    setError(null);
    setDuration(0);
    setCurrentTime(0);
  }, [currentAudioUrl]); 

  // Объект контекста, который будет передан дочерним элементам
  const contextValue = {
    currentAudioUrl,
    isPlaying,
    isLoading,
    error,
    duration,
    currentTime,
    volume, 
    playbackRate, 
    setIsLoading, 
    setError,     
    setAudioUrl,  
    setVolume, 
    setPlaybackRate, 
    togglePlay,   
    stopSpeech,   
    seekTo,       
    resetPlayer,
    playSpeech, 
  };

  return <PlayerContext.Provider value={contextValue}>{children}</PlayerContext.Provider>;
};

export default PlayerProvider;

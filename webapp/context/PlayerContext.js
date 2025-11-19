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
  const [playbackRate, setPlaybackRateState] = useState(1.0);    // Скорость воспроизведения (1.0 = нормальная)
  const [volume, setVolumeState] = useState(1.0);                // Громкость (1.0 = 100%)

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
        URL.revokeObjectURL(currentAudioUrl); // Освобождаем предыдущий Blob URL
      }
    }

    // 2. Создаем новый Audio объект
    const newAudio = new Audio(url);
    newAudio.loop = false;
    
    // Устанавливаем текущие настройки скорости и громкости
    newAudio.playbackRate = playbackRate;
    newAudio.volume = volume;

    // 3. Настройка слушателей событий
    newAudio.addEventListener('loadedmetadata', () => {
      setDuration(newAudio.duration);
    });
    newAudio.addEventListener('timeupdate', () => {
      setCurrentTime(newAudio.currentTime);
    });
    newAudio.addEventListener('ended', () => {
      setIsPlaying(false);
      setCurrentTime(0);
    });
    newAudio.addEventListener('error', (e) => {
      console.error("Audio error:", e);
      setError("Ошибка воспроизведения аудио.");
      setIsLoading(false);
      setIsPlaying(false);
    });

    // 4. Сохраняем ссылку и запускаем
    audioRef.current = newAudio;
    setCurrentAudioUrl(url);
    setIsLoading(false); // Загрузка завершена
    
    newAudio.play().then(() => {
      setIsPlaying(true);
    }).catch(e => {
      console.error("Play failed:", e);
      setError("Воспроизведение было заблокировано браузером (требуется жест пользователя). Нажмите Play.");
      setIsPlaying(false);
    });
  }, [currentAudioUrl, playbackRate, volume]); // Зависимости для применения начальных значений

  /**
   * Переключение состояния воспроизведения.
   */
  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      if (isPlaying) {
        audio.pause();
      } else {
        // Убедимся, что скорость и громкость установлены, прежде чем играть
        audio.playbackRate = playbackRate;
        audio.volume = volume;
        audio.play().catch(e => {
            console.error("Resume play failed:", e);
            setError("Ошибка возобновления воспроизведения.");
        });
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying, playbackRate, volume]);
  
  /**
   * Установка новой скорости воспроизведения.
   */
  const setPlaybackRate = useCallback((rate) => {
      const audio = audioRef.current;
      if (audio) {
          audio.playbackRate = rate;
      }
      setPlaybackRateState(rate);
  }, []);

  /**
   * Установка новой громкости.
   */
  const setVolume = useCallback((vol) => {
      const audio = audioRef.current;
      if (audio) {
          audio.volume = vol;
      }
      setVolumeState(vol);
  }, []);

  /**
   * Перемотка на новую позицию в секундах
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
    // Сбрасывать rate/volume не обязательно, они могут оставаться как есть
    // setPlaybackRateState(1.0);
    // setVolumeState(1.0); 
  }, [currentAudioUrl]); 

  // Объект контекста, который будет передан дочерним элементам
  const contextValue = {
    currentAudioUrl,
    isPlaying,
    isLoading,
    error,
    duration,
    currentTime,
    playbackRate, // Новое
    volume,       // Новое
    setIsLoading, 
    setError,     
    setAudioUrl,  
    togglePlay,   
    seekTo,       
    resetPlayer,  
    setPlaybackRate, // Новое
    setVolume,       // Новое
  };

  return (
    <PlayerContext.Provider value={contextValue}>
      {children}
    </PlayerContext.Provider>
  );
};

export default PlayerContext;

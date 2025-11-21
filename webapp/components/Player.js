// Файл: webapp/components/Player.js
"use client"; // <-- КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ

import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Settings, Volume2, Maximize2 } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { useState } from 'react';

/**
 * Утилита для форматирования времени (секунды -> "М:СС")
 */
const formatTime = (time) => {
  if (!time || isNaN(time) || time < 0) return "0:00";
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Компонент управления аудиоплеером.
 */
export default function PlayerControl({ voice }) {
  const { 
    currentUrl, // Исправлено на currentUrl
    isPlaying, 
    togglePlay, 
    currentTime, 
    duration, 
    seekTo,
    isLoading,
    volume, 
    playbackRate, 
    setVolume, 
    setPlaybackRate, 
  } = usePlayer();
  
  const [showSettings, setShowSettings] = useState(false);

  // Плеер виден только если есть аудио или идет загрузка
  if (!currentUrl && !isLoading) {
    return null;
  }
  
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Обработчик перемотки (для ползунка)
  const handleSeek = (e) => {
    seekTo(parseFloat(e.target.value));
  };

  // Обработчик изменения скорости
  const handlePlaybackRateChange = (e) => {
    setPlaybackRate(parseFloat(e.target.value));
  };

  // Обработчик изменения громкости
  const handleVolumeChange = (e) => {
    setVolume(parseFloat(e.target.value));
  };
  
  // Варианты анимации для плеера
  const playerVariants = {
    hidden: { y: "100%", opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <AnimatePresence>
      <motion.div 
        key="player-control"
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={playerVariants}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gray-900/95 backdrop-blur-md shadow-2xl border-t border-gray-700/50"
      >
        <div className="max-w-xl mx-auto flex flex-col space-y-3">

          {/* 1. Главные элементы управления (Кнопка, Прогресс) */}
          <div className="flex items-center space-x-4">
            
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="p-3 rounded-full bg-accent-neon text-gray-900 hover:bg-accent-neon/80 transition-colors duration-200 shadow-lg"
              title={isPlaying ? 'Пауза' : 'Воспроизвести'}
              disabled={isLoading}
            >
              {isPlaying ? (
                <Pause className="h-6 w-6 fill-current" />
              ) : (
                <Play className="h-6 w-6 fill-current" />
              )}
            </button>
            
            {/* Ползунок времени */}
            <div className="flex-1 flex flex-col justify-center min-w-0">
                <span className="text-xs text-txt-secondary mb-1 truncate">
                    {/* Текст для отображения, например, текущий текст озвучки */}
                    {/* Здесь можно добавить индикатор загрузки, если isLoading */}
                    {isLoading ? "Загрузка..." : "Текущая озвучка"}
                </span>
                <div className="flex items-center space-x-2">
                    <span className="text-sm text-txt-secondary w-10 text-right">
                        {formatTime(currentTime)}
                    </span>
                    <div className="relative flex-1 h-3 group">
                        {/* Невидимый ползунок для управления */}
                        <input
                            type="range"
                            min="0"
                            max={duration || 0}
                            step="0.01"
                            value={currentTime}
                            onChange={handleSeek}
                            className="absolute top-0 w-full h-full opacity-0 cursor-pointer z-10"
                            disabled={!currentUrl || isLoading}
                        />
                        {/* Видимый прогресс-бар */}
                        <div className="absolute top-1/2 -translate-y-1/2 w-full h-1.5 rounded-full bg-gray-700/50">
                            <div 
                                className="h-1.5 rounded-full bg-accent-neon transition-all duration-100" 
                                style={{ width: `${progressPercent}%` }}
                            ></div>
                        </div>
                    </div>
                    <span className="text-sm text-txt-secondary w-10 text-left">
                        {formatTime(duration)}
                    </span>
                </div>
            </div>
            
            {/* Кнопка Настроек (Settings) */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-full transition-colors duration-200 ${showSettings ? 'bg-gray-700 text-accent-neon' : 'text-txt-secondary hover:bg-gray-700'}`}
              title="Настройки плеера"
            >
              <Settings className="h-6 w-6" />
            </button>
          </div>

          {/* 2. Блок настроек (скорость, громкость) */}
          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden pt-3 border-t border-gray-700/50"
              >
                <div className="space-y-3">
                  {/* Скорость (Активна) */}
                  <label className="block">
                    <span className="text-sm font-medium text-txt-secondary flex justify-between">
                       Скорость: <span>{playbackRate.toFixed(1)}x</span> 
                    </span>
                    <input type="range" min="0.5" max="2.0" step="0.1" 
                           value={playbackRate}
                           onChange={handlePlaybackRateChange} 
                           className="mt-1 w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-accent-neon/80" 
                    />
                  </label>
                  
                  {/* Громкость (Активна) */}
                  <label className="block">
                    <span className="text-sm font-medium text-txt-secondary flex justify-between">
                       Громкость: <span>{Math.round(volume * 100)}%</span>
                    </span>
                    <input type="range" min="0" max="1" step="0.01" 
                           value={volume}
                           onChange={handleVolumeChange} 
                           className="mt-1 w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-accent-neon/80"
                    />
                  </label>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </motion.div>
    </AnimatePresence>
  );
}

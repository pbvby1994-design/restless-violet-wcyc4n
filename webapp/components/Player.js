// Файл: webapp/components/Player.js
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
    currentAudioUrl, 
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
  if (!currentAudioUrl && !isLoading) {
    return null;
  }

  // Обработчик перемотки (для ползунка)
  const handleSeek = (e) => {
    seekTo(parseFloat(e.target.value));
  };

  // Обработчики громкости и скорости (Приоритет 2.2)
  const handleVolumeChange = (e) => {
    setVolume(parseFloat(e.target.value));
  };

  const handlePlaybackRateChange = (e) => {
    setPlaybackRate(parseFloat(e.target.value));
  };


  const tapEffect = { scale: 0.95 };

  // Анимация для выезжающего плеера
  const playerVariants = {
    hidden: { y: 100, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 30 } },
    exit: { y: 100, opacity: 0 }
  };

  // Анимация для блока настроек
  const settingsVariants = {
    hidden: { height: 0, opacity: 0, scaleY: 0.8 },
    visible: { 
      height: "auto", 
      opacity: 1, 
      scaleY: 1, 
      transition: { type: "tween", duration: 0.3 } 
    },
    exit: { 
      height: 0, 
      opacity: 0, 
      scaleY: 0.8,
      transition: { type: "tween", duration: 0.3 } 
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        key="player-control"
        variants={playerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="fixed bottom-0 left-0 right-0 z-40 p-4"
      >
        <div className="max-w-md mx-auto card-glass backdrop-blur-md p-4 rounded-xl shadow-neon-lg border border-white/5">
          
          {/* 1. Заголовок и настройки */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-txt-primary truncate">
              {voice === 'Library' ? 'Запись из Библиотеки' : 'Новая Генерация'}
            </h2>
            <motion.button
              onClick={() => setShowSettings(!showSettings)}
              whileTap={tapEffect}
              className={`p-2 rounded-full transition-colors duration-200 ${
                showSettings ? 'bg-accent-neon/20 text-accent-neon' : 'text-txt-secondary hover:text-white'
              }`}
              title="Настройки плеера"
            >
              <Settings size={20} />
            </motion.button>
          </div>

          {/* 2. Ползунок прогресса */}
          <div className="relative mb-4">
            <input 
              type="range" 
              min="0" 
              max={duration || 0}
              step="0.1" 
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-accent-neon/80"
            />
            <div className="flex justify-between text-xs font-mono text-txt-secondary mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* 3. Кнопки управления */}
          <div className="flex items-center justify-center space-x-8">
            <motion.button 
              whileTap={tapEffect}
              disabled 
              className="text-txt-secondary disabled:opacity-30 hover:text-white transition"
            >
              <SkipBack size={24} />
            </motion.button>
            
            {/* Главная кнопка Play/Pause */}
            <motion.button 
              onClick={togglePlay}
              whileTap={{ scale: 0.85 }}
              className="w-14 h-14 rounded-full bg-accent-neon shadow-neon-lg flex items-center justify-center text-white hover:bg-accent-light transition"
            >
              {isPlaying 
                ? <Pause size={30} fill="white" /> 
                : <Play size={30} fill="white" className="ml-1" />
              }
            </motion.button>
            
            <motion.button 
              whileTap={tapEffect}
              disabled 
              className="text-txt-secondary disabled:opacity-30 hover:text-white transition"
            >
              <SkipForward size={24} />
            </motion.button>
          </div>

          {/* 4. Настройки скорости и громкости (Скрываемый блок) */}
          <AnimatePresence>
            {showSettings && (
              <motion.div
                key="settings-panel"
                variants={settingsVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="mt-4 pt-4 border-t border-white/10 overflow-hidden"
                style={{ originY: 0 }}
              >
                <div className="space-y-3">
                  {/* Скорость Воспроизведения (Активна) */}
                  <label className="block">
                    <span className="text-sm font-medium text-txt-secondary flex justify-between">
                       Скорость: <span>{playbackRate.toFixed(1)}x</span> 
                    </span>
                    <input type="range" min="0.5" max="2.0" step="0.1" 
                           value={playbackRate}
                           onChange={handlePlaybackRateChange} // ✅ ИСПРАВЛЕНИЕ: Логика теперь активна
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
                           onChange={handleVolumeChange} // ✅ ИСПРАВЛЕНИЕ: Логика теперь активна
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

// Файл: webapp/components/Player.js
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

// Иконки SVG (для Framer Motion)
const PlayIcon = ({ className }) => (
    <motion.svg 
        key="play" 
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.5, opacity: 0 }}
        width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}
    >
        <polygon points="5 3 19 12 5 21 5 3" />
    </motion.svg>
);

const PauseIcon = ({ className }) => (
    <motion.svg 
        key="pause" 
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.5, opacity: 0 }}
        width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}
    >
        <rect x="6" y="4" width="4" height="16" />
        <rect x="14" y="4" width="4" height="16" />
    </motion.svg>
);

const SettingsIcon = ({ className }) => (
    <svg 
        width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}
    >
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1.51-1V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
);


const Player = ({ isPlaying, togglePlay, currentAudio, loading }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Обновление состояния времени при воспроизведении
  if (currentAudio) {
    currentAudio.ontimeupdate = () => setCurrentTime(currentAudio.currentTime);
    currentAudio.onloadedmetadata = () => setDuration(currentAudio.duration);
  }

  // Форматирование времени в MM:SS
  const formatTime = (time) => {
    if (!time || isNaN(time) || time < 0) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e) => {
    if (currentAudio) {
      const seekTime = parseFloat(e.target.value);
      currentAudio.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  };

  const isPlayerVisible = isPlaying || loading || currentAudio;
  
  return (
    <AnimatePresence>
      {isPlayerVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          // Фон с размытием (blur) для современного эффекта
          className="fixed bottom-0 left-0 right-0 p-4 shadow-2xl bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md rounded-t-3xl z-50 border-t border-gray-200 dark:border-zinc-700"
        >
          {/* Индикатор загрузки */}
          {loading && (
            <motion.div 
              className="text-center py-2 text-blue-600 dark:text-blue-400 font-bold"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              🎤 Генерация голоса...
            </motion.div>
          )}

          {/* Основной контроллер плеера */}
          {!loading && currentAudio && (
            <div className="flex items-center space-x-4">
                {/* Кнопка Play/Pause */}
                <motion.button
                    onClick={togglePlay}
                    whileTap={{ scale: 0.9 }} 
                    className="p-3 bg-blue-600 rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center relative z-10"
                >
                    <AnimatePresence mode="wait">
                        {isPlaying ? (
                            <PauseIcon className="text-white w-6 h-6" />
                        ) : (
                            <PlayIcon className="text-white w-6 h-6" />
                        )}
                    </AnimatePresence>
                </motion.button>
              
              {/* Таймер и Слайдер */}
              <div className="flex-grow">
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
                {/* Слайдер (Range Input) */}
                <input 
                  type="range" 
                  min="0" 
                  max={duration || 0}
                  value={currentTime}
                  step="0.01"
                  onChange={handleSeek}
                  // Стили для Range Input с учетом кастомных CSS переменных
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-zinc-700"
                  disabled={!currentAudio}
                />
              </div>

              {/* Кнопка настроек */}
              <motion.button
                onClick={() => setShowSettings(!showSettings)}
                whileTap={{ scale: 0.9 }}
                className={`p-3 rounded-full transition-all ${
                  showSettings ? 'bg-blue-100 dark:bg-zinc-700 text-blue-600' : 'bg-transparent text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-zinc-700'
                }`}
              >
                <SettingsIcon className="w-6 h-6" />
              </motion.button>
            </div>
          )}

          {/* Панель настроек (анимированное появление) */}
          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                className="mt-4 p-4 rounded-xl bg-gray-50 dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 shadow-inner"
              >
                <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">Настройки Голоса</h3>
                <div className="space-y-4">
                  
                  {/* Выбор голоса */}
                  <label className="block">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Выбор голоса:</span>
                    <select className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-zinc-800 dark:border-zinc-600 text-gray-800 dark:text-white transition-colors">
                      <option value="default">Стандартный (Бесплатно)</option>
                      <option value="premium_voice" disabled>Профессиональный (Премиум)</option>
                    </select>
                  </label>
                  
                  {/* Слайдер скорости */}
                  <label className="block">
                    <div className="flex justify-between text-sm font-medium text-gray-700 dark:text-gray-300">
                        <span>Скорость чтения:</span>
                        <span>1.0x</span>
                    </div>
                    <input 
                      type="range" 
                      min="0.5" 
                      max="2.0" 
                      step="0.1" 
                      defaultValue="1.0" 
                      className="mt-1 w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-zinc-800"
                    />
                  </label>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Player;

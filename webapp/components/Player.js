// Файл: webapp/components/Player.js (Applesque Style)

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

// Иконки SVG для Play и Pause с Framer Motion
const PlayIcon = ({ className }) => (
    <motion.svg 
        key="play" 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}
    >
        <polygon points="5 3 19 12 5 21 5 3" />
    </motion.svg>
);

const PauseIcon = ({ className }) => (
    <motion.svg 
        key="pause" 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
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

  // Форматирование времени в M:SS (Apple style)
  const formatTime = (time) => {
    if (!time || isNaN(time) || time < 0) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
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
          transition={{ type: "spring", stiffness: 350, damping: 35 }}
          // App-стиль: Фон с размытием (Frosted Glass Effect)
          className="fixed bottom-0 left-0 right-0 p-4 shadow-2xl bg-white/70 dark:bg-zinc-900/80 backdrop-blur-xl rounded-t-3xl z-50 border-t border-gray-200/50 dark:border-zinc-700/50 font-sans"
        >
          {/* Индикатор загрузки */}
          {loading && (
            <motion.div 
              className="text-center py-2 text-blue-500 dark:text-blue-300 font-semibold tracking-wide"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              🎤 Генерация голоса...
            </motion.div>
          )}

          {/* Основной контроллер плеера */}
          {!loading && currentAudio && (
            <div className="flex items-center space-x-4">
                {/* Кнопка Play/Pause - Крупная, чистая */}
                <motion.button
                    onClick={togglePlay}
                    whileTap={{ scale: 0.95 }} // Плавное нажатие
                    className="p-4 bg-blue-500 rounded-full shadow-lg shadow-blue-500/40 hover:bg-blue-600 transition-colors flex items-center justify-center relative z-10"
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
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 font-medium mb-1 tracking-wider">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
                {/* Слайдер (Range Input) - Тонкий дизайн */}
                <input 
                  type="range" 
                  min="0" 
                  max={duration || 0}
                  value={currentTime}
                  step="0.01"
                  onChange={handleSeek}
                  // Стилизация слайдера в App-стиле (требует кастомных CSS)
                  className="w-full h-1 appearance-none bg-gray-300 rounded-full cursor-pointer dark:bg-zinc-700 transition-colors"
                  style={{
                    // Добавьте эти переменные в globals.css, если стандартные стили Tailwind не работают
                    '--tw-range-thumb-color': '#3b82f6', // blue-500
                    '--tw-range-progress-color': '#3b82f6', 
                  }}
                  disabled={!currentAudio}
                />
              </div>

              {/* Кнопка настроек */}
              <motion.button
                onClick={() => setShowSettings(!showSettings)}
                whileTap={{ scale: 0.95 }}
                className={`p-3 rounded-full transition-all ${
                  showSettings ? 'bg-blue-100 dark:bg-zinc-700 text-blue-600' : 'bg-transparent text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-zinc-800'
                }`}
              >
                <SettingsIcon className="w-6 h-6" />
              </motion.button>
            </div>
          )}

          {/* Панель настроек (Frosted Glass Card) */}
          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                className="mt-4 p-5 rounded-2xl bg-white/60 dark:bg-zinc-800/70 backdrop-blur-md border border-gray-300/50 dark:border-zinc-700/50 shadow-inner"
              >
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Параметры Голоса</h3>
                <div className="space-y-4">
                  
                  {/* Выбор голоса */}
                  <label className="block">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Выбор голоса:</span>
                    <select className="mt-1 block w-full py-2 px-3 rounded-xl border border-gray-300 dark:border-zinc-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-zinc-900 text-gray-800 dark:text-white transition-colors">
                      <option value="default">Стандартный (Елена)</option>
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
                      className="mt-1 w-full h-1 appearance-none bg-gray-300 rounded-full cursor-pointer dark:bg-zinc-800"
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

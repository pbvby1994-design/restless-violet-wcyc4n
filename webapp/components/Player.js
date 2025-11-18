// Файл: webapp/components/Player.js
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

const Player = ({ isPlaying, togglePlay, currentAudio, loading, error, voice }) => {
  const [showSettings, setShowSettings] = useState(false);
  
  // Эффект нажатия
  const tapEffect = { scale: 0.95 };

  return (
    <AnimatePresence>
      {(isPlaying || loading || error) && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 p-4 shadow-2xl bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md rounded-t-2xl z-50 border-t border-gray-200 dark:border-zinc-700"
        >
          {loading && (
            <motion.div 
              className="text-center py-2 text-blue-500 font-semibold"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              🎤 Генерация голоса...
            </motion.div>
          )}

          {error && (
            <div className="text-center py-2 text-red-500 font-semibold">
              ❌ Ошибка: {error}
            </div>
          )}

          {currentAudio && !loading && (
            <div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Голос: {voice === 'default' ? 'Стандартный (gTTS)' : 'ПРЕМИУМ (ЗАГЛУШКА)'}
                </div>
                <motion.button 
                  onClick={() => setShowSettings(!showSettings)}
                  whileTap={tapEffect}
                  className="p-2 text-gray-600 dark:text-gray-300 hover:text-blue-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M11.493 3.51a1 1 0 010 1.983 2.5 2.5 0 00-3.197 3.197 1 1 0 01-1.983 0 4.5 4.5 0 015.18-5.18zM10 8a2 2 0 100 4 2 2 0 000-4z" clipRule="evenodd" />
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-7-8a7 7 0 1114 0 7 7 0 01-14 0z" clipRule="evenodd" />
                  </svg>
                </motion.button>
              </div>

              <div className="flex items-center justify-center space-x-6 mt-2">
                {/* Кнопка Play/Pause */}
                <motion.button
                  onClick={togglePlay}
                  whileTap={tapEffect}
                  className="w-16 h-16 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-lg hover:bg-blue-600 transition-colors"
                >
                  {currentAudio.paused ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 ml-1" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M11.97 3.97a.75.75 0 00-1.06 0l-5.5 5.5a.75.75 0 000 1.06l5.5 5.5a.75.75 0 001.06-1.06L7.56 10l4.41-4.41a.75.75 0 000-1.06z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 4h3v12H5V4zm7 0h3v12h-3V4z" clipRule="evenodd" />
                    </svg>
                  )}
                </motion.button>
              </div>

              {/* Настройки голоса (Плавное появление) */}
              <AnimatePresence>
                {showSettings && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden mt-4 pt-4 border-t border-gray-200 dark:border-zinc-700"
                  >
                    <h3 className="text-lg font-semibold mb-2">Настройки Голоса</h3>
                    <div className="space-y-3">
                      <label className="block">
                        <span className="text-sm font-medium">Выбор голоса:</span>
                        {/* Здесь будет Select с опциями */}
                        <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-zinc-700 dark:border-zinc-600">
                          <option value="default">Стандартный (Бесплатно)</option>
                          <option value="premium_voice" disabled>Профессиональный (Премиум)</option>
                        </select>
                      </label>
                      {/* Слайдер скорости (добавим логику позже) */}
                      <label className="block">
                        <span className="text-sm font-medium">Скорость чтения: 1.0x</span>
                        <input type="range" min="0.5" max="2.0" step="0.1" defaultValue="1.0" className="mt-1 w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-zinc-700" />
                      </label>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Player;

import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Settings, Volume2, Maximize2 } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { useState } from 'react';

/**
 * Утилита для форматирования времени (секунды -> "М:СС")
 * @param {number} time - Время в секундах
 * @returns {string} Отформатированное время
 */
const formatTime = (time) => {
  if (!time || isNaN(time) || time < 0) return "0:00";
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Компонент управления аудиоплеером.
 * Фиксирован в нижней части экрана и видим только при наличии currentAudioUrl.
 * @param {object} props - Свойства компонента.
 * @param {string} props.voice - Имя текущего выбранного голоса для отображения.
 */
export default function PlayerControl({ voice }) {
  const { 
    currentAudioUrl, 
    isPlaying, 
    togglePlay, 
    currentTime, 
    duration, 
    seekTo,
    isLoading
  } = usePlayer();
  
  const [showSettings, setShowSettings] = useState(false);

  // Плеер виден только если есть аудио или идет загрузка
  if (!currentAudioUrl && !isLoading) {
    return null;
  }

  // Вычисление прогресса в процентах
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  
  // Эффект нажатия
  const tapEffect = { scale: 0.95 };

  // --- ОБРАБОТЧИКИ СОБЫТИЙ ДЛЯ ПОЛЗУНКА ---

  // Когда пользователь начинает перетаскивать ползунок
  const handleSeekStart = (e) => {
    // В будущем тут можно было бы остановить автоматическое обновление currentTime
  };

  // Когда пользователь перемещает ползунок (обновляет отображаемое время)
  const handleSeekChange = (e) => {
    const time = parseFloat(e.target.value);
    // Для более плавного обновления, можно обновлять только локальное состояние 
    // во время перетаскивания, но для простоты мы сразу передаем в контекст.
    seekTo(time);
  };

  // Когда пользователь отпускает ползунок
  const handleSeekEnd = (e) => {
    const time = parseFloat(e.target.value);
    seekTo(time); // Убедимся, что финальная позиция применена
  };


  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        exit={{ y: 100 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-6 pt-2"
      >
        <div className="mx-auto max-w-md bg-bg-glass backdrop-blur-xl border border-white/10 rounded-3xl shadow-neon/30 p-4 transition-all duration-300">
          
          {/* Верхняя часть: Название и Настройки */}
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold text-accent-neon truncate">
              {isLoading ? 'Генерация...' : `Аудио Голосом: ${voice}`}
            </h3>
            
            {/* Кнопка Настроек */}
            <motion.button
              onClick={() => setShowSettings(!showSettings)}
              whileTap={tapEffect}
              className={`p-1 rounded-full transition-all duration-300 ${
                showSettings ? 'bg-accent-deep text-accent-neon' : 'text-txt-secondary hover:text-txt-primary'
              }`}
            >
              <Settings size={18} className={showSettings ? 'rotate-90' : ''}/>
            </motion.button>
          </div>
          
          {/* Ползунок Прогресса */}
          <div className="relative mb-2">
            <input
              type="range"
              min="0"
              max={duration || 0}
              step="0.1"
              value={currentTime}
              onChange={handleSeekChange}
              onMouseDown={handleSeekStart}
              onTouchStart={handleSeekStart}
              onMouseUp={handleSeekEnd}
              onTouchEnd={handleSeekEnd}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-accent-neon/80"
              style={{
                background: `linear-gradient(to right, var(--tw-colors-accent-neon) ${progressPercent}%, #ffffff1a ${progressPercent}%)`
              }}
              disabled={!currentAudioUrl}
            />
            {/* Отображение времени */}
            <div className="flex justify-between text-xs text-txt-muted mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Элементы управления воспроизведением */}
          <div className="flex items-center justify-center space-x-6 mt-4">
            
            {/* Кнопка Skip Back (Перемотка назад на 10 сек) */}
            <motion.button
              onClick={() => seekTo(currentTime - 10)}
              whileTap={tapEffect}
              disabled={!currentAudioUrl || isLoading}
              className="text-txt-secondary hover:text-txt-primary transition-colors disabled:opacity-30"
            >
              <SkipBack size={24} />
            </motion.button>

            {/* Главная Кнопка Play/Pause */}
            <motion.button
              onClick={togglePlay}
              whileTap={{ scale: 0.9 }}
              disabled={!currentAudioUrl || isLoading}
              className="w-14 h-14 bg-accent-neon rounded-full flex items-center justify-center shadow-lg shadow-accent-neon/50 hover:bg-accent-light transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-t-white border-white/50 rounded-full animate-spin"></div>
              ) : isPlaying ? (
                <Pause size={28} fill="white" className="text-white ml-0.5" />
              ) : (
                <Play size={28} fill="white" className="text-white ml-1.5" />
              )}
            </motion.button>
            
            {/* Кнопка Skip Forward (Перемотка вперед на 10 сек) */}
            <motion.button
              onClick={() => seekTo(currentTime + 10)}
              whileTap={tapEffect}
              disabled={!currentAudioUrl || isLoading}
              className="text-txt-secondary hover:text-txt-primary transition-colors disabled:opacity-30"
            >
              <SkipForward size={24} />
            </motion.button>
          </div>

          {/* Панель Настроек (выдвигается) */}
          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden pt-4 mt-4 border-t border-white/10 space-y-3"
              >
                <div className="space-y-3">
                  {/* Скорость Воспроизведения (Заглушка) */}
                  <label className="block">
                    <span className="text-sm font-medium text-txt-secondary flex justify-between">
                       Скорость: <span>1.0x</span> 
                    </span>
                    <input type="range" min="0.5" max="2.0" step="0.1" defaultValue="1.0" 
                           className="mt-1 w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-accent-neon/80" 
                           disabled // Логика скорости пока не реализована в PlayerContext
                    />
                  </label>
                  
                  {/* Громкость (Заглушка) */}
                  <label className="block">
                    <span className="text-sm font-medium text-txt-secondary flex justify-between">
                       Громкость: <Volume2 size={16}/>
                    </span>
                    <input type="range" min="0" max="1" step="0.1" defaultValue="1.0" 
                           className="mt-1 w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-accent-neon/80"
                           disabled // Логика громкости пока не реализована в PlayerContext
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

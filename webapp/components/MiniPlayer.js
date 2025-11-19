import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, ChevronUp } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { useCallback, useEffect } from 'react';

// Утилита для форматирования времени (секунды -> "М:СС")
const formatTime = (time) => {
  if (!time || isNaN(time)) return "0:00";
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Минималистичный плеер, который появляется внизу экрана.
 * @param {function} onOpenFullPlayer - Функция для открытия полноэкранного плеера.
 */
export default function MiniPlayer({ onOpenFullPlayer }) {
  const { 
    currentTrack, 
    isPlaying, 
    togglePlay, 
    currentTime, 
    duration,
    seekTo,
    isLoading
  } = usePlayer();

  // Плеер не отображается, если нет трека или он в процессе загрузки
  const isVisible = currentTrack && !isLoading;

  // Вычисление прогресса в процентах
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  
  // Обработчик нажатия на MiniPlayer для открытия FullPlayer
  const handleOpen = useCallback(() => {
    if (isVisible && onOpenFullPlayer) {
      onOpenFullPlayer();
    }
  }, [isVisible, onOpenFullPlayer]);


  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 150 }}
          // Фиксированная позиция над TabBar
          className="fixed bottom-20 left-0 right-0 z-40 px-4 select-none"
        >
          <div 
            onClick={handleOpen}
            className="card-glass mx-auto max-w-md p-3 cursor-pointer overflow-hidden relative"
            style={{ 
              // Настраиваемая граница с цветом прогресса
              border: '1px solid rgba(255, 255, 255, 0.1)',
              paddingBottom: '1rem' // Запас для прогресс-бара
            }}
          >
            {/* Полоса прогресса внизу карточки */}
            <div 
              className="absolute bottom-0 left-0 h-1 bg-accent-neon rounded-br-xl transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />

            <div className="flex items-center gap-4">
              {/* Обложка/Иконка (кнопка открытия) */}
              <button 
                onClick={(e) => {
                  e.stopPropagation(); // Не открывать FullPlayer при нажатии на иконку
                  handleOpen();
                }}
                className="w-10 h-10 rounded-xl bg-accent-deep flex items-center justify-center text-white shadow-neon-sm hover:opacity-90 transition flex-shrink-0"
              >
                <ChevronUp size={20} />
              </button>

              {/* Информация о треке */}
              <div className="flex-grow min-w-0">
                <p className="text-white font-semibold text-base truncate">{currentTrack.title}</p>
                <p className="text-txt-secondary text-xs truncate">{currentTrack.author}</p>
              </div>

              {/* Кнопка Play/Pause */}
              <motion.button
                onClick={(e) => {
                  e.stopPropagation(); // Предотвратить открытие FullPlayer при нажатии на Play/Pause
                  togglePlay();
                }}
                whileTap={{ scale: 0.9 }}
                className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center flex-shrink-0"
              >
                {isPlaying ? <Pause size={20} fill="black" /> : <Play size={20} fill="black" className="ml-1" />}
              </motion.button>
            </div>
            
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

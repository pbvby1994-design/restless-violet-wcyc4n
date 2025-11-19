import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Settings, Volume2, X } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { useState, useCallback } from 'react';

// Утилита для форматирования времени (секунды -> "М:СС")
const formatTime = (time) => {
  if (!time || isNaN(time)) return "0:00";
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

// Симуляция эквалайзера для визуализации
const Equalizer = () => {
  const { isPlaying } = usePlayer();
  const barCount = 10; // Количество полос

  return (
    <div className={`flex items-end justify-center h-20 w-full transition-opacity duration-500 ${isPlaying ? '' : 'opacity-50'}`}>
      {Array.from({ length: barCount }).map((_, index) => {
        // Рандомизированные начальные высоты и задержки для имитации
        const initialHeight = Math.random() * 20 + 5;
        const delay = index * 0.1;
        
        return (
          <motion.div
            key={index}
            className="bar w-1 mx-[1px] rounded-full bg-accent-neon"
            initial={{ height: `${initialHeight}px` }}
            animate={{ 
              height: isPlaying ? ["20px", "60px", "10px", "45px", "30px", "55px", "15px", "50px", "25px", "40px", "20px"] : `${initialHeight}px`,
            }}
            transition={{ 
              duration: 1.5,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
              delay: delay,
            }}
            style={{ 
              // Настраиваемая высота, чтобы не использовать динамические классы
              minHeight: '4px',
              maxHeight: '100%',
              backgroundColor: 'var(--color-accent-neon)' // Используем переменную для CSS-стиля
            }}
          />
        );
      })}
    </div>
  );
};

/**
 * Полноэкранный модальный плеер.
 * @param {boolean} isOpen - Видимость модала.
 * @param {function} onClose - Функция закрытия.
 */
export default function FullPlayer({ isOpen, onClose }) {
  const { 
    currentTrack, 
    isPlaying, 
    togglePlay, 
    currentTime, 
    duration, 
    seekTo,
    // В будущем тут могут быть функции skip, setVolume и setSpeed
  } = usePlayer();
  
  const [showSettings, setShowSettings] = useState(false);

  // Сбрасываем настройки при закрытии
  const handleClose = useCallback(() => {
    setShowSettings(false);
    onClose();
  }, [onClose]);

  if (!currentTrack) return null; // Не показывать, если нет активного трека

  // Вычисление прогресса в процентах
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  
  // Обработчик изменения ползунка прогресса
  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    seekTo(newTime);
  };

  const tapEffect = { scale: 0.95 };
  
  // Обложка - большая кнопка
  const CoverButton = (
    <div className="w-full aspect-square bg-accent-deep rounded-2xl shadow-neon-lg-deep flex items-center justify-center relative">
      <h2 className="text-6xl font-extrabold text-white/50 select-none">TTS</h2>
      {/* Имитация эквалайзера */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-center">
        <Equalizer />
      </div>
    </div>
  );
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="full-player"
          className="fixed inset-0 z-[100] bg-bg-default p-4 flex flex-col overflow-y-auto"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'tween', duration: 0.3 }}
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <motion.button 
              onClick={handleClose}
              whileTap={tapEffect}
              className="p-2 rounded-full bg-white/5 text-white hover:bg-white/10 transition"
            >
              <X size={24} />
            </motion.button>
            <h1 className="text-lg font-bold text-white">Сейчас Играет</h1>
            <motion.button 
              onClick={() => setShowSettings(!showSettings)}
              whileTap={tapEffect}
              className={`p-2 rounded-full transition ${showSettings ? 'text-accent-neon bg-white/10' : 'text-white bg-white/5 hover:bg-white/10'}`}
            >
              <Settings size={24} />
            </motion.button>
          </div>

          <div className="flex flex-col items-center justify-center flex-grow space-y-8 pb-12">
            
            {/* Обложка */}
            <motion.div 
              className="w-full max-w-xs sm:max-w-sm"
              animate={{ rotate: isPlaying ? 0.5 : 0 }} 
              transition={{ type: 'spring', damping: 10, stiffness: 100 }}
            >
              {CoverButton}
            </motion.div>

            {/* Заголовок */}
            <div className="text-center w-full max-w-md">
              <h2 className="text-2xl font-extrabold text-white truncate">{currentTrack.title}</h2>
              <p className="text-txt-secondary text-sm mt-1">{currentTrack.author}</p>
            </div>

            {/* Настройки (скрываются, если не нужны) */}
            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="w-full max-w-sm card-glass overflow-hidden my-4"
                >
                  <div className="space-y-4">
                    {/* Скорость воспроизведения */}
                    <label className="block">
                      <span className="text-sm font-medium text-txt-secondary flex justify-between">
                        Скорость: 1.0x (Пока не активно)
                      </span>
                      <input type="range" min="0.5" max="2.0" step="0.1" defaultValue="1.0" 
                             className="mt-1 w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-accent" 
                             disabled 
                      />
                    </label>
                    
                    {/* Громкость */}
                    <label className="block">
                      <span className="text-sm font-medium text-txt-secondary flex justify-between">
                         Громкость: 100% (Пока не активно) <Volume2 size={16}/>
                      </span>
                      <input type="range" min="0" max="1" step="0.1" defaultValue="1.0" 
                             className="mt-1 w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-accent"
                             disabled 
                      />
                    </label>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Прогресс-бар и время */}
            <div className="w-full max-w-sm">
              <input 
                type="range" 
                min="0" 
                max={duration} 
                step="0.1" 
                value={currentTime} 
                onChange={handleSeek}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-accent" 
              />
              <div className="flex justify-between text-xs text-txt-secondary mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Основные кнопки управления */}
            <div className="flex items-center justify-center space-x-8 w-full max-w-sm">
              <motion.button 
                whileTap={tapEffect}
                disabled // Пока не активны
                className="text-txt-secondary disabled:opacity-30 hover:text-white transition"
              >
                <SkipBack size={32} />
              </motion.button>
              
              {/* Главная кнопка Play/Pause */}
              <motion.button 
                onClick={togglePlay}
                whileTap={{ scale: 0.85 }}
                className="w-20 h-20 rounded-full bg-accent-neon shadow-neon-lg flex items-center justify-center text-white hover:bg-accent/90 transition"
              >
                {isPlaying 
                  ? <Pause size={40} fill="white" /> 
                  : <Play size={40} fill="white" className="ml-1" />
                }
              </motion.button>
              
              <motion.button 
                whileTap={tapEffect}
                disabled // Пока не активны
                className="text-txt-secondary disabled:opacity-30 hover:text-white transition"
              >
                <SkipForward size={32} />
              </motion.button>
            </div>

          </div>
          
        </motion.div>
      )}
    </AnimatePresence>
  );
}

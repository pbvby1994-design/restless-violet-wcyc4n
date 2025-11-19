// Файл: webapp/components/Player.js
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Settings, Volume2, FastForward, Rewind } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { useState } from 'react';

// Утилита для форматирования времени (секунды -> "М:СС")
const formatTime = (time) => {
  if (!time || isNaN(time) || time < 0) return "0:00";
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Компонент управления аудио плеером.
 * Он использует контекст usePlayer для доступа к состоянию аудио и функциям управления.
 */
export default function PlayerControl() {
  const { 
    currentAudioUrl, 
    isPlaying, 
    togglePlay, 
    currentTime, 
    duration, 
    seekTo,
    isLoading // Показываем анимацию загрузки, пока нет аудио
  } = usePlayer();
  
  const [showSettings, setShowSettings] = useState(false);

  // Эффект нажатия
  const tapEffect = { scale: 0.95 };

  // Если нет аудио URL и нет активной загрузки, плеер скрыт
  if (!currentAudioUrl && !isLoading) {
    return null;
  }
  
  // Если идет загрузка, показываем стилизованный эквалайзер
  if (isLoading) {
    return (
      <div className="card-glass flex items-center justify-center h-28">
        <div className="flex items-end h-10 w-24">
          <div className="bar"></div>
          <div className="bar"></div>
          <div className="bar"></div>
          <div className="bar"></div>
          <div className="bar"></div>
        </div>
        <span className="ml-4 text-txt-secondary text-sm">Подготовка аудио...</span>
      </div>
    );
  }

  // Вычисление прогресса в процентах
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  
  // Обработчик изменения ползунка прогресса
  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    seekTo(newTime);
  };
  
  // Обработчики быстрой перемотки
  const skipTime = 5; // 5 секунд
  const skipForward = () => seekTo(Math.min(currentTime + skipTime, duration));
  const skipBack = () => seekTo(Math.max(currentTime - skipTime, 0));

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="card-glass w-full"
      >
        <div className="space-y-4">
          
          {/* 1. Progress Bar and Time */}
          <div className="w-full">
            <input 
              type="range"
              min="0"
              max={duration}
              step="0.1"
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-accent"
              style={{
                background: `linear-gradient(to right, var(--color-accent-default) 0%, var(--color-accent-default) ${progressPercent}%, rgba(255, 255, 255, 0.1) ${progressPercent}%, rgba(255, 255, 255, 0.1) 100%)`
              }}
            />
            <div className="flex justify-between text-xs font-mono mt-1 text-txt-secondary">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* 2. Controls */}
          <div className="flex justify-center items-center space-x-6">
            {/* Настройки (пока неактивно) */}
            <motion.button 
              onClick={() => setShowSettings(!showSettings)}
              whileTap={tapEffect}
              className={`p-2 rounded-full transition-colors ${
                showSettings ? 'bg-accent/20 text-accent-neon' : 'text-txt-muted hover:text-txt-primary'
              }`}
            >
              <Settings size={24} />
            </motion.button>
            
            {/* Назад на 5 сек */}
            <motion.button 
              onClick={skipBack}
              whileTap={tapEffect}
              className="text-txt-primary hover:text-accent transition-colors"
            >
              <Rewind size={32} />
            </motion.button>

            {/* Play/Pause */}
            <motion.button 
              onClick={togglePlay}
              whileTap={{ scale: 0.9 }}
              className="bg-accent text-white p-3 rounded-full shadow-lg shadow-accent/50 hover:bg-accent-light transition-all"
            >
              {isPlaying ? <Pause size={32} fill="white" /> : <Play size={32} fill="white" className="translate-x-[2px]" />}
            </motion.button>

            {/* Вперед на 5 сек */}
            <motion.button 
              onClick={skipForward}
              whileTap={tapEffect}
              className="text-txt-primary hover:text-accent transition-colors"
            >
              <FastForward size={32} />
            </motion.button>
            
            {/* Громкость (пока неактивно) */}
            <motion.button 
              whileTap={tapEffect}
              className="p-2 rounded-full text-txt-muted hover:text-txt-primary transition-colors"
              disabled
            >
              <Volume2 size={24} />
            </motion.button>
          </div>
          
          {/* 3. Settings Dropdown */}
          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden pt-4 border-t border-white/10"
              >
                <div className="space-y-4">
                  {/* Скорость */}
                  <label className="block">
                    <span className="text-sm font-medium text-txt-secondary flex justify-between">
                       Скорость: 1.0x
                    </span>
                    <input type="range" min="0.5" max="2.0" step="0.1" defaultValue="1.0" 
                           className="mt-1 w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-accent" 
                           disabled // Логика скорости пока не реализована в PlayerContext
                    />
                  </label>
                  
                  {/* Громкость */}
                  <label className="block">
                    <span className="text-sm font-medium text-txt-secondary flex justify-between">
                       Громкость: 100% <Volume2 size={16}/>
                    </span>
                    <input type="range" min="0" max="1" step="0.1" defaultValue="1.0" 
                           className="mt-1 w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-accent"
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

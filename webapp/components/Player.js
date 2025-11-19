// Файл: webapp/components/Player.js
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Settings, Volume2 } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { useState } from 'react';

// Утилита для форматирования времени (секунды -> "М:СС")
const formatTime = (time) => {
  if (!time || isNaN(time)) return "0:00";
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export default function PlayerControl({ voice }) {
  const { 
    currentAudioUrl, 
    isPlaying, 
    togglePlay, 
    currentTime, 
    duration, 
    seekTo 
  } = usePlayer();
  
  const [showSettings, setShowSettings] = useState(false);

  // Плеер виден только если есть аудио
  if (!currentAudioUrl) {
    return null;
  }

  // Вычисление прогресса в процентах
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  
  // Эффект нажатия
  const tapEffect = { scale: 0.95 };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed bottom-0 left-0 right-0 p-4 shadow-2xl bg-bg-glass backdrop-blur-md rounded-t-2xl z-50 border-t border-white/10"
      >
        <div className="max-w-lg mx-auto">
          {/* 1. Верхняя панель: Обложка/Визуализация и Настройки */}
          <div className="flex items-center justify-between mb-4">
             {/* Мини-визуализация (Иконка) */}
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center text-white text-xl">
                  {isPlaying ? '🎧' : '📚'}
               </div>
               <div>
                  <h3 className="text-white font-semibold leading-tight">Ваш текст</h3>
                  <p className="text-txt-secondary text-xs">Голос: {voice === 'default' ? 'Стандарт' : 'Профессионал'}</p>
               </div>
            </div>

            {/* Кнопка Настроек */}
            <motion.button
              onClick={() => setShowSettings(p => !p)}
              whileTap={tapEffect}
              className={`p-2 rounded-full transition-all ${
                showSettings ? 'bg-accent/20 text-accent' : 'text-txt-secondary hover:bg-white/10'
              }`}
            >
              <Settings size={20} />
            </motion.button>
          </div>

          {/* 2. Прогресс Бар */}
          <div className="relative mb-3">
             <input 
                type="range"
                min="0"
                max={duration}
                value={currentTime}
                onChange={(e) => seekTo(Number(e.target.value))}
                className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #8850FF ${progressPercent}%, #FFFFFF1A ${progressPercent}%)`
                }}
             />
             <div className="flex justify-between text-xs text-txt-secondary font-mono mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
             </div>
          </div>

          {/* 3. Органы управления */}
          <div className="flex justify-center items-center gap-6">
             {/* Назад на 10 сек */}
             <motion.button
                onClick={() => seekTo(currentTime - 10)}
                whileTap={tapEffect}
                className="text-txt-secondary hover:text-white transition"
             >
                <SkipBack size={24} fill="currentColor"/>
             </motion.button>

             {/* Play / Pause */}
             <motion.button
                onClick={togglePlay}
                whileTap={{ scale: 0.9 }}
                className="w-14 h-14 rounded-full bg-accent text-white flex items-center justify-center shadow-lg shadow-accent/50 hover:bg-accent-light transition"
             >
                {isPlaying ? <Pause size={28} fill="white" /> : <Play size={28} fill="white" className="ml-1" />}
             </motion.button>

             {/* Вперед на 10 сек */}
             <motion.button
                onClick={() => seekTo(currentTime + 10)}
                whileTap={tapEffect}
                className="text-txt-secondary hover:text-white transition"
             >
                <SkipForward size={24} fill="currentColor"/>
             </motion.button>
          </div>
          
          {/* 4. Настройки (Отображаются по кнопке) */}
          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-4 pt-4 border-t border-white/10 overflow-hidden"
              >
                <div className="space-y-4">
                  {/* Скорость */}
                  <label className="block">
                    <span className="text-sm font-medium text-txt-secondary flex justify-between">
                       Скорость чтения: <span className="text-white font-bold">1.0x</span>
                    </span>
                    <input type="range" min="0.5" max="2.0" step="0.1" defaultValue="1.0" 
                           className="mt-1 w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-accent" 
                           disabled // Логика скорости пока не реализована в PlayerContext
                    />
                  </label>
                  
                  {/* Громкость */}
                  <label className="block">
                    <span className="text-sm font-medium text-txt-secondary flex justify-between">
                       Громкость: <Volume2 size={16}/>
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
```eof

Мы успешно обновили все основные файлы Next.js приложения:

1.  `webapp/package.json`
2.  `webapp/tailwind.config.js`
3.  `webapp/styles/globals.css`
4.  `webapp/context/PlayerContext.js`
5.  `webapp/components/Layout.js`
6.  `webapp/pages/index.js`
7.  `webapp/components/Player.js`

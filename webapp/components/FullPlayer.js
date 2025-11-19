import { motion } from 'framer-motion';
import { usePlayer } from '../context/PlayerContext';

// Вспомогательная функция времени
const formatTime = (time) => {
  if (!time || isNaN(time)) return "0:00";
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export default function FullPlayer() {
  const { currentTrack, isPlaying, togglePlay, currentTime, duration, seek } = usePlayer();

  if (!currentTrack) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 p-10 text-center">
        <div className="w-20 h-20 bg-gray-800 rounded-full mb-4 animate-pulse"></div>
        <p>Выберите книгу из библиотеки, чтобы начать</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative h-full flex flex-col overflow-hidden"
    >
      {/* Фоновый градиент (Ambient Light) */}
      <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[60%] bg-brand-primary/20 blur-[100px] rounded-full pointer-events-none" />
      
      {/* Основной контент плеера (скроллируемый) */}
      <div className="flex-grow overflow-y-auto p-6 pb-40 no-scrollbar">
        
        {/* Обложка / Визуализация */}
        <div className="w-full aspect-square bg-gradient-to-br from-gray-800 to-black rounded-3xl shadow-2xl border border-white/10 mb-8 flex items-center justify-center relative overflow-hidden group">
           {/* Имитация обложки */}
           <div className="text-6xl">🎧</div>
           {/* Волна при проигрывании */}
           {isPlaying && (
             <div className="absolute inset-0 bg-brand-accent/10 animate-pulse-slow"></div>
           )}
        </div>

        {/* Информация о треке */}
        <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2 leading-tight tracking-tight">
              {currentTrack.title || "Без названия"}
            </h2>
            <p className="text-lg text-gray-400 font-medium">
              {currentTrack.author || "AI Voice"}
            </p>
        </div>

        {/* Текст (Karaoke Mode визуализация) */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/5">
           <p className="text-lg leading-relaxed text-gray-200 font-light">
             {currentTrack.textPreview}
             <span className="text-brand-accent/60">... (Полный текст читается)</span>
           </p>
        </div>
      </div>

      {/* Контроллеры (Фиксированные снизу) */}
      <div className="absolute bottom-24 left-0 right-0 px-6">
        {/* Слайдер */}
        <div className="mb-6">
          <input 
            type="range" 
            min="0" 
            max={duration || 0} 
            value={currentTime} 
            onChange={(e) => seek(Number(e.target.value))}
            className="w-full h-1.5 bg-gray-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-2 font-medium font-mono">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Кнопки управления */}
        <div className="flex items-center justify-between px-4">
           <button className="text-gray-400 hover:text-white transition">
             <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
           </button>

           <button className="text-white hover:scale-110 transition">
             <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/></svg>
           </button>

           {/* Главная кнопка Play */}
           <motion.button 
             onClick={togglePlay}
             whileTap={{ scale: 0.9 }}
             className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-black shadow-glow"
           >
             {isPlaying ? (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
             ) : (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="ml-1"><polygon points="5 3 19 12 5 21 5 3"/></svg>
             )}
           </motion.button>

           <button className="text-white hover:scale-110 transition">
             <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>
           </button>

           <button className="text-gray-400 hover:text-white transition">
              <span className="text-sm font-bold border border-gray-400 rounded px-1">1x</span>
           </button>
        </div>
      </div>
    </motion.div>
  );
}

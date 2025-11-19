import { motion } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Volume2, Settings2, ChevronDown } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

export default function FullPlayer({ onClose }) {
  const { currentTrack, isPlaying, togglePlay, progress, currentTime, duration, seek, changeSpeed, playbackRate } = usePlayer();

  const formatTime = (time) => {
    if (!time) return "0:00";
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  if (!currentTrack) return null;

  return (
    <motion.div 
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[100] bg-[#0B0F15] flex flex-col"
    >
      {/* 1. Неоновый Градиент Сверху */}
      <div 
        className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[150%] h-[50%] rounded-b-full pointer-events-none opacity-60"
        style={{
          background: 'radial-gradient(circle at center, #8A3CFF 0%, #3D2B89 40%, transparent 70%)',
          filter: 'blur(60px)'
        }}
      />

      {/* Header (Свернуть) */}
      <div className="relative z-10 flex justify-between items-center p-6">
         <button onClick={onClose} className="text-txt-secondary hover:text-white transition">
            <ChevronDown size={28} />
         </button>
         <span className="text-xs font-bold tracking-[0.2em] text-white/50 uppercase">Now Playing</span>
         <button className="text-txt-secondary hover:text-white transition">
            <Settings2 size={24} />
         </button>
      </div>

      {/* Content */}
      <div className="flex-grow flex flex-col items-center justify-center px-8 relative z-10">
         
         {/* Визуализация / Обложка */}
         <motion.div 
            animate={{ scale: isPlaying ? 1.05 : 1 }}
            transition={{ duration: 0.5 }}
            className="w-64 h-64 rounded-[40px] bg-gradient-to-br from-[#1a1a1c] to-black shadow-2xl border border-white/5 flex items-center justify-center mb-12 relative overflow-hidden"
         >
            {isPlaying ? (
               <div className="flex items-center gap-1.5">
                  {[...Array(5)].map((_, i) => (
                     <motion.div
                       key={i}
                       animate={{ height: ['20%', '80%', '20%'] }}
                       transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.1 }}
                       className="w-3 bg-accent rounded-full shadow-[0_0_15px_#8A3CFF]"
                     />
                  ))}
               </div>
            ) : (
               <div className="text-6xl opacity-20">📚</div>
            )}
         </motion.div>

         {/* Info */}
         <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white mb-2 leading-tight">{currentTrack.title}</h2>
            <p className="text-lg text-accent-light font-medium">{currentTrack.author}</p>
         </div>

         {/* Прогресс с подсветкой */}
         <div className="w-full mb-10 group">
            <input 
              type="range" 
              value={progress}
              onChange={(e) => seek(Number(e.target.value))}
              className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #8A3CFF ${progress}%, rgba(255,255,255,0.1) ${progress}%)`
              }}
            />
            <div className="flex justify-between text-xs text-txt-secondary mt-3 font-mono">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
         </div>

         {/* Controls */}
         <div className="flex items-center justify-between w-full max-w-xs">
            <button onClick={changeSpeed} className="text-xs font-bold text-txt-secondary border border-white/10 px-3 py-1 rounded-full hover:bg-white/10 transition">
               {playbackRate}x
            </button>

            <div className="flex items-center gap-6">
               <button onClick={() => seek(progress - 5)} className="text-white hover:opacity-70 transition"><SkipBack size={32} fill="currentColor"/></button>
               
               {/* БОЛЬШАЯ КНОПКА PLAY */}
               <motion.button
                 whileTap={{ scale: 0.9 }}
                 onClick={togglePlay}
                 className="w-20 h-20 rounded-full bg-white text-black flex items-center justify-center shadow-[0_0_30px_rgba(138,60,255,0.5)] hover:shadow-[0_0_50px_rgba(138,60,255,0.7)] transition-shadow"
               >
                 {isPlaying ? (
                    <Pause size={32} fill="black" />
                 ) : (
                    <Play size={32} fill="black" className="ml-1" />
                 )}
               </motion.button>

               <button onClick={() => seek(progress + 5)} className="text-white hover:opacity-70 transition"><SkipForward size={32} fill="currentColor"/></button>
            </div>

            <button className="text-txt-secondary hover:text-white transition"><Volume2 size={24}/></button>
         </div>
      </div>
    </motion.div>
  );
}

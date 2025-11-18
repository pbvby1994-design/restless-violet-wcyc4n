// Файл: webapp/pages/index.js (Applesque Style)

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import Player from '../components/Player';

// Динамический импорт Layout для корректной работы с Telegram SDK
const Layout = dynamic(() => import('../components/Layout'), { 
  ssr: false, 
  loading: () => (
    <div className="flex justify-center items-center h-screen text-lg text-gray-800 dark:text-gray-200 bg-white dark:bg-black">
        Инициализация WebApp...
    </div>
  )
});

const TTS_API_URL = '/api/tts/generate'; 

const Home = () => {
  const [text, setText] = useState('');
  const [currentAudio, setCurrentAudio] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false); 
  
  const MAX_CHARS = 5000;

  const togglePlay = useCallback(() => {
    if (currentAudio) {
      if (isPlaying) {
        currentAudio.pause();
      } else {
        currentAudio.play();
      }
      setIsPlaying(prev => !prev);
    }
  }, [currentAudio, isPlaying]);

  const handleTextToSpeech = useCallback(async () => {
    setError(null);

    if (text.trim().length < 5) {
      setError('Введите текст длиной не менее 5 символов.');
      return;
    }
    
    if (currentAudio) {
      currentAudio.pause();
      setCurrentAudio(null);
      setIsPlaying(false);
    }

    setLoading(true);

    try {
      const response = await fetch(TTS_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text: text,
          voice: 'default'
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ошибка API (${response.status}): ${errorText.substring(0, 100)}...`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onplay = () => setIsPlaying(true);
      audio.onpause = () => setIsPlaying(false);
      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
        setCurrentAudio(null);
      };
      
      setCurrentAudio(audio);
      audio.play();

    } catch (err) {
      console.error(err);
      setError(err.message || 'Не удалось сгенерировать голос. Проверьте соединение.');
    } finally {
      setLoading(false);
    }
  }, [text, currentAudio]);


  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-xl mx-auto min-h-[calc(100vh-2rem)] flex flex-col justify-between" 
      >
        <div className="flex-grow p-4">
          <h1 className="text-4xl font-bold mb-6 text-center text-gray-900 dark:text-white tracking-tight">
            🎙️ Голосовой Ассистент
          </h1>

          {/* Поле ввода - Clean Design */}
          <div className="relative mb-6">
            <textarea
              className="w-full h-48 p-5 pt-8 border border-gray-300 dark:border-zinc-700 rounded-3xl text-lg resize-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-zinc-800 dark:text-white transition-all shadow-lg focus:shadow-xl font-sans"
              placeholder="Введите текст для озвучивания..."
              value={text}
              onChange={(e) => {
                setText(e.target.value.substring(0, MAX_CHARS));
                setError(null);
              }}
            />
            {/* Счетчик символов - Тонкий шрифт */}
            <div className="absolute top-3 right-5 text-sm font-light text-gray-500 dark:text-gray-400">
                {text.length} / {MAX_CHARS}
            </div>
          </div>
          

          {/* Индикатор Ошибки - Плавное появление */}
          <AnimatePresence>
            {error && (
                <motion.div
                    initial={{ opacity: 0, scaleY: 0 }}
                    animate={{ opacity: 1, scaleY: 1 }}
                    exit={{ opacity: 0, scaleY: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{ originY: 0 }}
                    className="mt-3 p-4 bg-red-50 border border-red-300 text-red-700 rounded-xl dark:bg-red-900/50 dark:border-red-700 dark:text-red-200 font-medium overflow-hidden shadow-sm"
                >
                    {error}
                </motion.div>
            )}
          </AnimatePresence>

          {/* Кнопки действий - Крупные, чистые кнопки */}
          <div className="mt-8 flex flex-col space-y-4">
            <motion.button
              onClick={handleTextToSpeech}
              whileTap={{ scale: 0.98, backgroundColor: '#1d89ff' }} // Мягкое нажатие, как в iOS
              disabled={loading || text.length < 5}
              className={`w-full py-4 rounded-xl font-semibold text-xl transition-all tracking-wide ${
                loading 
                  ? 'bg-blue-400 dark:bg-blue-600 text-white cursor-not-allowed opacity-75'
                  : 'bg-blue-500 hover:bg-blue-600 text-white shadow-xl shadow-blue-500/50 dark:shadow-blue-700/50'
              }`}
            >
              {loading ? '🎤 Генерация...' : '🔊 Слушать Голосом'}
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.98 }}
              disabled={true} 
              className="w-full py-4 rounded-xl font-semibold text-xl transition-colors bg-gray-200 text-gray-600 dark:bg-zinc-700 dark:text-gray-400 cursor-not-allowed opacity-70 shadow-md"
            >
              📎 Загрузить Документ (WIP)
            </motion.button>
          </div>
        </div>
        
        {/* Компонент Плеера */}
        <Player
          isPlaying={isPlaying}
          togglePlay={togglePlay}
          currentAudio={currentAudio}
          loading={loading}
        />

      </motion.div>
    </Layout>
  );
};

export default Home;

// Файл: webapp/pages/index.js
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import Player from '../components/Player';

// Важно: Динамический импорт Layout для корректной работы с Telegram SDK на стороне клиента
const Layout = dynamic(() => import('../components/Layout'), { 
  ssr: false, 
  loading: () => (
    <div className="flex justify-center items-center h-screen text-lg bg-zinc-100 dark:bg-zinc-800">
        Инициализация WebApp...
    </div>
  )
});

// Путь API БЕЗ КОНЕЧНОГО СЛЭША (должен совпадать с vercel.json и index.py)
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
        // max-w-xl mx-auto: центрирование, flex flex-col justify-between: прибивает плеер вниз
        className="max-w-xl mx-auto min-h-[calc(100vh-2rem)] flex flex-col justify-between" 
      >
        <div className="flex-grow p-4">
          <h1 className="text-3xl font-bold mb-4 text-center text-gray-800 dark:text-white">
            🎙️ Голосовой Ассистент
          </h1>

          {/* Поле ввода */}
          <div className="relative mb-4">
            <textarea
              className="w-full h-40 p-4 pt-8 border-2 rounded-2xl text-lg resize-none focus:ring-blue-500 focus:border-blue-500 bg-zinc-100 dark:bg-zinc-700 dark:text-white transition-all shadow-lg focus:shadow-xl"
              placeholder="Введите текст для озвучивания..."
              value={text}
              onChange={(e) => {
                setText(e.target.value.substring(0, MAX_CHARS));
                setError(null);
              }}
            />
            {/* Счетчик символов */}
            <div className="absolute top-3 right-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                {text.length} / {MAX_CHARS}
            </div>
          </div>
          

          {/* Индикатор Ошибки */}
          <AnimatePresence>
            {error && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-3 p-3 bg-red-100 border border-red-400 text-red-700 rounded-xl dark:bg-red-900/50 dark:border-red-600 dark:text-red-300 font-medium overflow-hidden shadow-md"
                >
                    {error}
                </motion.div>
            )}
          </AnimatePresence>

          {/* Кнопки действий */}
          <div className="mt-6 flex flex-col space-y-4">
            <motion.button
              onClick={handleTextToSpeech}
              whileTap={{ scale: 0.95 }}
              disabled={loading || text.length < 5}
              className={`w-full py-3 rounded-2xl font-bold text-lg transition-all transform tracking-wider ${
                loading 
                  ? 'bg-blue-400 dark:bg-blue-600 text-white cursor-not-allowed opacity-75'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xl hover:shadow-2xl'
              }`}
            >
              {loading ? '🎤 Генерация...' : '🔊 Слушать Голосом'}
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              disabled={true} 
              className="w-full py-3 rounded-2xl font-bold text-lg transition-colors bg-green-200 text-green-700 dark:bg-green-700 dark:text-green-200 cursor-not-allowed opacity-70"
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

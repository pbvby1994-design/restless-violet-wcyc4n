// Файл: webapp/pages/index.js
import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic'; 

import Player from '../components/Player';

// 1. ДИНАМИЧЕСКИ ИМПОРТИРУЕМ Layout, ОТКЛЮЧАЯ SSR (важно для SDK Telegram)
const Layout = dynamic(() => import('../components/Layout'), { 
  ssr: false, 
  loading: () => (
    <div className="flex justify-center items-center h-screen text-lg bg-zinc-100 dark:bg-zinc-800">
        Инициализация WebApp...
    </div>
  )
});

// ✅ ИСПРАВЛЕНО: Путь к API без конечного слэша
const TTS_API_URL = '/api/tts/generate'; 

const Home = () => {
  const [text, setText] = useState('');
  const [currentAudio, setCurrentAudio] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedVoice, setSelectedVoice] = useState('default'); 

  const tapEffect = { scale: 0.95 };

  const handleTextToSpeech = useCallback(async () => {
    if (text.trim().length < 5) {
      setError('Введите текст длиной не менее 5 символов.');
      return;
    }
    
    if (currentAudio) {
      currentAudio.pause();
      setCurrentAudio(null);
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(TTS_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, voice: selectedVoice }),
      });

      if (!response.ok) {
        // Пробуем прочитать ошибку из тела ответа для лучшего сообщения
        const errorText = await response.text();
        throw new Error(`Ошибка API (${response.status}): ${errorText.substring(0, 100)}...`);
      }

      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      
      setCurrentAudio(audio);
      audio.play();

    } catch (err) {
      console.error(err);
      setError(`Не удалось сгенерировать аудио: ${err.message || 'Проверьте логи Vercel.'}`);
    } finally {
      setLoading(false);
    }
  }, [text, currentAudio, selectedVoice]);

  return (
    <Layout>
      <div className="max-w-md mx-auto p-4">
        {/* Заголовок */}
        <h1 className="text-2xl font-bold mb-6 text-zinc-900 dark:text-white">
          🎤 Текст в Речь Mini App
        </h1>

        {/* Поле для текста */}
        <textarea
          rows="8"
          className="w-full p-3 border rounded-xl focus:ring-blue-500 focus:border-blue-500 bg-zinc-100 dark:bg-zinc-700 dark:border-zinc-700 dark:text-white"
          placeholder="Вставьте текст..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        {/* Кнопки действий */}
        <div className="mt-4 flex flex-col space-y-3">
          <motion.button
            onClick={handleTextToSpeech}
            whileTap={tapEffect}
            disabled={loading}
            className={`w-full py-3 rounded-xl font-semibold text-lg transition-colors ${
              loading 
                ? 'bg-gray-400 dark:bg-gray-600 text-gray-200 cursor-not-allowed' 
                : 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg'
            }`}
          >
            {loading ? 'Генерация...' : '🔊 Слушать Голосом'}
          </motion.button>

          <motion.button
            whileTap={tapEffect}
            disabled={true} 
            className="w-full py-3 rounded-xl font-semibold text-lg transition-colors bg-green-200 text-green-700 dark:bg-green-700 dark:text-green-200 cursor-not-allowed opacity-70"
          >
            📎 Загрузить Документ (WIP)
          </motion.button>
        </div>
      </div>
      
      {/* Компонент Плеера */}
      <Player
        isPlaying={!!currentAudio && !currentAudio.paused}
        togglePlay={() => currentAudio?.paused ? currentAudio.play() : currentAudio?.pause()}
        currentAudio={currentAudio}
        loading={loading}
        error={error}
        voice={selectedVoice}
      />
    </Layout>
  );
};

export default Home;

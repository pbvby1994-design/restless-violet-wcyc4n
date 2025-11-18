// Файл: pages/index.js
import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
// Убедитесь, что пути импорта Layout и Player правильные для Codesandbox/Vercel
import Layout from '../components/Layout'; 
import Player from '../components/Player';

// !!! НОВЫЙ АДРЕС ДЛЯ VERCEL !!!
// API теперь находится на том же домене, что и фронтенд (restless-violet-wcy6cn.vercel.app),
// поэтому мы используем относительный путь. Vercel направит его в api/index.py.
const TTS_API_URL = '/api/tts/generate/'; 

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
    
    // Остановка предыдущего аудио
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
        // Отправляем текст и выбранный голос на Vercel API
        body: JSON.stringify({ text, voice: selectedVoice }),
      });

      if (response.status === 403) {
        throw new Error("Premium voices are not yet implemented.");
      }
      
      if (!response.ok) {
        // Ловим ошибки Vercel API (например, слишком длинный текст)
        const errorData = await response.json();
        throw new Error(`Ошибка API: ${errorData.detail || response.statusText}`);
      }
      
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      // Настройка обработчиков событий аудио
      audio.onended = () => setCurrentAudio(a => a ? {...a, paused: true} : null);
      audio.onplay = () => setCurrentAudio(a => a ? {...a, paused: false} : null);
      audio.onpause = () => setCurrentAudio(a => a ? {...a, paused: true} : null);
      
      await audio.play();
      
      setCurrentAudio(audio);
      
    } catch (err) {
      console.error("TTS Fetch Error:", err);
      setError(`Не удалось сгенерировать голос: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [text, currentAudio, selectedVoice]);

  const togglePlay = useCallback(() => {
    if (currentAudio) {
      if (currentAudio.paused) {
        currentAudio.play();
      } else {
        currentAudio.pause();
      }
    }
  }, [currentAudio]);


  return (
    <Layout>
      <div className="max-w-xl mx-auto pb-48"> 
        <motion.h1 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-3xl font-bold mb-6 text-center text-blue-600 dark:text-blue-400"
        >
          🗣️ Читатель Голосом
        </motion.h1>

        {/* Поле ввода текста */}
        <motion.textarea
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full p-4 h-48 border-2 border-gray-300 dark:border-zinc-700 rounded-xl resize-none focus:ring-blue-500 focus:border-blue-500 transition-shadow dark:bg-zinc-700 dark:text-white"
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
        isPlaying={!!currentAudio} 
        togglePlay={togglePlay} 
        currentAudio={currentAudio} 
        loading={loading}
        error={error}
        voice={selectedVoice}
        setVoice={setSelectedVoice}
      />
    </Layout>
  );
};

export default Home;


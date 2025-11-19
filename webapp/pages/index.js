// Файл: webapp/pages/index.js
import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { usePlayer } from '../context/PlayerContext'; // Импортируем хук плеера

// Динамический импорт Layout для избежания SSR ошибок с Telegram SDK
const Layout = dynamic(() => import('../components/Layout'), { 
  ssr: false, 
  loading: () => (
    <div className="flex justify-center items-center h-screen text-lg text-txt-primary bg-bg-default">
        Инициализация WebApp...
    </div>
  )
});

// Компонент Player будет переименован в PlayerControl и обновлен позже.
// Пока импортируем его как есть для сохранения структуры.
import PlayerControl from '../components/Player'; 

// !!! НОВЫЙ АДРЕС ДЛЯ VERCEL !!!
const TTS_API_URL = '/api/tts/generate/'; 

const Home = () => {
  const [text, setText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('default'); // Для будущего использования

  // 1. Используем контекст плеера
  const { 
    setAudioUrl, 
    setIsLoading, 
    setError, 
    isLoading, 
    error: playerError, // Ошибка плеера
    resetPlayer
  } = usePlayer();

  const tapEffect = { scale: 0.95 };

  // 2. Логика запроса генерации речи
  const handleTextToSpeech = useCallback(async () => {
    // 2.1. Валидация
    if (isLoading) return;

    const trimmedText = text.trim();
    if (trimmedText.length < 5) {
      setError('Введите текст длиной не менее 5 символов.');
      return;
    }
    setError(null);
    resetPlayer(); // Сбрасываем предыдущее аудио и ошибки

    // 2.2. Запуск загрузки и MainButton
    setIsLoading(true);
    const tg = window.Telegram.WebApp;
    if (tg.MainButton.isVisible) tg.MainButton.hide(); 
    tg.MainButton.setText('Генерация...').show().showProgress(true);

    try {
      const response = await fetch(TTS_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmedText, voice: selectedVoice }),
      });

      // Проверка на ошибки HTTP (например, 400 от FastAPI)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Неизвестная ошибка API' }));
        throw new Error(errorData.detail || `Ошибка: ${response.status}`);
      }

      // 2.3. Получаем Blob (бинарные данные MP3)
      const audioBlob = await response.blob();
      
      // 2.4. Создаем Blob URL для <audio> элемента
      const audioUrl = URL.createObjectURL(audioBlob);

      // 2.5. Передаем URL в контекст плеера, который запустит воспроизведение
      setAudioUrl(audioUrl);

      // 2.6. Очистка после успеха
      setText('');
      tg.HapticFeedback.notificationOccurred('success');

    } catch (e) {
      console.error('TTS Generation Error:', e);
      setError(`Ошибка генерации: ${e.message}`);
      tg.HapticFeedback.notificationOccurred('error');

    } finally {
      // 2.7. Остановка загрузки и MainButton
      setIsLoading(false);
      tg.MainButton.hideProgress();
      if (!tg.MainButton.isVisible) tg.MainButton.hide();
    }
  }, [text, selectedVoice, setIsLoading, setError, setAudioUrl, resetPlayer, isLoading]);

  // Объединяем ошибки для отображения
  const displayError = playerError || error;

  return (
    <Layout>
      <div className="pt-6 pb-20">
        <h1 className="text-3xl font-extrabold text-center mb-6 text-tg-text-primary">
          <span className="text-blue-500">TTS</span> Bot
        </h1>

        {/* Поле ввода текста */}
        <motion.textarea
          className="w-full p-4 rounded-xl border-2 shadow-inner min-h-40 resize-none 
                     bg-tg-secondary-bg text-tg-text-primary border-tg-hint-color/20 
                     focus:border-blue-500 transition duration-300 placeholder-tg-hint-color"
          placeholder="Вставьте текст, который нужно озвучить (до 5000 символов)..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={7}
        />

        {/* Кнопки действий */}
        <div className="mt-4 flex flex-col space-y-3">
          <motion.button
            onClick={handleTextToSpeech}
            whileTap={tapEffect}
            disabled={isLoading || text.trim().length < 5}
            className={`w-full py-3 rounded-xl font-semibold text-lg transition-colors ${
              isLoading || text.trim().length < 5
                ? 'bg-tg-hint-color/40 text-tg-hint-color cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/50'
            }`}
          >
            {isLoading ? 'Генерация...' : '🔊 Слушать Голосом'}
          </motion.button>

          {/* Кнопка сброса/очистки */}
          <motion.button
            onClick={() => {
              setText('');
              resetPlayer();
            }}
            whileTap={tapEffect}
            className="w-full py-3 rounded-xl font-semibold text-lg transition-colors bg-tg-secondary-bg text-tg-text-primary border border-tg-hint-color/20 hover:bg-tg-hint-color/10"
          >
            ❌ Очистить Ввод
          </motion.button>
        </div>

        {/* Сообщение об ошибке */}
        {displayError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 rounded-xl bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 border border-red-300 text-center"
          >
            {displayError}
          </motion.div>
        )}
      </div>
      
      {/* 3. Компонент Плеера - он будет брать все данные из контекста */}
      <PlayerControl voice={selectedVoice} /> 

    </Layout>
  );
};

export default Home;

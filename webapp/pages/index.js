// Файл: webapp/pages/index.js
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
// Используем алиасы для импортов
import { usePlayer } from '@/context/PlayerContext'; 
import PlayerControl from '@/components/Player'; 
import Library from '@/components/Library'; 

// Динамический импорт Layout для избежания SSR ошибок с Telegram SDK
const Layout = dynamic(() => import('@/components/Layout'), { 
  ssr: false, 
  loading: () => (
    <div className="flex justify-center items-center h-screen text-lg text-txt-primary bg-bg-default">
        Инициализация WebApp...
    </div>
  )
});

// Адрес для Vercel API
const TTS_API_URL = '/api/tts/generate'; 

const Home = () => {
  const [text, setText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('default'); 

  const { 
    setAudioUrl, 
    setIsLoading, 
    setError, 
    isLoading, 
    error: playerError, 
    resetPlayer
  } = usePlayer();

  // Удобный эффект нажатия для кнопок
  const tapEffect = { scale: 0.95 };

  // Ошибка для отображения: либо ошибка плеера, либо ошибка валидации текста
  const displayError = playerError || (text.length > 0 && text.length < 5 && !isLoading ? "Текст должен содержать не менее 5 символов." : null);

  /**
   * Запуск генерации речи через API.
   * @param {string} [textToGenerate] - Текст, который нужно сгенерировать. Если не передан, берется из состояния `text`.
   */
  const handleGenerateSpeech = async (textToGenerate) => {
    // Определяем, какой текст использовать
    const final_text = textToGenerate || text;

    if (isLoading || final_text.trim().length < 5) return;

    setIsLoading(true);
    setError(null);
    
    // 1. Сбрасываем плеер перед новой генерацией
    resetPlayer();

    try {
      const response = await fetch(TTS_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: final_text.trim(), voice: selectedVoice }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Ошибка API: ${response.status}`);
      }

      // 2. Получаем MP3-данные как Blob
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // 3. Передаем URL в контекст плеера для воспроизведения
      setAudioUrl(audioUrl);
      
      // 4. Очищаем поле ввода, если текст генерировался из поля
      if (!textToGenerate) {
         setText('');
      }

    } catch (e) {
      console.error('TTS Generation failed:', e);
      setError(e.message || 'Не удалось сгенерировать речь. Проверьте подключение.');
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Обработка нажатия на книгу из Library
   * @param {object} book - объект с данными книги.
   */
  const handleLibraryPlay = (book) => {
    // Устанавливаем текст книги в поле ввода и запускаем генерацию
    setText(book.text); 
    handleGenerateSpeech(book.text); 
  };


  return (
    <Layout>
      <div className="flex flex-col min-h-screen">
        <main className="flex-grow p-4 pt-4 mb-4">
          <h1 className="text-2xl font-bold text-txt-primary mb-6">Генератор речи и Библиотека</h1>
          
          {/* Контроль плеера всегда сверху, если есть аудио */}
          <PlayerControl voice={selectedVoice} />

          {/* Форма генерации */}
          <div className="card-glass mb-6 mt-4">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Введите текст для озвучивания (до 5000 символов)..."
              className="textarea-input h-32"
              maxLength={5000}
            />
            <div className="flex justify-between text-sm mt-2 text-txt-secondary">
              {/* Логика выбора голоса здесь не реализована, используем заглушку */}
              <span>Голос: По умолчанию (Russian)</span>
              <span>{text.length} / 5000</span>
            </div>
          </div>
          
          {/* Кнопки */}
          <div className="flex flex-col gap-4 mb-8">
            <motion.button
              onClick={() => handleGenerateSpeech(text)}
              disabled={isLoading || text.trim().length < 5}
              whileTap={text.trim().length >= 5 ? tapEffect : {}}
              className={`w-full py-3 rounded-xl font-semibold text-lg transition-colors ${
                isLoading || text.trim().length < 5
                  ? 'bg-accent-neon/40 text-txt-secondary cursor-not-allowed'
                  : 'bg-accent-neon hover:bg-accent-light text-white shadow-lg shadow-accent-neon/50'
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
              className="w-full py-3 rounded-xl font-semibold text-lg transition-colors bg-bg-card text-txt-primary border border-white/10 hover:bg-white/5"
            >
              ❌ Очистить Ввод
            </motion.button>
          </div>

          {/* Сообщение об ошибке */}
          <AnimatePresence>
            {displayError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-4 p-3 rounded-xl bg-red-900/50 text-red-300 border border-red-700/50"
              >
                Ошибка: {displayError}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Библиотека */}
          <Library onPlay={handleLibraryPlay} />
        </main>
      </div>
    </Layout>
  );
};

export default Home;

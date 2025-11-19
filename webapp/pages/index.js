// Файл: webapp/pages/index.js
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
// Используем алиасы для импортов, которые теперь разрешены через jsconfig.json
import { usePlayer } from '@/context/PlayerContext'; 
import PlayerControl from '@/components/Player'; 
import Library from '@/components/Library'; 

// Динамический импорт Layout. 
// Это необходимо для предотвращения ошибок SSR, так как Layout может содержать код, 
// зависимый от браузерного окружения (например, Telegram WebApp SDK).
const Layout = dynamic(() => import('@/components/Layout'), { 
  ssr: false, 
  loading: () => (
    // Загрузочный индикатор, который показывается, пока Layout загружается
    <div className="flex justify-center items-center h-screen text-lg text-white bg-[#0B0F15]">
        Инициализация WebApp...
    </div>
  )
});

// Адрес для API-маршрута генерации TTS
const TTS_API_URL = '/api/tts/generate'; 

const Home = () => {
  // Состояние для текста, который пользователь хочет озвучить
  const [text, setText] = useState('');
  // Состояние для выбранного голоса (сейчас просто заглушка)
  const [selectedVoice, setSelectedVoice] = useState('default'); 

  // Получаем состояние и функции из контекста плеера
  const { 
    setAudioUrl, 
    setIsLoading, 
    setError, 
    isLoading, 
    error: playerError, 
    resetPlayer
  } = usePlayer();

  // Эффект нажатия для кнопок (Framer Motion)
  const tapEffect = { scale: 0.95 };

  // Логика отображения ошибок: либо ошибка плеера, либо ошибка валидации ввода
  const displayError = playerError || (text.length > 0 && text.length < 5 && !isLoading ? "Текст должен содержать не менее 5 символов." : null);

  /**
   * Запуск генерации речи через API.
   * @param {string} [textToGenerate] - Текст, который нужно сгенерировать. Если не передан, берется из состояния `text`.
   */
  const handleGenerateSpeech = async (textToGenerate) => {
    // Определяем, какой текст использовать (из аргумента или из состояния)
    const final_text = textToGenerate || text;

    // Проверка, чтобы избежать повторных запросов или генерации слишком короткого текста
    if (isLoading || final_text.trim().length < 5) return;

    setIsLoading(true);
    setError(null);
    
    // 1. Сбрасываем плеер перед новой генерацией, чтобы остановить предыдущее воспроизведение
    resetPlayer();

    try {
      const response = await fetch(TTS_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Отправляем текст и выбранный голос на бэкенд
        body: JSON.stringify({ text: final_text.trim(), voice: selectedVoice }),
      });

      if (!response.ok) {
        // Если ответ неуспешен, считываем тело ответа для получения деталей ошибки
        const errorData = await response.json();
        throw new Error(errorData.detail || `Ошибка API: ${response.status}`);
      }

      // 2. Получаем аудио-данные (MP3) как Blob
      const audioBlob = await response.blob();
      // Создаем временный URL для Blob-объекта
      const audioUrl = URL.createObjectURL(audioBlob);

      // 3. Передаем URL в контекст плеера для воспроизведения
      setAudioUrl(audioUrl);
      
      // 4. Очищаем поле ввода, если текст генерировался из поля, а не из библиотеки
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
   * Обработка нажатия на элемент из Library, чтобы сразу начать воспроизведение
   * @param {object} book - объект с данными книги/фрагмента.
   */
  const handleLibraryPlay = (book) => {
    // Устанавливаем текст книги в поле ввода и запускаем генерацию
    setText(book.text); 
    handleGenerateSpeech(book.text); 
  };


  return (
    // Layout обеспечивает общую структуру и стили (например, Tailwind CSS классы)
    <Layout>
      <div className="flex flex-col min-h-screen bg-bg-default text-txt-primary">
        <main className="flex-grow p-4 pt-4 mb-4 max-w-lg mx-auto w-full">
          <h1 className="text-2xl font-bold text-txt-primary mb-6 text-center">Генератор речи и Библиотека</h1>
          
          {/* Контроль плеера (отображается только при наличии аудио URL) */}
          <PlayerControl voice={selectedVoice} />

          {/* Форма генерации */}
          <div className="card-glass mb-6 mt-4 p-4 rounded-xl shadow-xl border border-white/5">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Введите текст для озвучивания (до 5000 символов)..."
              className="w-full p-3 rounded-lg bg-white/5 text-txt-primary border border-transparent focus:border-accent-neon/50 focus:outline-none transition-all h-32 resize-none"
              maxLength={5000}
            />
            <div className="flex justify-between text-sm mt-2 text-txt-secondary">
              {/* Голос - заглушка */}
              <span className='font-medium'>Голос: По умолчанию (Russian)</span>
              <span className={text.length >= 5000 ? 'text-red-400' : ''}>{text.length} / 5000</span>
            </div>
          </div>
          
          {/* Кнопки действий */}
          <div className="flex flex-col gap-4 mb-8">
            <motion.button
              onClick={() => handleGenerateSpeech(text)}
              disabled={isLoading || text.trim().length < 5}
              whileTap={text.trim().length >= 5 ? tapEffect : {}}
              className={`w-full py-3 rounded-xl font-bold text-lg transition-colors ${
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

          {/* Сообщение об ошибке (с анимацией) */}
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

          {/* Секция библиотеки */}
          <Library onPlay={handleLibraryPlay} />
        </main>
      </div>
    </Layout>
  );
};

export default Home;

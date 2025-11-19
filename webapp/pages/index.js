// Файл: webapp/pages/index.js
import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
// Удаляем dynamic и Layout, так как они теперь в _app.js и работают только на клиенте
import { usePlayer } from '../context/PlayerContext'; // Импортируем хук плеера
import TabBar from '../components/TabBar';
import Library from '../components/Library';
import PlayerControl from '../components/Player'; 

// !!! АДРЕС ДЛЯ VERCEL !!!
const TTS_API_URL = '/api/tts/generate/'; 

const Home = () => {
  const [text, setText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('default'); // Для будущего использования голоса
  const [activeTab, setActiveTab] = useState('library'); // Состояние активной вкладки
  
  // 1. Используем контекст плеера
  // Благодаря динамическому импорту Layout в _app.js, этот хук вызывается безопасно на клиенте.
  const { 
    setAudioUrl, 
    setIsLoading, 
    setError, 
    isLoading, 
    error: playerError, // Ошибка плеера
    resetPlayer
  } = usePlayer();

  const [displayError, setDisplayError] = useState(null); // Локальная ошибка
  const isGenerating = isLoading; // Удобный алиас
  
  // Эффект нажатия для framer-motion
  const tapEffect = { scale: 0.95 };

  /**
   * Основная функция для отправки запроса на генерацию аудио.
   */
  const handleGenerate = useCallback(async () => {
    if (isGenerating || text.trim().length < 5) return;
    
    // 0. Очистка перед началом
    setIsLoading(true);
    setDisplayError(null);
    setError(null);
    resetPlayer(); // Сбрасываем старый плеер
    
    try {
      const response = await fetch(TTS_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // В продакшене Vercel CORS уже не будет проблемой
        },
        body: JSON.stringify({ 
          text: text, 
          voice: selectedVoice 
        }),
      });

      if (!response.ok) {
        // Чтение детального сообщения об ошибке из API
        const errorData = await response.json().catch(() => ({ detail: 'Unknown API Error' }));
        throw new Error(errorData.detail || `HTTP error! Status: ${response.status}`);
      }

      // Ответ - это Audio/MP3 Stream
      // Создаем Blob URL для воспроизведения
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      setAudioUrl(audioUrl); // Устанавливаем URL и запускаем воспроизведение
      setActiveTab('player'); // Переключаемся на вкладку плеера

    } catch (e) {
      console.error("Generation Error:", e);
      setDisplayError(e.message || 'Ошибка генерации аудио. Попробуйте снова.');
      setError(e.message || 'Ошибка генерации');
    } finally {
      setIsLoading(false);
    }
  }, [text, selectedVoice, isGenerating, setAudioUrl, setIsLoading, setError, resetPlayer]);

  // Функция для обработки клика по элементу библиотеки
  const handleLibraryPlay = useCallback((book) => {
    setText(book.text); // Устанавливаем текст книги
    setActiveTab('player'); // Переключаемся на вкладку плеера
    // Опционально: можно автоматически запустить handleGenerate(book.text)
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'library':
        return <Library onPlay={handleLibraryPlay} />;
      case 'player':
        return (
          <div className="space-y-6">
            <h1 className="text-xl font-bold text-txt-primary">Генерация Аудио</h1>
            
            {/* 2. Text Area Input */}
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Введите текст для озвучивания (мин. 5 символов)..."
              className="textarea-input h-32"
            />
            
            {/* 3. Player Control (отображается только при наличии аудио) */}
            <PlayerControl />
            
            {/* 4. Action Buttons */}
            <div className="space-y-3 pt-4">
              {/* Кнопка генерации/слушать */}
              <motion.button
                onClick={handleGenerate}
                disabled={isGenerating || text.trim().length < 5}
                whileTap={tapEffect}
                className={`w-full py-3 rounded-xl font-semibold text-lg transition-colors ${
                  isGenerating || text.trim().length < 5
                    ? 'bg-tg-hint-color/40 text-tg-hint-color cursor-not-allowed'
                    : 'bg-accent hover:bg-accent-light text-white shadow-lg shadow-accent/50'
                }`}
              >
                {isGenerating ? 'Генерация...' : '🔊 Слушать Голосом'}
              </motion.button>

              {/* Кнопка сброса/очистки */}
              <motion.button
                onClick={() => {
                  setText('');
                  resetPlayer();
                }}
                whileTap={tapEffect}
                className="w-full py-3 rounded-xl font-semibold text-lg transition-colors bg-bg-glass text-txt-primary border border-txt-muted/20 hover:bg-white/10"
              >
                ❌ Очистить Ввод
              </motion.button>
            </div>

            {/* Сообщение об ошибке */}
            {(displayError || playerError) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 rounded-xl bg-red-900/50 text-red-300 border border-red-800"
              >
                <p className="font-semibold">Ошибка!</p>
                <p className="text-sm">{displayError || playerError}</p>
              </motion.div>
            )}
            
          </div>
        );
      case 'settings':
        return (
          <div className="p-4 card-glass min-h-[50vh]">
             <h1 className="text-xl font-bold text-txt-primary mb-4">Настройки и Профиль</h1>
             <p className="text-txt-secondary">
               Здесь будут расположены настройки голоса, качества и информация о пользователе.
             </p>
             <div className="mt-8 space-y-4">
               <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                 <p className="text-txt-primary font-semibold">Голос:</p>
                 <p className="text-txt-secondary">Русский (по умолчанию)</p>
               </div>
               <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                 <p className="text-txt-primary font-semibold">Лимит текста:</p>
                 <p className="text-txt-secondary">5000 символов (ограничение бесплатного API)</p>
               </div>
             </div>
          </div>
        );
      default:
        // Если вкладка не распознана, по умолчанию показываем Библиотеку
        return <Library onPlay={handleLibraryPlay} />;
    }
  };

  return (
    <div className="p-4 pt-8">
      {renderContent()}
      
      {/* TabBar всегда внизу */}
      <TabBar activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export default Home;

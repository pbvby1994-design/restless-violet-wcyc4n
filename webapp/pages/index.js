import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { usePlayer } from '../context/PlayerContext';
import { Volume2, Loader2 } from 'lucide-react';

// === Динамические Импорты Компонентов ===
// Layout - Главная обертка с инициализацией SDK
const Layout = dynamic(() => import('../components/Layout'), { 
  ssr: false, 
  loading: () => (
    <div className="flex justify-center items-center h-screen text-lg text-txt-primary bg-bg-default">
        Инициализация WebApp...
    </div>
  )
});

// Навигация и Плееры (импортируем синхронно, они не зависят от SDK напрямую)
import TabBar from '../components/TabBar';
import MiniPlayer from '../components/MiniPlayer';
import FullPlayer from '../components/FullPlayer'; 
import Library from '../components/Library';
// Settings - заглушка, если его нет, создайте пустой файл webapp/components/Settings.js
const Settings = () => (
  <div className="p-6 text-center text-txt-secondary">
    <h1 className="text-2xl font-bold text-white mb-4">Настройки</h1>
    <p>Настройки находятся в разработке. Скоро здесь появится управление голосами и профилем.</p>
  </div>
);


// === Компонент Главного Экрана TTS ===
const HomeContent = ({ text, setText, generateSpeech, isLoading, displayError, resetPlayer }) => {
  
  const isInputValid = text.trim().length >= 5 && text.trim().length <= 5000;
  const tapEffect = { scale: 0.95 };

  return (
    <div className="p-4 max-w-md mx-auto pt-6">
      
      {/* Заголовок */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5 }}
        className="mb-6 text-center"
      >
        <h1 className="text-3xl font-extrabold text-white mb-2">Генерация Аудио</h1>
        <p className="text-txt-secondary text-sm">Вставьте текст для преобразования в речь.</p>
      </motion.div>

      {/* Ввод текста */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }} 
        animate={{ opacity: 1, x: 0 }} 
        transition={{ duration: 0.5, delay: 0.1 }}
        className="card-glass p-0 mb-6"
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Введите текст для озвучивания (минимум 5 символов)..."
          rows={10}
          maxLength={5000}
          className="textarea-input h-48 border-none focus:ring-0 focus:border-0 rounded-xl"
        />
        <div className="p-3 pt-0 text-right text-xs text-txt-muted">
          Символов: {text.length} / 5000
        </div>
      </motion.div>

      {/* Выбор голоса (заглушка) */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }} 
        animate={{ opacity: 1, x: 0 }} 
        transition={{ duration: 0.5, delay: 0.2 }}
        className="card-glass mb-6 flex items-center justify-between"
      >
        <div className="flex items-center space-x-3">
          <Volume2 className="text-accent-neon" size={24} />
          <p className="font-medium text-white">Голос (Пока один)</p>
        </div>
        <p className="text-txt-secondary">Русский, Женский</p>
      </motion.div>

      {/* Кнопки действий */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5, delay: 0.3 }}
        className="space-y-4 mb-20"
      >
        {/* Кнопка генерации */}
        <motion.button
          onClick={generateSpeech}
          whileTap={isInputValid && !isLoading ? tapEffect : {}}
          disabled={!isInputValid || isLoading}
          className={`w-full py-3 rounded-xl font-semibold text-lg transition-colors flex items-center justify-center space-x-2 ${
            !isInputValid || isLoading
              ? 'bg-txt-muted/30 text-txt-secondary cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/50'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              <span>Генерация...</span>
            </>
          ) : (
            '🔊 Слушать Голосом'
          )}
        </motion.button>

        {/* Кнопка сброса/очистки */}
        <motion.button
          onClick={() => {
            setText('');
            resetPlayer();
          }}
          whileTap={tapEffect}
          className="w-full py-3 rounded-xl font-semibold text-lg transition-colors bg-white/5 text-white/80 border border-white/10 hover:bg-white/10"
        >
          ❌ Очистить Ввод
        </motion.button>
      </motion.div>

      {/* Сообщение об ошибке */}
      <AnimatePresence>
        {displayError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed bottom-32 left-1/2 transform -translate-x-1/2 p-3 rounded-xl bg-red-800 text-white shadow-lg z-50 max-w-xs text-center"
          >
            <p className="font-semibold">Ошибка!</p>
            <p className="text-sm">{displayError}</p>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};


// === ГЛАВНЫЙ КОМПОНЕНТ ПРИЛОЖЕНИЯ ===
const Home = () => {
  // Состояние ввода текста
  const [text, setText] = useState('');
  
  // Состояние навигации
  const [activeTab, setActiveTab] = useState('tts'); // 'tts' (Home), 'library', 'settings'
  const [showFullPlayer, setShowFullPlayer] = useState(false); // Видимость полноэкранного плеера

  // 1. Используем контекст плеера
  const { 
    setAudioUrl, 
    setIsLoading: setPlayerLoading, 
    setError: setPlayerError, 
    isLoading: isPlayerLoading, 
    currentTrack,
    error: playerError, 
    resetPlayer
  } = usePlayer();

  // Объединяем состояния загрузки и ошибок
  const [isApiLoading, setIsApiLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  const isLoading = isPlayerLoading || isApiLoading;
  const displayError = playerError || apiError;
  
  // Сбрасываем ошибку API, когда текст меняется
  const handleTextChange = (newText) => {
    setText(newText);
    if (apiError) setApiError(null);
  }

  // API Endpoint (должен быть в корне Next.js app)
  // Используем адрес, который вы настроили в vercel.json
  const TTS_API_URL = '/api/tts/generate'; 

  /**
   * Асинхронная функция для вызова TTS API
   */
  const generateSpeech = useCallback(async () => {
    if (text.trim().length < 5 || isLoading) return;

    // Сброс и установка состояний
    resetPlayer();
    setApiError(null);
    setIsApiLoading(true);
    setPlayerLoading(true);

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
        // Попытка прочитать детальное сообщение об ошибке
        const errorText = await response.text();
        let errorMessage = `Ошибка API: ${response.status} ${response.statusText}`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.detail || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      // 1. Получаем Blob-данные (MP3)
      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);
      
      // 2. Устанавливаем данные в контекст плеера
      setAudioUrl({ 
          url: audioUrl,
          title: text.length > 50 ? text.substring(0, 50) + '...' : text, // Укорачиваем заголовок
          author: 'Сгенерировано' 
      });

      // 3. Переключаем на вкладку с плеером, если это не текущий экран (чтобы активировать FullPlayer)
      // setActiveTab('player'); // Это не нужно, так как центральная кнопка будет вести в FullPlayer

    } catch (e) {
      console.error("Generation Error:", e);
      setApiError(e.message || 'Произошла неизвестная ошибка при генерации.');
      setPlayerError(e.message || 'Произошла неизвестная ошибка при генерации.');
      setPlayerLoading(false); 
    } finally {
      setIsApiLoading(false);
    }
  }, [text, isLoading, resetPlayer, setAudioUrl, setPlayerLoading, setPlayerError]);

  
  // === РЕНДЕРИНГ КОНТЕНТА ВКЛАДОК ===
  const renderContent = useMemo(() => {
    switch (activeTab) {
      case 'library':
        // onPlay - функция для запуска трека из библиотеки
        const handleLibraryPlay = (book) => {
          // Имитация запуска трека из библиотеки
          resetPlayer();
          setAudioUrl({ 
              // TODO: Заменить на реальный API вызов для получения MP3
              url: 'https://example.com/placeholder.mp3', 
              title: book.title, 
              author: book.author 
          });
          setActiveTab('tts'); // Возвращаем на главный экран (Home)
        };
        return <Library onPlay={handleLibraryPlay} />;
      case 'settings':
        return <Settings />; 
      case 'tts':
      default:
        return (
          <HomeContent 
            text={text}
            setText={handleTextChange}
            generateSpeech={generateSpeech}
            isLoading={isLoading}
            displayError={displayError}
            resetPlayer={resetPlayer}
          />
        );
    }
  }, [activeTab, text, generateSpeech, isLoading, displayError, resetPlayer]);


  return (
    <Layout>
      {/* Основной контент (Вкладка) */}
      {/* Добавляем отступ снизу, чтобы контент не перекрывался TabBar и MiniPlayer */}
      <div className="min-h-screen pt-4 pb-40">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab} // Ключ для анимации переключения вкладок
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent}
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Мини-плеер (появляется, когда есть трек) */}
      {currentTrack && <MiniPlayer onOpenFullPlayer={() => setShowFullPlayer(true)} />}

      {/* Tab Bar (навигация) */}
      <TabBar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onOpenFullPlayer={() => setShowFullPlayer(true)} 
      />

      {/* Полноэкранный плеер (Модальное окно) */}
      <FullPlayer 
        isOpen={showFullPlayer} 
        onClose={() => setShowFullPlayer(false)} 
      />
    </Layout>
  );
};

export default Home;
```eof

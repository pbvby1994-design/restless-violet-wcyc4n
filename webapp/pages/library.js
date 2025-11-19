// Файл: webapp/pages/library.js
import { useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { usePlayer } from '../context/PlayerContext';

// Динамический импорт Layout для избежания SSR ошибок с Telegram SDK
const Layout = dynamic(() => import('../components/Layout'), { 
  ssr: false, 
  loading: () => (
    <div className="flex justify-center items-center h-screen text-lg text-txt-primary bg-bg-default">
        Инициализация WebApp...
    </div>
  )
});

// Импортируем компонент библиотеки
import LibraryComponent from '../components/Library'; 
import PlayerControl from '../components/Player';

export default function LibraryPage() {
    const router = useRouter();
    const { setAudioUrl, setError } = usePlayer();
    
    // Функция для воспроизведения аудио из библиотеки
    const handlePlayBook = useCallback((book) => {
        try {
            // Аудиофайлы в библиотеке должны хранить URL
            if (book.audioUrl) {
                setAudioUrl(book.audioUrl);
            } else {
                setError("Аудиофайл не найден в записи.");
            }
        } catch (e) {
            console.error("Failed to play book:", e);
            setError("Не удалось начать воспроизведение.");
        }
    }, [setAudioUrl, setError]);
    
    // Эффект нажатия
    const tapEffect = { scale: 0.95 };

    return (
        <Layout>
            {/* Кнопка "Назад" - переход на Главную */}
            <motion.button
                onClick={() => router.push('/')}
                whileTap={tapEffect}
                className="fixed top-4 left-4 z-50 p-2 rounded-full bg-bg-card text-txt-primary hover:bg-white/10 transition shadow-lg"
            >
                &larr; На Главную
            </motion.button>
            
            <LibraryComponent onPlay={handlePlayBook} />
            
            {/* Плеер всегда отображается внизу */}
            <PlayerControl voice="Library" />
            <div className="h-20" /> {/* Отступ для плеера */}
        </Layout>
    );
}

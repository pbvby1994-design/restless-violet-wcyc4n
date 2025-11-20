// Файл: webapp/pages/library.js (ФИНАЛЬНОЕ ИСПРАВЛЕНИЕ)

import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { motion } from "framer-motion";

// 🛑 УБРАТЬ: import { usePlayer } from '../context/PlayerContext'; 
// 🛑 УБРАТЬ: import LibraryComponent from '../components/Library'; 
// 🛑 УБРАТЬ: import PlayerControl from '../components/Player';

// 1. Динамический импорт Layout (из-за TWA SDK)
const Layout = dynamic(() => import('../components/Layout'), { 
  ssr: false, 
  loading: () => (
    <div className="flex justify-center items-center h-screen text-lg text-txt-primary bg-bg-default">
        Инициализация WebApp...
    </div>
  )
});

// =========================================================================
// ✅ 2. НОВЫЙ КОМПОНЕНТ-ОБЕРТКА
// Он инкапсулирует всю клиентскую логику (usePlayer, LibraryComponent, PlayerControl)
// и гарантирует, что она не будет выполнена на сервере.
const ClientLibraryWrapper = dynamic(
    async () => {
        // Импортируем все клиентские зависимости внутри dynamic()
        const { usePlayer } = await import('../context/PlayerContext');
        const LibraryComponent = await import('../components/Library');
        const PlayerControl = await import('../components/Player');
        
        // Возвращаем основной компонент страницы
        const LibraryContent = () => {
            const { setAudioUrl, setError } = usePlayer();
            const tapEffect = { scale: 0.95 };

            // Функция для воспроизведения аудио из библиотеки
            const handlePlayBook = (book) => {
                try {
                    if (book.audioUrl) {
                        setAudioUrl(book.audioUrl);
                    } else {
                        setError("Аудиофайл не найден в записи.");
                    }
                } catch (e) {
                    console.error("Failed to play book:", e);
                    setError("Не удалось начать воспроизведение.");
                }
            };

            return (
                <>
                    {/* LibraryComponent загружается и использует Firebase только на клиенте */}
                    <LibraryComponent.default onPlay={handlePlayBook} />
                    
                    {/* PlayerControl загружается и использует Audio API только на клиенте */}
                    <PlayerControl.default voice="Library" />
                    <div className="h-20" /> {/* Отступ для плеера */}
                </>
            );
        };
        return LibraryContent;
    },
    {
        ssr: false, // <-- КЛЮЧ: Отключаем Server-Side Rendering для всей логики
        loading: () => <div className="p-4 text-center text-txt-secondary">Загрузка контента библиотеки...</div>
    }
);
// =========================================================================


// LibraryPage теперь просто загружает динамический Layout и ClientLibraryWrapper
export default function LibraryPage() {
    const router = useRouter();
    const tapEffect = { scale: 0.95 };

    return (
        <Layout>
            {/* Кнопка "Назад" - не зависит от window, поэтому остается здесь */}
            <motion.button
                onClick={() => router.push('/')}
                whileTap={tapEffect}
                className="fixed top-4 left-4 z-50 p-2 rounded-full bg-bg-card text-txt-primary hover:bg-white/10 transition shadow-lg"
            >
                &larr; На Главную
            </motion.button>
            
            {/* Вся клиентская логика загружается здесь */}
            <ClientLibraryWrapper />
        </Layout>
    );
}

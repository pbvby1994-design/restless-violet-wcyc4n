// Файл: webapp/pages/library.js (Максимальная защита от SSR)
"use client";
import dynamic from 'next/dynamic'; // ✅ Только dynamic импортируется статически
import { useRouter } from 'next/router';

// Динамический импорт всех клиентских компонентов и хуков

// 1. Динамический импорт usePlayer и useCallback из React.
// Нам нужно создать заглушку для всего, что мы используем из React/контекста
// для предотвращения сбоя импорта на сервере.
const ClientContent = dynamic(() => import('react').then(mod => ({
    // Получаем useCallback из React
    useCallback: mod.useCallback,
    // Получаем usePlayer из контекста (который уже динамический в _app.js)
    usePlayer: require('../context/PlayerContext').usePlayer,
    // Получаем motion для кнопки
    motion: require('framer-motion').motion,
})), {
    ssr: false, // Ключевое отключение SSR
});


// 2. Динамический импорт Layout
const Layout = dynamic(() => import('../components/Layout'), { 
  ssr: false, 
  loading: () => (
    <div className="flex justify-center items-center h-screen text-lg text-txt-primary bg-bg-default">
        Инициализация WebApp...
    </div>
  )
});

// 3. Динамический импорт LibraryComponent (Из-за Firebase)
const LibraryComponent = dynamic(() => import('../components/Library'), {
    ssr: false,
    loading: () => <div className="p-4 text-center text-txt-secondary">Загрузка библиотеки...</div>
});

// 4. Динамический импорт PlayerControl (Из-за Audio API)
const PlayerControl = dynamic(() => import('../components/Player'), {
    ssr: false,
    loading: () => null
});


// Главный компонент страницы
export default function LibraryPage() {
    const router = useRouter();
    
    // Используем динамически загруженные хуки и компоненты внутри компонента
    return (
        <Layout>
            <ClientContent>
                {({ useCallback, usePlayer, motion }) => {
                    // Хуки и логика, которые должны быть доступны только на клиенте
                    const { setAudioUrl, setError } = usePlayer();
    
                    const handlePlayBook = useCallback((book) => {
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
                    }, [setAudioUrl, setError]);
    
                    const tapEffect = { scale: 0.95 };

                    return (
                        <>
                            {/* Кнопка "Назад" с motion.button */}
                            <motion.button
                                onClick={() => router.push('/')}
                                whileTap={tapEffect}
                                className="fixed top-4 left-4 z-50 p-2 rounded-full bg-bg-card text-txt-primary hover:bg-white/10 transition shadow-lg"
                            >
                                &larr; На Главную
                            </motion.button>
                            
                            {/* Рендер динамически загруженных компонентов */}
                            <LibraryComponent onPlay={handlePlayBook} />
                            <PlayerControl voice="Library" />
                            <div className="h-20" /> 
                        </>
                    );
                }}
            </ClientContent>
        </Layout>
    );
}

// ЭКСПЕРИМЕНТАЛЬНЫЙ ФОРМАТ: Если предыдущий код не сработает, попробуйте эту форму:
/*
export default function LibraryPageWrapper() {
    // Вся страница теперь полностью клиентская
    const DynamicPage = dynamic(() => import('./library'), { ssr: false });
    return <DynamicPage />;
}
*/

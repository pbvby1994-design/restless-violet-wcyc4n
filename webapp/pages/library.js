// Файл: webapp/pages/library.js (Чистая и правильная версия)

import { useCallback } from 'react';
import dynamic from 'next/dynamic'; // ✅ Ключевой импорт
import { useRouter } from 'next/router';
// ✅ Статический импорт usePlayer в порядке, т.к. Layout (родитель) сделан dynamic
import { usePlayer } from '../context/PlayerContext'; 
import { motion } from "framer-motion";


// 1. Динамический импорт Layout (из-за TWA SDK)
const Layout = dynamic(() => import('../components/Layout'), { 
  ssr: false, 
  loading: () => (
    <div className="flex justify-center items-center h-screen text-lg text-txt-primary bg-bg-default">
        Инициализация WebApp...
    </div>
  )
});

// ✅ 2. Динамический импорт LibraryComponent (Из-за Firebase)
const LibraryComponent = dynamic(() => import('../components/Library'), {
    ssr: false, // Отключаем SSR
    loading: () => <div className="p-4 text-center text-txt-secondary">Загрузка библиотеки...</div>
});

// ✅ 3. Динамический импорт PlayerControl (Из-за Audio Player Context)
const PlayerControl = dynamic(() => import('../components/Player'), {
    ssr: false, // Отключаем SSR
    loading: () => null
});


export default function LibraryPage() {
    // usePlayer() здесь безопасен, если его Provider (PlayerProvider) также динамический.
    const router = useRouter();
    const { setAudioUrl, setError } = usePlayer();
    
    // Функция для воспроизведения аудио из библиотеки
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
        <Layout>
            <motion.button
                onClick={() => router.push('/')}
                whileTap={tapEffect}
                className="fixed top-4 left-4 z-50 p-2 rounded-full bg-bg-card text-txt-primary hover:bg-white/10 transition shadow-lg"
            >
                &larr; На Главную
            </motion.button>
            
            {/* Рендер компонентов (Next.js автоматически берет .default) */}
            <LibraryComponent onPlay={handlePlayBook} />
            
            <PlayerControl voice="Library" />
            <div className="h-20" /> 
        </Layout>
    );
}

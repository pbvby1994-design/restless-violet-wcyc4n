// Файл: webapp/pages/library.js

import { useCallback } from 'react';
// ✅ КЛЮЧЕВОЙ ШАГ: Импортируем dynamic для клиентской загрузки
import dynamic from 'next/dynamic'; 
import { useRouter } from 'next/router';
import { usePlayer } from '../context/PlayerContext';
import { motion } from "framer-motion";

// 🛑 УДАЛИТЬ СТАТИЧЕСКИЕ ИМПОРТЫ LibraryComponent и PlayerControl,
// если они были вставлены автоматически или вручную.

// 1. Динамический импорт Layout (из-за TWA SDK)
const Layout = dynamic(() => import('../components/Layout'), { 
  ssr: false, 
  loading: () => (
    <div className="flex justify-center items-center h-screen text-lg text-txt-primary bg-bg-default">
        Инициализация WebApp...
    </div>
  )
});

// ✅ 2. Динамический импорт LibraryComponent
// (Содержит логику Firebase, которая падает на сервере)
const LibraryComponent = dynamic(() => import('../components/Library'), {
    ssr: false, // <-- Отключаем SSR
    loading: () => <div className="p-4 text-center text-txt-secondary">Загрузка библиотеки...</div>
});

// ✅ 3. Динамический импорт PlayerControl
// (Использует usePlayer, который управляет Audio API)
const PlayerControl = dynamic(() => import('../components/Player'), {
    ssr: false, // <-- Отключаем SSR
    loading: () => null
});


export default function LibraryPage() {
    const router = useRouter();
    // usePlayer() в порядке, так как он использует PlayerContext, 
    // который сам по себе динамически импортирован в _app.js.
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
            
            {/* Компоненты, которые теперь загружаются только на клиенте */}
            <LibraryComponent onPlay={handlePlayBook} />
            
            <PlayerControl voice="Library" />
            <div className="h-20" /> {/* Отступ для плеера */}
        </Layout>
    );
}

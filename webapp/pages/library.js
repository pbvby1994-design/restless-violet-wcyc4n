// Файл: webapp/pages/library.js

import { useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { usePlayer } from '../context/PlayerContext';
import { motion } from "framer-motion";

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

// ✅ 2. Динамический импорт LibraryComponent (Из-за Firebase)
const LibraryComponent = dynamic(() => import('../components/Library'), {
    ssr: false, // <-- КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ: Отключаем SSR
    loading: () => <div className="p-4 text-center text-txt-secondary">Загрузка библиотеки...</div>
});

// ✅ 3. Динамический импорт PlayerControl (Из-за Audio Player Context)
const PlayerControl = dynamic(() => import('../components/Player'), {
    ssr: false, // <-- КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ: Отключаем SSR
    loading: () => null
});


export default function LibraryPage() {
    const router = useRouter();
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
        <Layout>
            <motion.button
                onClick={() => router.push('/')}
                whileTap={tapEffect}
                className="fixed top-4 left-4 z-50 p-2 rounded-full bg-bg-card text-txt-primary hover:bg-white/10 transition shadow-lg"
            >
                &larr; На Главную
            </motion.button>
            
            {/* Теперь LibraryComponent будет загружен только на клиенте */}
            <LibraryComponent onPlay={handlePlayBook} />
            
            {/* PlayerControl также загрузится только на клиенте */}
            <PlayerControl voice="Library" />
            <div className="h-20" /> 
        </Layout>
    );
}

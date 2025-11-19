import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { usePlayer } from '../context/PlayerContext';
import { BookOpen, Save, Trash2 } from 'lucide-react';

// === FIREBASE ИМПОРТЫ ===
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, addDoc, serverTimestamp, query, orderBy, onSnapshot } from 'firebase/firestore';

// === КОМПОНЕНТЫ ===
const Layout = dynamic(() => import('../components/Layout'), { ssr: false });
import PlayerControl from '../components/Player';
import TabBar from '../components/TabBar';
import Library from '../components/Library';

// !!! API АДРЕС ДЛЯ VERCEL !!!
const TTS_API_URL = '/api/tts/generate';

// Список доступных голосов (Для UI)
const VOICE_OPTIONS = [
    { value: 'Kore', label: 'Kore (Спокойный, женский)' },
    { value: 'Puck', label: 'Puck (Бодрый, мужской)' },
    { value: 'Charon', label: 'Charon (Информативный, мужской)' },
    { value: 'Zephyr', label: 'Zephyr (Яркий, женский)' },
];

/**
 * Основной компонент главной страницы
 */
const Home = () => {
    // --- Состояние приложения ---
    const [text, setText] = useState('');
    const [selectedVoice, setSelectedVoice] = useState(VOICE_OPTIONS[0].value);
    const [activeTab, setActiveTab] = useState('create'); // 'create' (Генерация) | 'library' (Библиотека)
    
    // --- Состояние Firebase ---
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [userId, setUserId] = useState(null);
    const [appId, setAppId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [saveStatus, setSaveStatus] = useState(null); // 'saving', 'success', 'error'

    // --- Состояние плеера из контекста ---
    const { 
        setAudioUrl, 
        setIsLoading, 
        setError, 
        isLoading, 
        error: playerError,
        resetPlayer,
        currentAudioUrl, // Нужен для сохранения
        duration // Нужен для сохранения
    } = usePlayer();

    // Комбинированная ошибка для отображения
    const displayError = playerError;
    
    // Эффект нажатия для кнопок
    const tapEffect = { scale: 0.95 };

    // --- 1. ИНИЦИАЛИЗАЦИЯ FIREBASE и АУТЕНТИФИКАЦИЯ ---
    useEffect(() => {
        let isMounted = true;
        
        const initFirebase = async () => {
            try {
                // Глобальные переменные Canvas
                const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;
                const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
                const currentAppId = typeof __app_id !== 'undefined' ? __app_id : 'default-tts-app';
                
                if (!firebaseConfig) {
                    console.error("Firebase config is missing.");
                    if(isMounted) setIsAuthReady(true);
                    return;
                }

                // Инициализация
                const app = initializeApp(firebaseConfig);
                const firestore = getFirestore(app);
                const authInstance = getAuth(app);
                
                let userCredential;

                // Аутентификация: сначала с токеном, если есть, иначе анонимно
                if (initialAuthToken) {
                    userCredential = await signInWithCustomToken(authInstance, initialAuthToken);
                } else {
                    userCredential = await signInAnonymously(authInstance);
                }
                
                // Проверяем, что компонент все еще смонтирован
                if (isMounted) {
                    setDb(firestore);
                    setAuth(authInstance);
                    setUserId(userCredential.user.uid);
                    setAppId(currentAppId);
                    setIsAuthReady(true);
                }
                
            } catch (e) {
                console.error("Firebase Auth or Init failed:", e);
                if(isMounted) setIsAuthReady(true);
            }
        };

        initFirebase();
        
        return () => {
            isMounted = false; // Cleanup
        };
    }, []);
    
    // --- 2. ГЕНЕРАЦИЯ АУДИО (обновленная с voice) ---
    const handleGenerateSpeech = useCallback(async () => {
        if (isLoading || text.trim().length < 5) return;

        resetPlayer();
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(TTS_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // Добавляем выбранный голос в тело запроса
                body: JSON.stringify({ text, voice: selectedVoice }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Не удалось сгенерировать аудио.');
            }

            // Получаем аудио как Blob
            const audioBlob = await response.blob();
            // Создаем Blob URL
            const url = URL.createObjectURL(audioBlob);

            // Запускаем воспроизведение через контекст плеера
            setAudioUrl(url); 

        } catch (e) {
            console.error("Generation error:", e);
            setError(e.message || 'Произошла неизвестная ошибка при генерации.');
        } finally {
            setIsLoading(false);
        }
    }, [text, selectedVoice, isLoading, setAudioUrl, setIsLoading, setError, resetPlayer]);

    // --- 3. СОХРАНЕНИЕ В БИБЛИОТЕКУ FIREBASE ---
    const handleSaveToLibrary = useCallback(async () => {
        if (!db || !userId || !currentAudioUrl || !text || saveStatus === 'saving') {
            setError('Недостаточно данных или Firebase не готов для сохранения.');
            return;
        }

        try {
            setSaveStatus('saving');
            setError(null);
            
            // Заголовок для записи
            const storyTitle = text.substring(0, 50).trim() + (text.length > 50 ? '...' : '');

            // Сохраняем только текст и метаданные. AudioUrl - это временный Blob URL.
            // В реальном приложении сюда нужно загрузить файл в Firebase Storage, 
            // но для простоты мы сохраняем его как метаданные.
            const docRef = await addDoc(collection(db, `artifacts/${appId}/users/${userId}/stories`), {
                title: storyTitle,
                fullText: text,
                // Сохраняем всю необходимую информацию для воспроизведения и идентификации
                audioUrl: currentAudioUrl, 
                voice: selectedVoice,
                duration: duration,
                createdAt: serverTimestamp(),
            });

            setSaveStatus('success');
            // Очищаем статус через 3 секунды
            setTimeout(() => setSaveStatus(null), 3000);

        } catch (e) {
            console.error("Error saving to library:", e);
            setSaveStatus('error');
            setError('Ошибка сохранения: ' + e.message);
        }
    }, [db, userId, appId, currentAudioUrl, text, selectedVoice, duration, saveStatus, setError]);

    // --- 4. ВОСПРОИЗВЕДЕНИЕ ИЗ БИБЛИОТЕКИ ---
    // Эта функция будет передана в компонент Library
    const handlePlayFromLibrary = useCallback((item) => {
        resetPlayer();
        setAudioUrl(item.audioUrl);
        // Дополнительная логика, например, установить текст для поля ввода, если нужно:
        // setText(item.fullText);
        // setSelectedVoice(item.voice);
        setActiveTab('create'); // Переключаемся обратно на вкладку генерации/плеера
    }, [setAudioUrl, resetPlayer]);


    if (!isAuthReady) {
        return (
            <div className="flex justify-center items-center h-screen text-lg text-txt-primary bg-bg-default">
                Подключение к Firebase...
            </div>
        );
    }
    
    // --- РЕНДЕРИНГ ОСНОВНОГО КОНТЕНТА ---
    const renderContent = () => {
        if (activeTab === 'library') {
            return (
                // Передаем Firebase объекты в компонент Library
                <Library 
                    db={db} 
                    appId={appId} 
                    userId={userId} 
                    onPlay={handlePlayFromLibrary}
                />
            );
        }

        // Вкладка 'create' (Генерация/Плеер)
        return (
            <div className="space-y-4">
                {/* 1. Выбор Голоса */}
                <div className="card-glass shadow-neon/10">
                    <label htmlFor="voice-select" className="block text-sm font-medium text-txt-secondary mb-2">
                        Выберите Голос (Для TTS)
                    </label>
                    <select
                        id="voice-select"
                        value={selectedVoice}
                        onChange={(e) => setSelectedVoice(e.target.value)}
                        className="w-full p-3 rounded-lg border-2 border-txt-muted/50 focus:border-accent-neon focus:ring-accent-neon bg-bg-glass text-txt-primary transition-all duration-200"
                        disabled={isLoading}
                    >
                        {VOICE_OPTIONS.map(voice => (
                            <option key={voice.value} value={voice.value}>
                                {voice.label}
                            </option>
                        ))}
                    </select>
                </div>
                
                {/* 2. Поле Ввода */}
                <div className="card-glass shadow-neon/10">
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Введите текст для озвучивания (мин. 5 символов)..."
                        rows={6}
                        maxLength={5000}
                        className="textarea-input"
                        disabled={isLoading}
                    />
                    <div className="text-right text-xs text-txt-muted mt-2">
                        {text.length} / 5000
                    </div>
                </div>

                {/* 3. Кнопки Действий */}
                <div className="flex flex-col gap-3">
                    {/* Кнопка Генерации */}
                    <motion.button
                        onClick={handleGenerateSpeech}
                        whileTap={tapEffect}
                        disabled={isLoading || text.trim().length < 5}
                        className={`w-full py-3 rounded-xl font-semibold text-lg transition-colors shadow-lg
                            ${isLoading || text.trim().length < 5
                                ? 'bg-tg-hint-color/40 text-tg-hint-color cursor-not-allowed'
                                : 'bg-accent-neon hover:bg-accent-light text-white shadow-neon/50'
                            }`
                        }
                    >
                        {isLoading ? '⏳ Генерация...' : '🔊 Слушать Голосом'}
                    </motion.button>
                    
                    {/* Кнопка Сохранить в библиотеку (появляется только после генерации) */}
                    {currentAudioUrl && (
                        <motion.button
                            onClick={handleSaveToLibrary}
                            whileTap={tapEffect}
                            disabled={saveStatus === 'saving'}
                            className={`w-full py-3 rounded-xl font-semibold text-lg transition-colors border border-accent-neon
                                ${saveStatus === 'saving'
                                    ? 'bg-accent-deep text-accent-light cursor-not-allowed'
                                    : 'bg-transparent hover:bg-accent-deep/50 text-accent-neon'
                                }`
                            }
                        >
                            <div className="flex items-center justify-center gap-2">
                                {saveStatus === 'saving' ? (
                                    'Сохранение...'
                                ) : saveStatus === 'success' ? (
                                    <>
                                        <BookOpen size={20} /> Сохранено!
                                    </>
                                ) : (
                                    <>
                                        <Save size={20} /> Сохранить в Библиотеку
                                    </>
                                )}
                            </div>
                        </motion.button>
                    )}

                    {/* Кнопка сброса/очистки */}
                    <motion.button
                        onClick={() => {
                            setText('');
                            resetPlayer();
                            setSaveStatus(null);
                        }}
                        whileTap={tapEffect}
                        className="w-full py-3 rounded-xl font-semibold text-lg transition-colors bg-bg-card text-txt-primary border border-txt-muted/20 hover:bg-txt-muted/10"
                    >
                        <div className="flex items-center justify-center gap-2">
                            <Trash2 size={20}/> Очистить Ввод
                        </div>
                    </motion.button>
                </div>

                {/* 4. Сообщение об ошибке */}
                {displayError && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 p-3 rounded-xl bg-red-900/50 text-red-300 border border-red-700/50 text-sm"
                    >
                        Ошибка: {displayError}
                    </motion.div>
                )}
            </div>
        );
    };

    return (
        <Layout>
            <div className="pb-28"> 
                <div className="mx-auto max-w-md p-4">
                    {renderContent()}
                </div>
            </div>
            
            {/* Плеер (фиксирован внизу) */}
            <PlayerControl voice={selectedVoice} />
            
            {/* Панель навигации по вкладкам */}
            <TabBar activeTab={activeTab} setActiveTab={setActiveTab} />
        </Layout>
    );
};

export default Home;

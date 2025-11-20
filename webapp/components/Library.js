// Файл: webapp/components/Library.js
import React, { useState, useEffect, useCallback } from 'react';
import { getFirestore, collection, query, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { getAuth, signInWithCustomToken, signInAnonymously } from 'firebase/auth';
import { Trash2, Loader2, Play, StopCircle } from 'lucide-react';
import { usePlayer } from '@/context/PlayerContext';
import { initializeApp } from 'firebase/app';

// Инициализация глобальных переменных
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Функция для форматирования даты
const formatDate = (timestamp) => {
    if (!timestamp || !timestamp.toDate) return 'Неизвестная дата';
    const date = timestamp.toDate();
    return date.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const Library = () => {
    const { currentText, isPlaying, playSpeech, stopSpeech } = usePlayer();
    
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    
    const [recordings, setRecordings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // 1. Инициализация Firebase и Аутентификация
    useEffect(() => {
        if (!firebaseConfig) {
            setError('Ошибка: Конфигурация Firebase не найдена.');
            setIsLoading(false);
            return;
        }

        try {
            const app = initializeApp(firebaseConfig);
            const firestoreDb = getFirestore(app);
            const firebaseAuth = getAuth(app);
            
            setDb(firestoreDb);
            setAuth(firebaseAuth);

            // Аутентификация
            const authenticate = async () => {
                try {
                    if (initialAuthToken) {
                        await signInWithCustomToken(firebaseAuth, initialAuthToken);
                    } else {
                        await signInAnonymously(firebaseAuth);
                    }
                } catch (e) {
                    console.error("Ошибка аутентификации:", e);
                    // Продолжаем с анонимным пользователем, если кастомный токен не сработал
                    await signInAnonymously(firebaseAuth); 
                }
            };
            
            // Наблюдатель состояния аутентификации
            const unsubscribe = firebaseAuth.onAuthStateChanged(user => {
                if (user) {
                    setUserId(user.uid);
                } else {
                    // Если нет пользователя (что маловероятно после signIn), используем рандомный ID
                    setUserId(crypto.randomUUID());
                }
                setIsAuthReady(true);
            });

            authenticate();
            return () => unsubscribe(); // Очистка слушателя при размонтировании
        } catch (e) {
            console.error("Ошибка инициализации Firebase:", e);
            setError(`Ошибка инициализации Firebase: ${e.message}`);
            setIsLoading(false);
        }
    }, [firebaseConfig, initialAuthToken]);

    // 2. Загрузка данных (onSnapshot)
    useEffect(() => {
        if (!isAuthReady || !db || !userId) {
            // Ждем завершения аутентификации
            return; 
        }

        // Коллекция для публичных записей
        // Путь: /artifacts/{appId}/public/data/recordings
        const collectionPath = `/artifacts/${appId}/public/data/recordings`;
        const recordingsCol = collection(db, collectionPath);
        
        // ВАЖНО: Мы избегаем orderBy() в запросе Firestore и сортируем на клиенте.
        const q = query(recordingsCol);

        // Наблюдатель в реальном времени
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedRecordings = snapshot.docs.map(document => ({
                id: document.id,
                ...document.data()
            }));

            // Сортировка на клиенте по полю 'createdAt' в обратном порядке
            fetchedRecordings.sort((a, b) => {
                const dateA = a.createdAt ? a.createdAt.toDate().getTime() : 0;
                const dateB = b.createdAt ? b.createdAt.toDate().getTime() : 0;
                return dateB - dateA; // Сначала новые
            });

            setRecordings(fetchedRecordings);
            setIsLoading(false);
        }, (err) => {
            console.error("Ошибка при получении записей:", err);
            setError(`Не удалось загрузить библиотеку: ${err.message}`);
            setIsLoading(false);
        });

        return () => unsubscribe(); // Очистка слушателя при размонтировании
    }, [isAuthReady, db, userId]);

    // Обработчик удаления
    const handleDelete = useCallback(async (id, recordUserId) => {
        if (!db || !userId || recordUserId !== userId) {
            console.error("Недостаточно прав для удаления. Только владелец может удалить запись.");
            return; 
        }

        try {
            const docRef = doc(db, `/artifacts/${appId}/public/data/recordings`, id);
            await deleteDoc(docRef);
        } catch (e) {
            console.error("Ошибка удаления:", e);
            setError(`Не удалось удалить запись: ${e.message}`);
        }
    }, [db, userId]);

    // Отображение состояния загрузки
    if (isLoading) {
        return (
            <div className="card-glass flex justify-center items-center h-48">
                <Loader2 className="animate-spin h-8 w-8 text-accent-neon" />
                <span className="ml-3 text-txt-secondary">Загрузка библиотеки...</span>
            </div>
        );
    }

    // Отображение состояния ошибки
    if (error) {
        return (
            <div className="card-glass p-4 bg-red-900/50 text-red-300 border border-red-500 rounded-lg">
                <h3 className="font-bold">Ошибка</h3>
                <p>{error}</p>
            </div>
        );
    }
    
    // Основной рендер
    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold text-txt-primary">Библиотека Сохраненных Аудио</h2>
            <p className="text-txt-secondary text-sm">Здесь отображаются все публичные записи, созданные пользователями. (Ваш ID: <span className="text-accent-neon font-mono break-all">{userId || 'N/A'}</span>)</p>

            {recordings.length === 0 ? (
                <div className="card-glass text-center p-8 text-txt-secondary">
                    <p>Библиотека пуста. Создайте аудио в разделе "Генератор речи", чтобы добавить его сюда.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {recordings.map((record) => {
                        const isCurrent = record.text === currentText;
                        const isOwner = record.userId === userId;
                        
                        return (
                            <div key={record.id} className="card-glass flex justify-between items-start space-x-4">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-txt-primary truncate">
                                        {record.text}
                                    </p>
                                    <div className="text-xs text-txt-secondary mt-1 space-y-0.5">
                                        <p>Создан: {formatDate(record.createdAt)}</p>
                                        <p>Пользователь: <span className="font-mono text-txt-muted/70 break-all">{record.userId}</span></p>
                                    </div>
                                </div>

                                <div className="flex space-x-2 items-center flex-shrink-0">
                                    {/* Кнопка Воспроизведения/Остановки */}
                                    <button 
                                        className={`p-2 rounded-full transition-colors duration-200 ${
                                            isCurrent && isPlaying 
                                                ? 'bg-red-500 text-white hover:bg-red-600'
                                                : 'bg-accent-neon/20 text-accent-neon hover:bg-accent-neon/40'
                                        }`}
                                        onClick={() => {
                                            if (isCurrent && isPlaying) {
                                                stopSpeech();
                                            } else {
                                                playSpeech(record.audioUrl, record.text);
                                            }
                                        }}
                                        title={isCurrent && isPlaying ? "Остановить" : "Воспроизвести"}
                                    >
                                        {isCurrent && isPlaying ? (
                                            <StopCircle className="h-5 w-5" />
                                        ) : (
                                            <Play className="h-5 w-5" />
                                        )}
                                    </button>

                                    {/* Кнопка Удаления (только для владельца) */}
                                    {isOwner && (
                                        <button 
                                            className="p-2 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/40 transition-colors duration-200"
                                            onClick={() => handleDelete(record.id, record.userId)}
                                            title="Удалить мою запись"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Library;

// Файл: webapp/components/Library.js
import React, { useState, useEffect, useCallback } from 'react';
// ✅ ИСПРАВЛЕНИЕ 1.1: Используем импорты из новых, логически корректных контекстов
import { useAuth } from '@/context/AuthContext'; // Для DB и Auth ID
import { usePlayer } from '@/context/PlayerContext'; // Для управления плеером

// Удаляем ненужные импорты Firebase, так как все берется из AuthContext
import { collection, query, onSnapshot, doc, deleteDoc } from 'firebase/firestore'; 
import { Trash2, Loader2, Play, StopCircle } from 'lucide-react';

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
    const { currentAudioUrl, isPlaying, playSpeech, stopSpeech } = usePlayer();
    // ✅ ИСПРАВЛЕНИЕ 1.1: Получаем все нужные данные из useAuth
    const { db, userId, isAuthReady } = useAuth(); 
    
    const [records, setRecords] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // useEffect для подписки на Firestore
    useEffect(() => {
        // Загрузка только если DB и Auth готовы
        if (!db || !userId || !isAuthReady) {
            if (isAuthReady && !db) {
                setError("Ошибка инициализации базы данных. Проверьте конфигурацию Firebase.");
            }
            return;
        }

        const q = query(
            collection(db, `users/${userId}/library`), // Коллекция в пути, привязанном к пользователю
            // orderBy("createdAt", "desc"), 
        );

        // Подписка на изменения в реальном времени
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedRecords = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            setRecords(fetchedRecords);
            setIsLoading(false);
            setError(null);
        }, (err) => {
            console.error("Firestore snapshot error:", err);
            setError("Не удалось загрузить библиотеку.");
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [db, userId, isAuthReady]); 


    // Обработчик удаления записи
    const handleDelete = useCallback(async (id, recordUserId) => {
        if (recordUserId !== userId) {
            alert("Вы можете удалять только свои записи.");
            return;
        }
        
        if (!db) {
            setError("База данных не инициализирована.");
            return;
        }

        // TODO: ПРИОРИТЕТ 2.4 - Здесь также нужно удалить аудиофайл из Firebase Storage.

        try {
            await deleteDoc(doc(db, `users/${userId}/library`, id));
        } catch (e) {
            console.error("Error removing document: ", e);
            setError("Не удалось удалить запись.");
        }
    }, [db, userId]);


    // Обработчик нажатия на кнопку Play в карточке
    const handlePlayPause = useCallback((record) => {
        const url = record.audioUrl;
        const isCurrent = currentAudioUrl === url;

        if (isCurrent && isPlaying) {
            stopSpeech();
        } else if (url) {
            playSpeech(url); 
        }
    }, [currentAudioUrl, isPlaying, playSpeech, stopSpeech]);


    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-48">
                <Loader2 className="animate-spin h-8 w-8 text-accent-neon" />
                <p className="ml-3 text-txt-secondary">Загрузка библиотеки...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-800/50 text-red-300 border border-red-500 rounded-lg">
                <p>Критическая ошибка: {error}</p>
            </div>
        );
    }

    if (records.length === 0) {
        return (
            <div className="p-4 text-center rounded-xl bg-bg-glass border border-white/5">
                <p className="text-lg font-semibold text-txt-primary">Библиотека пуста</p>
                <p className="text-txt-secondary mt-1">Перейдите в "Генератор речи", чтобы создать первую запись.</p>
            </div>
        );
    }
    
    return (
        <div className="pt-2 pb-4">
            <h2 className="text-2xl font-bold mb-4 text-txt-primary">Мои записи</h2>

            {records.length > 0 && (
                <div className="space-y-4">
                    {records.map((record) => {
                        const isCurrent = currentAudioUrl === record.audioUrl;
                        const isOwner = record.userId === userId; 

                        return (
                            <div 
                                key={record.id} 
                                className={`
                                    flex items-center justify-between p-3 rounded-xl card-glass border transition-all duration-300
                                    ${isCurrent ? 'border-accent-neon shadow-neon-light/50' : 'border-white/5'}
                                `}
                            >
                                {/* Информация о записи */}
                                <div className="flex flex-col min-w-0 flex-grow mr-4">
                                    <p className={`font-semibold text-txt-primary truncate ${isCurrent ? 'text-accent-neon' : ''}`}>
                                        {/* Используем первые 50 символов как название */}
                                        {record.text ? record.text.substring(0, 50) + (record.text.length > 50 ? '...' : '') : 'Без названия'}
                                    </p>
                                    <p className="text-xs text-txt-secondary mt-0.5">
                                        Дата: {formatDate(record.createdAt)} 
                                        {/* TODO: Добавить длительность записи (Приоритет 2) */}
                                    </p>
                                </div>

                                {/* Кнопки управления */}
                                <div className="flex items-center space-x-2 flex-shrink-0">
                                    {/* Кнопка Воспроизведения/Остановки */}
                                    <button
                                        className={`p-2 rounded-full transition-colors duration-200 ${
                                            isCurrent && isPlaying 
                                                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/40' 
                                                : 'bg-accent-neon/20 text-accent-neon hover:bg-accent-neon/30'
                                        }`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handlePlayPause(record);
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

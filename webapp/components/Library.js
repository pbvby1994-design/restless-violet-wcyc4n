import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext'; 
import { usePlayer } from '@/context/PlayerContext'; 

// Импорты Firebase
import { collection, query, onSnapshot, doc, deleteDoc } from 'firebase/firestore'; 
import { ref, deleteObject } from 'firebase/storage'; // ✅ ВОЗВРАЩЕНО
import { Trash2, Loader2, Play, StopCircle } from 'lucide-react';

// Функция для форматирования даты (без изменений)
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

// ✅ УТИЛИТА: Извлечение пути Storage из URL (для удаления)
const getStoragePathFromUrl = (audioUrl) => {
    if (!audioUrl || !audioUrl.includes("firebasestorage")) return null;
    try {
        const url = new URL(audioUrl);
        // /v0/b/{bucket}/o/users%2F{userId}%2Ftts%2F{id}.mp3...
        const pathWithQuery = url.pathname.split('/o/')[1]; 
        // Декодируем и удаляем параметры запроса, оставляя только путь
        const filePath = decodeURIComponent(pathWithQuery.split('?')[0]);
        return filePath;
    } catch (e) {
        console.error("Error parsing storage URL:", e);
        return null;
    }
}


const Library = () => {
    const { currentAudioUrl, isPlaying, playSpeech, stopSpeech } = usePlayer();
    // ✅ Получаем DB, Storage и UserID
    const { db, storage, userId, isAuthReady } = useAuth(); 
    
    const [records, setRecords] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // ... (useEffect для подписки на Firestore остается без изменений) ...
    useEffect(() => {
        if (!db || !userId || !isAuthReady) {
            if (isAuthReady && !db) {
                setError("Ошибка инициализации базы данных. Проверьте конфигурацию Firebase.");
            }
            return;
        }

        const q = query(
            collection(db, `users/${userId}/library`),
            // Добавьте orderBy("createdAt", "desc") для сортировки по дате, если необходимо
        );

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


    // ✅ ОБНОВЛЕННЫЙ ОБРАБОТЧИК УДАЛЕНИЯ (Приоритет 2.4)
    const handleDelete = useCallback(async (record) => {
        if (record.userId !== userId) {
            alert("Вы можете удалять только свои записи.");
            return;
        }
        
        // Проверяем наличие Storage
        if (!db || !storage) {
            setError("База данных или хранилище не инициализированы.");
            return;
        }

        try {
            // 1. Удаление аудиофайла из Firebase Storage
            const storagePath = getStoragePathFromUrl(record.audioUrl);
            if (storagePath) {
                const fileRef = ref(storage, storagePath);
                // Это удалит файл, если он существует. Правила безопасности Firebase защищают этот шаг.
                await deleteObject(fileRef); 
            } else {
                console.warn("Storage URL could not be parsed or is missing. Skipping Storage deletion.");
            }

            // 2. Удаление метаданных из Firestore
            await deleteDoc(doc(db, `users/${userId}/library`, record.id));
            
            // Если удален текущий воспроизводимый файл, останавливаем плеер
            if (currentAudioUrl === record.audioUrl) {
                stopSpeech();
            }

        } catch (e) {
            console.error("Error removing document and file: ", e);
            setError(`Не удалось удалить запись. Ошибка: ${e.message}`);
        }
    }, [db, storage, userId, currentAudioUrl, stopSpeech]);


    // Обработчик нажатия на кнопку Play в карточке (без изменений)
    const handlePlayPause = useCallback((record) => {
        const url = record.audioUrl;
        const isCurrent = currentAudioUrl === url;

        if (isCurrent && isPlaying) {
            stopSpeech();
        } else if (url) {
            playSpeech(url); 
        }
    }, [currentAudioUrl, isPlaying, playSpeech, stopSpeech]);


    // ✅ ФУНКЦИЯ ФОРМАТИРОВАНИЯ ДЛИТЕЛЬНОСТИ (Приоритет 2.2)
    const formatDuration = (seconds) => {
        if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    // ... (Loading/Error/Empty states)
    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-8">
                <Loader2 className="animate-spin h-6 w-6 text-accent-neon" />
                <span className="ml-3 text-txt-secondary">Загрузка библиотеки...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-800/50 text-red-300 border border-red-500 rounded-lg">
                Ошибка: {error}
            </div>
        );
    }
    
    if (records.length === 0) {
        return (
            <div className="p-4 text-center text-txt-secondary border border-white/10 rounded-xl">
                Ваша библиотека пуста. Сгенерируйте и сохраните аудио на вкладке "Генератор речи".
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
                                        {record.text ? record.text.substring(0, 50) + (record.text.length > 50 ? '...' : '') : 'Без названия'}
                                    </p>
                                    <p className="text-xs text-txt-secondary mt-0.5">
                                        Дата: {formatDate(record.createdAt)} 
                                        {/* ✅ Приоритет 2.2: Отображение длительности */}
                                        {record.duration && ` | Длительность: ${formatDuration(record.duration)}`}
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
                                            onClick={() => handleDelete(record)}
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

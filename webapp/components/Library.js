// Файл: webapp/components/Library.js
import React, { useState, useEffect, useCallback } from 'react';
// Импортируем только необходимые функции Firestore, но не его инициализацию
import { collection, query, onSnapshot, doc, deleteDoc, orderBy, serverTimestamp } from 'firebase/firestore'; 
import { Trash2, Loader2, Play, StopCircle } from 'lucide-react';
// ✅ Используем хук useAuth для получения инициализированных объектов из PlayerContext
import { useAuth, usePlayer } from '@/context/PlayerContext'; 

// --- Вспомогательные функции ---

// Функция для форматирования даты
const formatDate = (timestamp) => {
    // Проверяем, что timestamp существует и имеет метод toDate() (для Firestore Timestamp)
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

// Функция для форматирования времени (из FullPlayer.js, чтобы избежать ошибок)
const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds) || seconds < 0) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
};


// --- Основной компонент Библиотека ---
const Library = () => {
    // ✅ Получаем состояние плеера для управления воспроизведением
    const { 
        currentUrl: currentAudioUrl, // Переименуем для ясности
        isPlaying, 
        playSpeech, 
        stopSpeech,
        setError 
    } = usePlayer(); 
    
    // ✅ Получаем инициализированные объекты из контекста
    const { db, auth, userId, isAuthReady } = useAuth(); 

    const [records, setRecords] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setLocalError] = useState(null);

    // 1. Загрузка записей из Firestore
    useEffect(() => {
        // Загрузка возможна только, если Auth готов И у нас есть ID пользователя И объект DB
        if (!isAuthReady || !userId || !db) {
            if (isAuthReady) {
                // Если Auth готов, но нет userId (что странно), или нет db (что означает сбой инициализации)
                setLocalError("База данных или пользователь не инициализированы.");
            }
            // Выходим до тех пор, пока не получим все данные
            return;
        }

        const recordsCollectionRef = collection(db, 'user_records');
        
        // Создаем запрос: только записи пользователя, отсортированные по дате создания
        // ✅ ВАЖНО: Мы запрашиваем ВСЕ записи, и только правила Firestore ограничат доступ
        const q = query(
            recordsCollectionRef,
            // orderBy('createdAt', 'desc') // Добавьте это, если хотите сортировать
        );
        
        // Подписка на изменения в коллекции (onSnapshot)
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedRecords = [];
            snapshot.forEach((doc) => {
                // Добавляем ID документа к данным
                fetchedRecords.push({ id: doc.id, ...doc.data() });
            });
            
            // Фильтруем на клиенте только те записи, где userId совпадает
            // Это ДОПОЛНИТЕЛЬНАЯ мера, основное ограничение - в Правилах Firestore.
            const userRecords = fetchedRecords.filter(record => record.userId === userId);

            setRecords(userRecords);
            setIsLoading(false);
            setLocalError(null);
        }, (err) => {
            console.error("Failed to fetch records:", err);
            setLocalError("Ошибка загрузки записей: " + err.message);
            setIsLoading(false);
        });

        // Функция очистки (отписка)
        return () => unsubscribe();
    }, [isAuthReady, userId, db]);


    // 2. Функция удаления записи
    const handleDelete = useCallback(async (recordId) => {
        if (!db || !userId) {
            setLocalError("Ошибка: Невозможно удалить. Пользователь или DB не инициализированы.");
            return;
        }

        try {
            await deleteDoc(doc(db, 'user_records', recordId));
            // Ошибка Missing or insufficient permissions. будет возникать здесь,
            // если правила Firestore настроены неправильно.
        } catch (e) {
            console.error("Error removing document: ", e);
            setLocalError("Недостаточно прав для удаления записи. Проверьте правила Firestore.");
        }
    }, [db, userId]);


    // 3. Функция воспроизведения записи (передаем в BookCard)
    const handlePlayRecord = useCallback((record) => {
        // Устанавливаем текущий URL и текст для плеера
        playSpeech(record.audioUrl, record.text); 
    }, [playSpeech]);


    // --- Рендеринг ---
    if (!isAuthReady) {
        return (
            <div className="text-center p-8 text-txt-secondary">
                <Loader2 className="animate-spin h-8 w-8 mx-auto mb-4 text-accent-neon" />
                <p>Инициализация пользователя...</p>
            </div>
        );
    }

    return (
        <div className="p-4 max-w-lg mx-auto min-h-[300px]">
            <h2 className="text-2xl font-bold mb-4 text-txt-primary">Моя Библиотека</h2>
            
            {error && (
                <div className="p-3 bg-red-800/50 text-red-300 border border-red-500 rounded-lg mb-4">
                    {error}
                </div>
            )}
            
            {isLoading && !error && (
                <div className="text-center p-8 text-txt-secondary">
                    <Loader2 className="animate-spin h-8 w-8 mx-auto mb-4 text-accent-neon" />
                    <p>Загрузка записей...</p>
                </div>
            )}
            
            {!isLoading && records.length === 0 && (
                <div className="text-center p-8 text-txt-secondary border border-dashed border-txt-muted/30 rounded-lg">
                    <p className="text-lg mb-2">Библиотека пуста</p>
                    <p className="text-sm">Сгенерируйте и сохраните аудио на вкладке "Генератор речи".</p>
                </div>
            )}

            {!isLoading && records.length > 0 && (
                <div className="space-y-4">
                    {records.map((record) => {
                        const isCurrent = record.audioUrl === currentAudioUrl;
                        const isOwner = record.userId === userId; // Всегда true, но для безопасности

                        return (
                            // Используем div вместо BookCard для упрощения
                            <div 
                                key={record.id}
                                className={`
                                    flex items-center justify-between p-3 rounded-xl border transition-all duration-300
                                    ${isCurrent 
                                        ? 'border-accent-neon bg-accent-neon/10 shadow-neon-sm' 
                                        : 'border-white/10 bg-bg-card hover:bg-white/5'
                                    }
                                `}
                            >
                                {/* Левая часть: Информация */}
                                <div className="min-w-0 flex-1 pr-4">
                                    <h3 className="font-semibold text-txt-primary truncate">
                                        {/* Используем первые 50 символов как заголовок */}
                                        {record.text.length > 50 
                                            ? record.text.substring(0, 50) + '...' 
                                            : record.text
                                        }
                                    </h3>
                                    <p className="text-xs text-txt-muted mt-0.5">
                                        {formatDate(record.createdAt)} • {formatDuration(record.duration || 0)}
                                    </p>
                                </div>

                                {/* Правая часть: Кнопки управления */}
                                <div className="flex space-x-2 flex-shrink-0">
                                    {/* Кнопка Play/Stop */}
                                    <button 
                                        className={`p-2 rounded-full transition-colors duration-200 ${
                                            isCurrent && isPlaying 
                                                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/40'
                                                : 'bg-accent-neon/20 text-accent-neon hover:bg-accent-neon/40'
                                        }`}
                                        onClick={() => {
                                            if (isCurrent && isPlaying) {
                                                stopSpeech();
                                            } else {
                                                handlePlayRecord(record);
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
                                            onClick={() => handleDelete(record.id)}
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

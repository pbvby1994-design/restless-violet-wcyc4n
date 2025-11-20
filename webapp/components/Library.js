// Файл: webapp/components/Library.js
import React, { useState, useEffect, useCallback } from 'react';
// Оставляем только нужные импорты Firestore
import { collection, query, onSnapshot, doc, deleteDoc } from 'firebase/firestore'; 
import { Trash2, Loader2, Play, StopCircle } from 'lucide-react';

// ✅ ИСПРАВЛЕНИЕ: Используем ТОЛЬКО usePlayer, который экспортирует все нужные данные
import { usePlayer } from '@/context/PlayerContext'; 

// --- УДАЛЕНЫ НЕИСПОЛЬЗУЕМЫЕ ИМПОРТЫ FIREBASE AUTH/APP ---

// Функция для форматирования даты (оставляем)
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

// Компонент теперь принимает onPlay из pages/library.js
const Library = ({ onPlay }) => {
    // ✅ ИСПРАВЛЕНИЕ: Получаем все необходимые данные из usePlayer
    const { 
        currentUrl, 
        isPlaying, 
        stopSpeech, 
        // Auth/DB данные:
        db, 
        userId, 
        isAuthReady, 
        setError 
    } = usePlayer(); 
    
    const [records, setRecords] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    // error теперь берется из контекста для плеера, но локальный error нужен для FireStore
    const [localError, setLocalError] = useState(null); 
    
    // 3. Эффект для подписки на изменения в Firestore
    useEffect(() => {
        // Запускаем подписку только после того, как аутентификация готова И DB инициализирована
        if (!isAuthReady || !db || !userId) {
            if (!isAuthReady) setIsLoading(true); 
            return;
        }

        try {
            setIsLoading(true);
            setLocalError(null);

            // Создаем путь к коллекции: /users/{userId}/records
            const recordsCollectionRef = collection(db, 'users', userId, 'records');
            const recordsQuery = query(recordsCollectionRef); 

            // Подписываемся на изменения в реальном времени
            const unsubscribe = onSnapshot(recordsQuery, (snapshot) => {
                const fetchedRecords = snapshot.docs.map(d => ({
                    id: d.id,
                    ...d.data()
                }));
                // Сортировка по дате создания
                fetchedRecords.sort((a, b) => {
                    const dateA = a.createdAt && a.createdAt.toDate ? a.createdAt.toDate() : 0;
                    const dateB = b.createdAt && b.createdAt.toDate ? b.createdAt.toDate() : 0;
                    return dateB - dateA;
                });
                setRecords(fetchedRecords);
                setIsLoading(false);
            }, (err) => {
                // ЭТА ФУНКЦИЯ ВЫЗЫВАЕТСЯ ПРИ ОШИБКЕ ПРАВ ДОСТУПА
                console.error("Firestore subscription error:", err);
                setLocalError("Ошибка загрузки библиотеки. Проверьте права доступа в Firebase.");
                setIsLoading(false);
            });

            // Функция отписки, которая будет вызвана при размонтировании компонента
            return () => unsubscribe();
        } catch (e) {
            console.error("Setup Firestore error:", e);
            setLocalError("Ошибка инициализации базы данных.");
            setIsLoading(false);
            return () => {};
        }

    }, [isAuthReady, db, userId]); // Зависимости: db, userId, isAuthReady

    // 4. Функция удаления записи
    const handleDelete = useCallback(async (recordId, ownerId) => {
        // Проверяем наличие DB, ID пользователя и совпадение ID владельца
        if (!db || !userId || userId !== ownerId) return;

        if (window.confirm("Вы уверены, что хотите удалить эту запись?")) {
            try {
                // Путь к документу: /users/{userId}/records/{recordId}
                const recordRef = doc(db, 'users', userId, 'records', recordId);
                await deleteDoc(recordRef);
            } catch (e) {
                console.error("Error deleting record:", e);
                setError("Не удалось удалить запись.");
            }
        }
    }, [db, userId, setError]);


    // 5. Визуализация
    if (isLoading) {
        return (
            <div className="text-center p-8 text-txt-secondary">
                <Loader2 className="animate-spin h-8 w-8 mx-auto text-accent-neon" />
                <p className="mt-4">Загрузка библиотеки...</p>
            </div>
        );
    }
    
    if (localError) {
        return (
            <div className="text-center p-8 bg-red-800/50 text-red-300 border border-red-500 rounded-xl">
                {localError}
            </div>
        );
    }

    if (records.length === 0) {
        return (
            <div className="text-center p-8 text-txt-secondary rounded-xl border border-white/10 bg-bg-glass">
                <p className="text-lg font-semibold mb-2">Библиотека пуста</p>
                <p>Здесь будут отображаться ваши сохраненные аудиозаписи.</p>
                <p className="mt-4 text-xs text-txt-muted">Начните с вкладки "Генератор речи".</p>
            </div>
        );
    }

    // ... (Остальной код рендеринга без изменений) ...
    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-txt-primary">Моя Библиотека ({records.length})</h2>
            <p className="text-txt-secondary text-sm">Здесь хранятся ваши голосовые записи. Нажмите Play для воспроизведения.</p>
            
            {/* Список записей */}
            <div className="grid grid-cols-1 gap-3">
                {records.map((record) => {
                    const isCurrent = record.audioUrl === currentUrl;
                    const isOwner = record.userId === userId; 

                    return (
                        <div 
                            key={record.id} 
                            className="p-3 bg-bg-glass rounded-xl border border-white/10 shadow-lg flex items-center justify-between transition-transform duration-200 hover:scale-[1.01]"
                        >
                            {/* Информация о записи */}
                            <div className="flex-1 min-w-0 pr-4">
                                <p className="font-semibold text-txt-primary truncate" title={record.title}>
                                    {record.title}
                                </p>
                                <p className="text-xs text-txt-muted mt-1">
                                    Создано: {formatDate(record.createdAt)}
                                </p>
                                <p className="text-xs text-txt-secondary mt-1 truncate max-w-full">
                                    {record.text.substring(0, 50)}...
                                </p>
                            </div>

                            {/* Кнопки действий */}
                            <div className="flex items-center space-x-2 flex-shrink-0">
                                {/* Кнопка Воспроизведения/Остановки */}
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
                                            // Вызываем onPlay из родительского компонента
                                            onPlay(record); 
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
        </div>
    );
};

export default Library;

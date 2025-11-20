import React, { useState, useEffect, useCallback } from 'react';
// Импортируем только необходимые функции Firestore и компоненты
import { collection, query, onSnapshot, doc, deleteDoc, orderBy, limit } from 'firebase/firestore'; 
import { Trash2, Loader2, Play, StopCircle } from 'lucide-react';
import { usePlayer } from '@/context/PlayerContext';

// Утилита для форматирования даты
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
    // 🛑 ИСПРАВЛЕНО: Получаем db, userId, isAuthReady из контекста
    const { 
        currentUrl, 
        isPlaying, 
        playSpeech, 
        stopSpeech, 
        db, 
        userId, 
        isAuthReady,
        // Добавьте сюда функции плеера, если они используются, например:
        // setAudioUrl 
    } = usePlayer(); 
    
    // Состояния компонента
    const [records, setRecords] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    /**
     * Функция загрузки данных из Firestore.
     */
    const fetchData = useCallback(() => {
        if (!db || !isAuthReady) {
            // Если DB или Auth не готовы, пропускаем загрузку
            if (!isAuthReady) setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        // Путь к коллекции: все записи (для демонстрации)
        // В реальном приложении: `collection(db, 'users', userId, 'records')`
        const recordsCollectionRef = collection(db, 'records');
        
        // Создаем запрос: сортировка по дате, лимит 20 последних
        const q = query(recordsCollectionRef, orderBy('createdAt', 'desc'), limit(20));

        // Подписываемся на изменения в реальном времени
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedRecords = snapshot.docs.map(document => ({
                id: document.id,
                ...document.data()
            }));
            setRecords(fetchedRecords);
            setIsLoading(false);
        }, (err) => {
            console.error("Failed to fetch records:", err);
            setError("Не удалось загрузить библиотеку. Проверьте правила Firestore.");
            setIsLoading(false);
        });

        // Функция очистки (отписка)
        return () => unsubscribe();
    }, [db, isAuthReady]); // Зависит от готовности DB и Auth

    useEffect(() => {
        // Запускаем загрузку данных при готовности DB и Auth
        return fetchData();
    }, [fetchData]);

    /**
     * Удаление записи
     */
    const handleDelete = useCallback(async (id, recordUserId) => {
        if (!db || recordUserId !== userId) {
            alert("Вы не можете удалить чужую запись.");
            return;
        }

        if (window.confirm("Вы уверены, что хотите удалить эту запись?")) {
            try {
                // Путь к документу: records/{id}
                const docRef = doc(db, 'records', id);
                await deleteDoc(docRef);
                // Snapshot listener сам обновит состояние `records`
            } catch (e) {
                console.error("Error deleting document: ", e);
                setError("Ошибка при удалении записи.");
            }
        }
    }, [db, userId]);


    const isLibraryVisible = records.length > 0 || !isLoading;

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-txt-primary">Моя Библиотека</h2>
            
            {/* Сообщения о состоянии */}
            {isLoading && (
                <div className="flex items-center justify-center p-6 text-txt-secondary">
                    <Loader2 className="animate-spin h-6 w-6 mr-3" />
                    Загрузка записей...
                </div>
            )}
            
            {error && (
                <div className="p-3 bg-red-800/50 text-red-300 border border-red-500 rounded-lg">
                    {error}
                </div>
            )}

            {/* Список записей */}
            {isLibraryVisible && (
                <div className="space-y-3">
                    {records.length === 0 && !isLoading ? (
                        <div className="p-4 text-center text-txt-muted bg-bg-glass rounded-lg">
                            Ваша библиотека пуста. Сгенерируйте свою первую речь!
                        </div>
                    ) : records.map((record) => {
                        const isCurrent = currentUrl === record.audioUrl;
                        const isOwner = record.userId === userId;

                        return (
                            <div 
                                key={record.id} 
                                className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-300 ${isCurrent ? 'border-accent-neon bg-accent-neon/10 shadow-neon-light' : 'border-white/10 bg-bg-card'}`}
                            >
                                {/* Информация о записи */}
                                <div className="flex-1 min-w-0 pr-3">
                                    <p className={`text-sm font-semibold truncate ${isCurrent ? 'text-white' : 'text-txt-primary'}`}>
                                        {record.title || 'Безымянная запись'}
                                    </p>
                                    <p className="text-xs text-txt-muted mt-0.5">
                                        Создано: {formatDate(record.createdAt)} 
                                        {isOwner ? ' (Вы)' : ''}
                                    </p>
                                </div>

                                {/* Кнопки управления */}
                                <div className="flex items-center space-x-2 flex-shrink-0">
                                    {/* Кнопка Play/Stop */}
                                    <button 
                                        className={`p-2 rounded-full transition-colors duration-200 ${isCurrent && isPlaying 
                                            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/40' 
                                            : 'bg-accent-neon/20 text-accent-neon hover:bg-accent-neon/30'
                                        }`}
                                        onClick={() => {
                                            if (isCurrent && isPlaying) {
                                                stopSpeech();
                                            } else {
                                                // 🛑 Важное замечание: Здесь должна быть логика playSpeech, 
                                                // которая загружает и воспроизводит URL:
                                                // playSpeech(record.audioUrl, record.text, record.title);
                                                // В вашем текущем коде playSpeech ожидает только URL
                                                playSpeech(record.audioUrl); 
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

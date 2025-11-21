// Файл: webapp/components/Library.js
"use client"; // <-- КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ

import React, { useState, useEffect, useCallback } from 'react';
// Оставляем только нужные импорты Firestore
import { collection, query, onSnapshot, doc, deleteDoc } from 'firebase/firestore'; 
import { Trash2, Loader2, Play, StopCircle } from 'lucide-react';

// ✅ ИСПРАВЛЕНИЕ: Используем ТОЛЬКО usePlayer, который экспортирует все нужные данные
import { usePlayer } from '@/context/PlayerContext'; 

// --- УДАЛЕНЫ НЕИСПОЛЬЗУЕМЫЕ ИМПОРТЫ FIREBASE AUTH/APP ---\n\n
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
    
    // --- 1. Логика загрузки данных (onSnapshot) ---
    useEffect(() => {
        // Загрузка начинается только после готовности аутентификации
        if (!isAuthReady || !db) {
            if (isAuthReady) setIsLoading(false);
            return;
        }

        try {
            const q = query(collection(db, 'audioRecords'));
            
            // Подписка на изменения в реальном времени
            const unsubscribe = onSnapshot(q, (querySnapshot) => {
                const fetchedRecords = [];
                querySnapshot.forEach((doc) => {
                    fetchedRecords.push({ id: doc.id, ...doc.data() });
                });
                
                // Сортировка по дате создания (latest first)
                fetchedRecords.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
                
                setRecords(fetchedRecords);
                setIsLoading(false);
            }, (error) => {
                console.error("Error fetching library data: ", error);
                setError("Не удалось загрузить библиотеку.");
                setIsLoading(false);
            });

            return () => unsubscribe();
        } catch (error) {
            console.error("Firebase error during setup:", error);
            setError("Ошибка инициализации базы данных.");
            setIsLoading(false);
        }
    }, [isAuthReady, db, setError]); // Зависит от готовности аутентификации и объекта db

    // --- 2. Логика удаления записи ---
    const handleDelete = useCallback(async (recordId, recordUserId) => {
        if (!db || recordUserId !== userId) {
            setError("Нет прав для удаления или DB недоступна.");
            return;
        }
        
        try {
            await deleteDoc(doc(db, 'audioRecords', recordId));
            // UI обновится автоматически через onSnapshot
        } catch (error) {
            console.error("Error deleting record:", error);
            setError("Не удалось удалить запись.");
        }
    }, [db, userId, setError]);


    // --- 3. Рендеринг ---
    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-8 text-txt-secondary">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                Загрузка библиотеки...
            </div>
        );
    }
    
    if (records.length === 0) {
        return (
            <div className="text-center py-8 text-txt-secondary">
                <p>Ваша библиотека пуста. Сгенерируйте первую запись!</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-lg mx-auto p-4">
            <h2 className="text-xl font-bold mb-4 text-white">Ваша Библиотека</h2>
            <div className="space-y-3">
                {records.map((record) => {
                    const isCurrent = record.audioUrl === currentUrl;
                    const isOwner = record.userId === userId;

                    return (
                        <div 
                            key={record.id} 
                            className={`flex items-center justify-between p-3 rounded-xl transition-all duration-200 ${isCurrent ? 'bg-accent-neon/20 border border-accent-neon' : 'bg-gray-800/50 border border-gray-700'}`}
                        >
                            {/* 1. Информация о записи */}
                            <div className="flex-1 min-w-0 pr-4">
                                <p className="text-sm font-semibold text-white truncate">{record.text.substring(0, 50)}...</p>
                                <p className="text-xs text-txt-secondary mt-1">
                                    {formatDate(record.createdAt)} 
                                    {isOwner ? ' (Вы)' : ''}
                                </p>
                            </div>

                            {/* 2. Элементы управления */}
                            <div className="flex items-center space-x-2">
                                {/* Кнопка Воспроизведения/Паузы/Стоп */}
                                <button
                                    className={`p-2 rounded-full transition-colors duration-200 ${isCurrent && isPlaying ? 'bg-red-500/30 text-red-400 hover:bg-red-500/50' : 'bg-accent-neon/30 text-accent-neon hover:bg-accent-neon/50'}`}
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

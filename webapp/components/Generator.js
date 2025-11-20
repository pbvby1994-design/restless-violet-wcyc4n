import React, { useState, useCallback } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { Loader2 } from 'lucide-react'; // Импорт иконки загрузки

/**
 * Компонент генерации речи из текста.
 * Отправляет текст на FastAPI бэкенд и обрабатывает потоковый аудио-ответ.
 */
const Generator = () => {
    // 1. Состояния и контекст
    const [text, setText] = useState(''); 
    const [localError, setLocalError] = useState(null); // Локальная ошибка
    
    const { 
        isLoading, 
        setIsLoading, 
        setError, // Глобальная ошибка плеера
        setAudioUrl, 
        resetPlayer,
    } = usePlayer();
    
    // 🛑 ИСПРАВЛЕНИЕ: Объявление переменной, которой не хватало (причина ReferenceError)
    const isGenerateDisabled = text.trim().length === 0 || isLoading;

    /**
     * Обрабатывает генерацию речи и получение аудио с бэкенда.
     */
    const handleGenerateSpeech = useCallback(async () => {
        if (isGenerateDisabled) return;

        setIsLoading(true);
        setLocalError(null);
        setError(null);
        resetPlayer(); // Сброс плеера перед новой генерацией

        // 🎯 Vercel API Endpoint
        const VERCEL_API_URL = '/api/tts/generate'; 

        try {
            // 1. Отправляем запрос на наш Vercel Python API
            const response = await fetch(VERCEL_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: text }),
            });

            if (!response.ok) {
                // Если статус не 200, пытаемся прочитать ошибку из JSON
                let errorDetail = `Ошибка API: ${response.statusText}`;
                try {
                    const errorData = await response.json();
                    errorDetail = errorData.detail || errorDetail;
                } catch (e) {
                    // Игнорируем ошибку парсинга, если ответ не JSON
                }
                throw new Error(errorDetail);
            }

            // 2. Получаем аудио как Blob (FastAPI возвращает audio/mp3)
            const audioBlob = await response.blob();
            
            // 3. Создаем URL для Blob
            const audioUrl = URL.createObjectURL(audioBlob);

            // 4. Обновляем контекст плеера
            setAudioUrl(audioUrl); 
            
        } catch (e) {
            console.error('Ошибка при генерации аудио:', e);
            setLocalError(e.message || 'Произошла неизвестная ошибка при генерации.');
            setError('Не удалось сгенерировать аудио.');

        } finally {
            setIsLoading(false);
        }
    }, [text, isGenerateDisabled, setIsLoading, setError, setAudioUrl, resetPlayer]);

    /**
     * Очищает текстовое поле и сбрасывает плеер.
     */
    const handleClear = useCallback(() => {
        setText('');
        setLocalError(null);
        resetPlayer();
    }, [resetPlayer]);

    return (
        <div className="space-y-4">
            {/* 1. Поле ввода текста */}
            <div>
                <textarea
                    className="textarea-input h-32" 
                    placeholder="Введите текст, который нужно озвучить (до 5000 символов)..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    disabled={isLoading}
                    maxLength={5000}
                />
                <div className="text-right text-xs text-txt-muted mt-1">
                    {text.length} / 5000
                </div>
            </div>

            {/* 2. Кнопка Генерации */}
            <button
                className={`btn-primary w-full flex items-center justify-center ${isGenerateDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-neon-hover active:scale-[0.98]'}`}
                onClick={handleGenerateSpeech}
                disabled={isGenerateDisabled}
            >
                {isLoading ? (
                    <div className="flex items-center space-x-2">
                        <Loader2 className="animate-spin h-5 w-5 mr-2" /> 
                        <span>Генерация аудио...</span>
                    </div>
                ) : (
                    'Слушать Голосом'
                )}
            </button>
            
            {/* 3. Кнопка очистки */}
            <button
                className="w-full text-center text-txt-secondary hover:text-red-400 py-1 transition-colors duration-200"
                onClick={handleClear}
                disabled={isLoading}
            >
                Очистить Ввод
            </button>

            {/* 4. Сообщения об ошибках */}
            {localError && (
                <div className="p-3 bg-red-800/50 text-red-300 border border-red-500 rounded-lg">
                    Ошибка: {localError}
                </div>
            )}
        </div>
    );
};

export default Generator;

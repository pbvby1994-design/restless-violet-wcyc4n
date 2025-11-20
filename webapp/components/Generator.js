// Файл: webapp/components/Generator.js
import React, { useState, useCallback, useMemo } from 'react';
import { usePlayer } from '@/context/PlayerContext'; 
import { useAuth } from '@/context/AuthContext'; // ✅ ДОБАВЛЕНО: для доступа к userId, что потребуется в Приоритете 2
import { Loader2 } from 'lucide-react'; 

// --- API Configuration ---
// ✅ ИСПРАВЛЕНИЕ 1.2: Используем относительный путь для Vercel Route
const API_URL = '/api/tts/generate'; 

// --- Utility Functions for Audio Conversion ---
// Удалены: base64ToArrayBuffer и pcmToWav, так как бэкенд возвращает готовый MP3.


const Generator = () => {
    const { 
        setAudioUrl, 
        setError, 
        resetPlayer, 
        currentAudioUrl, 
        isPlaying,
    } = usePlayer();
    
    const { userId } = useAuth(); // Доступ к ID пользователя
    const [textInput, setTextInput] = useState('');
    const [isLoadingState, setIsLoadingState] = useState(false); // Локальный стейт для UI
    const [error, setErrorState] = useState(null); // Локальный стейт для ошибок
    
    // Мемоизированная проверка кнопки
    const isGenerateDisabled = useMemo(() => {
        return isLoadingState || textInput.trim().length === 0;
    }, [isLoadingState, textInput]);

    // Обработчик генерации речи
    const handleGenerateSpeech = useCallback(async () => {
        if (isGenerateDisabled) return;

        resetPlayer(); 
        setIsLoadingState(true);
        setErrorState(null);
        setError(null); 

        try {
            // 1. Отправка запроса на FastAPI бэкенд
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    text: textInput,
                    voice: 'ru-RU', 
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `Ошибка HTTP: ${response.status}`);
            }

            // 2. Получение данных как Blob (MP3 файл)
            const audioBlob = await response.blob();
            
            // 3. Создание URL для воспроизведения
            const audioUrl = URL.createObjectURL(audioBlob);

            // 4. Передача URL в PlayerContext для воспроизведения
            setAudioUrl(audioUrl); 

            // TODO Приоритет 2.1: Логика сохранения в Firebase Storage и Firestore.

        } catch (e) {
            console.error('Generation Error:', e.message);
            setErrorState(e.message);
        } finally {
            setIsLoadingState(false);
        }
    }, [textInput, resetPlayer, setAudioUrl, setError, isGenerateDisabled]);


    // Очистка ввода
    const handleClear = useCallback(() => {
        setTextInput('');
        resetPlayer();
    }, [resetPlayer]);

    
    return (
        <div className="flex flex-col space-y-4">
            {/* Поле ввода текста */}
            <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Введите текст для озвучивания (до 5000 символов)..."
                rows={8}
                maxLength={5000}
                className="textarea-input"
                disabled={isLoadingState}
            />

            {/* Счетчик символов */}
            <div className="text-right text-sm text-txt-muted">
                {textInput.length} / 5000
            </div>

            {/* Кнопка генерации */}
            <button
                className={`btn-primary w-full flex items-center justify-center`}
                onClick={handleGenerateSpeech}
                disabled={isGenerateDisabled}
            >
                {isLoadingState ? (
                    <div className="flex items-center space-x-2">
                        <Loader2 className="animate-spin h-5 w-5 mr-2" /> 
                        <span>Генерация аудио...</span>
                    </div>
                ) : (
                    'Слушать Голосом'
                )}
            </button>
            
            {/* Кнопка очистки */}
            <button
                className="w-full text-center text-txt-secondary hover:text-red-400 py-1 transition-colors duration-200"
                onClick={handleClear}
                disabled={isLoadingState}
            >
                Очистить Ввод
            </button>

            {/* Сообщения об ошибках и статусе */}
            {error && (
                <div className="p-3 bg-red-800/50 text-red-300 border border-red-500 rounded-lg">
                    Ошибка: {error}
                </div>
            )}
            
            {currentAudioUrl && !isPlaying && !isLoadingState && (
                <div className="p-3 bg-green-800/50 text-green-300 border border-green-500 rounded-lg">
                    Аудио успешно сгенерировано. Нажмите Play для прослушивания.
                </div>
            )}
        </div>
    );
};

export default Generator;

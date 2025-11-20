import React, { useState, useCallback, useMemo } from 'react';
import { usePlayer } from '@/context/PlayerContext'; 
import { useAuth } from '@/context/AuthContext'; 
import { Loader2, Save } from 'lucide-react'; 

// Импорт Firebase Firestore и Storage
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'; 
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'; // ✅ ДОБАВЛЕНО
import { nanoid } from 'nanoid'; 

// --- API Configuration ---
const API_URL = '/api/tts/generate'; 

const Generator = () => {
    const { 
        setAudioUrl, 
        setError, 
        resetPlayer, 
        currentAudioUrl, 
        isPlaying,
        duration, 
    } = usePlayer();
    
    // ✅ Получаем DB, Storage и UserID
    const { db, storage, userId, isAuthReady } = useAuth(); 
    
    const [textInput, setTextInput] = useState('');
    const [isLoadingState, setIsLoadingState] = useState(false); 
    const [isSaving, setIsSaving] = useState(false); 
    const [error, setErrorState] = useState(null); 
    const [generatedBlob, setGeneratedBlob] = useState(null); 
    
    // ... (isGenerateDisabled)

    // Проверка кнопки сохранения
    const isSaveDisabled = useMemo(() => {
        // Проверяем наличие Storage
        return !generatedBlob || isLoadingState || isSaving || !db || !storage || !isAuthReady;
    }, [generatedBlob, isLoadingState, isSaving, db, storage, isAuthReady]);

    // ✅ ФУНКЦИЯ СОХРАНЕНИЯ В FIREBASE (Приоритет 2.1)
    const saveAudioToFirebase = useCallback(async (blob, text, audioDuration) => {
        if (!db || !storage || !userId || !blob) {
            setErrorState("Система сохранения не инициализирована.");
            return;
        }

        setIsSaving(true);
        setErrorState(null);
        // Используем nanoid для уникального ID, который будет общим для Firestore и Storage
        const recordId = nanoid(); 

        try {
            // 1. Сохранение в Firebase Storage
            const storagePath = `users/${userId}/tts/${recordId}.mp3`;
            const storageRef = ref(storage, storagePath);
            
            // Загрузка Blob'а
            const snapshot = await uploadBytes(storageRef, blob, { contentType: 'audio/mp3' });
            // Получение публичного URL (доступ к файлу будет контролироваться правилами)
            const audioUrl = await getDownloadURL(snapshot.ref);

            // 2. Сохранение метаданных в Firestore
            const libraryCollectionRef = collection(db, `users/${userId}/library`);
            await addDoc(libraryCollectionRef, {
                userId: userId,
                text: text.substring(0, 5000), 
                audioUrl: audioUrl,
                duration: audioDuration, // ✅ Приоритет 2.2: Сохраняем длительность
                createdAt: serverTimestamp(),
            });

            setErrorState("Аудио успешно сохранено в Библиотеке!");
            setGeneratedBlob(null); 
            
        } catch (e) {
            console.error('Save Error:', e);
            setErrorState(`Ошибка сохранения: ${e.message}`);
        } finally {
            setIsSaving(false);
        }
    }, [db, storage, userId]);


    // Обработчик генерации речи (без изменений, кроме вызова resetPlayer и сохранения Blob)
    const handleGenerateSpeech = useCallback(async () => {
        if (isGenerateDisabled) return;

        resetPlayer(); 
        setIsLoadingState(true);
        setErrorState(null);
        setError(null); 
        setGeneratedBlob(null); 

        let currentBlob = null;

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: textInput, voice: 'ru-RU' }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `Ошибка HTTP: ${response.status}`);
            }

            currentBlob = await response.blob();
            setGeneratedBlob(currentBlob); 
            
            const audioUrl = URL.createObjectURL(currentBlob);
            setAudioUrl(audioUrl); 

        } catch (e) {
            console.error('Generation Error:', e.message);
            setErrorState(e.message);
        } finally {
            setIsLoadingState(false);
        }
    }, [textInput, resetPlayer, setAudioUrl, setError, isGenerateDisabled]);


    // ✅ ОБРАБОТЧИК СОХРАНЕНИЯ (Приоритет 2.3)
    const handleSave = useCallback(() => {
        if (isSaveDisabled) return;
        saveAudioToFirebase(generatedBlob, textInput, duration);
    }, [isSaveDisabled, generatedBlob, textInput, duration, saveAudioToFirebase]);

    // ... (handleClear и JSX остаются прежними)

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
                disabled={isLoadingState || isSaving}
            />

            {/* Счетчик символов */}
            <div className="text-right text-sm text-txt-muted">
                {textInput.length} / 5000
            </div>

            {/* Блок с кнопками Генерации и Сохранения */}
            <div className='flex space-x-2'>
                {/* Кнопка генерации */}
                <button
                    className={`btn-primary flex-1 flex items-center justify-center`}
                    onClick={handleGenerateSpeech}
                    disabled={isGenerateDisabled}
                >
                    {isLoadingState ? (
                        <div className="flex items-center space-x-2">
                            <Loader2 className="animate-spin h-5 w-5 mr-2" /> 
                            <span>Генерация...</span>
                        </div>
                    ) : (
                        'Слушать Голосом'
                    )}
                </button>

                {/* ✅ Кнопка Сохранения (Приоритет 2.3) */}
                <button
                    className={`btn-primary w-16 flex-shrink-0 flex items-center justify-center transition-colors duration-200 ${
                        isSaveDisabled 
                            ? 'bg-txt-muted/30 cursor-not-allowed' 
                            : 'bg-green-600 hover:bg-green-700'
                    }`}
                    onClick={handleSave}
                    disabled={isSaveDisabled}
                    title="Сохранить в Библиотеку (Firebase Storage)"
                >
                    {isSaving ? (
                        <Loader2 className="animate-spin h-5 w-5" />
                    ) : (
                        <Save className="h-5 w-5" />
                    )}
                </button>
            </div>
            
            {/* Кнопка очистки */}
            <button
                className="w-full text-center text-txt-secondary hover:text-red-400 py-1 transition-colors duration-200"
                onClick={handleClear}
                disabled={isLoadingState || isSaving}
            >
                Очистить Ввод
            </button>

            {/* Сообщения об ошибках и статусе */}
            {error && (
                <div className="p-3 bg-red-800/50 text-red-300 border border-red-500 rounded-lg">
                    Ошибка: {error}
                </div>
            )}
            
            {generatedBlob && !isPlaying && !isLoadingState && !isSaving && (
                <div className="p-3 bg-green-800/50 text-green-300 border border-green-500 rounded-lg">
                    Аудио готово. Нажмите "Сохранить" или перейдите на другую вкладку.
                </div>
            )}
        </div>
    );
};

export default Generator;

import React, { useState, useCallback } from 'react';
import { Activity } from 'lucide-react'; 

// ВАЖНО: apiKey ДОЛЖЕН быть пустой строкой, чтобы среда Canvas могла автоматически подставить ключ во время выполнения.
const apiKey = ""; 
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent";

// --- Вспомогательные функции для обработки аудио ---
// Эти функции необходимы для преобразования сырых данных PCM в воспроизводимый браузером формат WAV.

/**
 * Преобразует строку base64 в ArrayBuffer.
 * @param {string} base64 - Строка base64.
 * @returns {ArrayBuffer}
 */
const base64ToArrayBuffer = (base64) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
};

/**
 * Преобразует сырые 16-битные PCM-данные в WAV Blob.
 * @param {Int16Array} pcmData - Сырые 16-битные PCM-данные.
 * @param {number} sampleRate - Частота дискретизации аудио.
 * @returns {Blob}
 */
const pcmToWav = (pcmData, sampleRate) => {
    const numChannels = 1;
    const bitsPerSample = 16;
    const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
    const blockAlign = numChannels * (bitsPerSample / 8);
    
    const buffer = new ArrayBuffer(44 + pcmData.byteLength);
    const view = new DataView(buffer);

    // Заголовок RIFF
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + pcmData.byteLength, true); 
    writeString(view, 8, 'WAVE');

    // Заголовок FMT
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); 
    view.setUint16(20, 1, true); 
    view.setUint16(22, numChannels, true); 
    view.setUint32(24, sampleRate, true); 
    view.setUint32(28, byteRate, true); 
    view.setUint16(32, blockAlign, true); 
    view.setUint16(34, bitsPerSample, true); 

    // Заголовок DATA
    writeString(view, 36, 'data');
    view.setUint32(40, pcmData.byteLength, true); 

    // Запись PCM-данных
    let offset = 44;
    for (let i = 0; i < pcmData.length; i++, offset += 2) {
        view.setInt16(offset, pcmData[i], true);
    }

    return new Blob([view], { type: 'audio/wav' });
};

/** Помощник для записи строки в DataView */
const writeString = (view, offset, string) => {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
};


// --- Логика TTS с экспоненциальной задержкой (для надежности API) ---

const fetchWithBackoff = async (url, options, maxRetries = 3) => {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url, options);
            if (response.ok) {
                return response;
            } else {
                // Обработка ошибок сервера и других сбоев
                throw new Error(`API вернул статус ${response.status}`);
            }
        } catch (error) {
            console.log(`Попытка ${i + 1} не удалась: ${error.message}`);
            if (i < maxRetries - 1) {
                const delay = Math.pow(2, i) * 1000 + Math.random() * 500;
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                throw error; 
            }
        }
    }
};

const generateAudio = async (text, setAudioUrl, setIsLoading, setError) => {
    setIsLoading(true);
    setError(null);
    setAudioUrl(null);

    const payload = {
        contents: [{
            parts: [{ text: text }]
        }],
        generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
                // Голос Kore
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: "Kore" }
                }
            }
        },
        model: "gemini-2.5-flash-preview-tts"
    };

    try {
        const fullApiUrl = `${API_URL}?key=${apiKey}`;

        const response = await fetchWithBackoff(fullApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        const part = result?.candidates?.[0]?.content?.parts?.[0];
        const audioData = part?.inlineData?.data;
        const mimeType = part?.inlineData?.mimeType;

        if (audioData && mimeType && mimeType.startsWith("audio/L16")) {
            const rateMatch = mimeType.match(/rate=(\d+)/);
            const sampleRate = rateMatch ? parseInt(rateMatch[1], 10) : 24000; 

            const pcmData = base64ToArrayBuffer(audioData);
            const pcm16 = new Int16Array(pcmData);
            
            const wavBlob = pcmToWav(pcm16, sampleRate);
            const url = URL.createObjectURL(wavBlob);
            setAudioUrl(url);

        } else {
            setError("Не удалось сгенерировать аудио или неверный формат ответа.");
            console.error("Ошибка ответа API:", result);
        }

    } catch (err) {
        if (err.message.includes('403')) {
            setError("Доступ запрещен (403). Убедитесь, что ваш ключ API действителен и активирован для TTS.");
        } else {
            setError(`Ошибка генерации аудио: ${err.message}`);
        }
    } finally {
        setIsLoading(false);
    }
};


// --- React Компонент Страницы (замена App на TtsApp) ---

const TtsApp = () => {
    const [text, setText] = useState("Привет, это демонстрация сервиса преобразования текста в речь от Gemini API.");
    const [audioUrl, setAudioUrl] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleGenerate = useCallback(() => {
        if (!text.trim()) {
            // Используем пользовательский элемент UI вместо alert()
            setError("Пожалуйста, введите текст для синтеза."); 
            return;
        }
        generateAudio(text, setAudioUrl, setIsLoading, setError);
    }, [text]);

    // В Next.js корневой элемент <div /> будет обернут в _app.js и body. 
    // Используем классы Tailwind из вашего `tailwind.config.js` и `globals.css`
    return (
        <div className="flex flex-col items-center p-4 sm:p-8 min-h-screen bg-bg-default text-txt-primary">
            <h1 className="text-3xl font-bold mb-6 text-accent-neon">Демонстрация Gemini TTS</h1>
            <div className="w-full max-w-lg card-glass p-6 space-y-4">
                
                {/* Поле ввода текста */}
                <div className="relative">
                    <textarea
                        className="textarea-input h-32"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Введите текст для преобразования в речь..."
                    />
                    <p className="text-right text-sm text-txt-secondary mt-1">
                        {text.length} символов
                    </p>
                </div>

                {/* Кнопка генерации */}
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !text.trim()}
                    className="app-button"
                >
                    {isLoading ? (
                        <div className="flex items-center space-x-2">
                            <Activity className="h-5 w-5 animate-pulse" />
                            <span>Генерация аудио...</span>
                        </div>
                    ) : (
                        <span>Синтезировать речь</span>
                    )}
                </button>

                {/* Отображение ошибки */}
                {error && (
                    <div className="bg-red-900/50 border border-red-700 text-red-300 p-3 rounded-lg">
                        <p className="font-medium">Ошибка:</p>
                        <p className="text-sm">{error}</p>
                    </div>
                )}

                {/* Аудиоплеер */}
                {audioUrl && (
                    <div className="space-y-2 pt-4">
                        <h2 className="text-lg font-semibold text-txt-secondary">Воспроизведение:</h2>
                        <audio 
                            controls 
                            src={audioUrl} 
                            className="w-full rounded-lg bg-bg-glass p-2 border border-accent-neon/50"
                        />
                    </div>
                )}
            </div>
            
            <footer className="mt-8 text-xs text-txt-muted text-center max-w-lg">
                <p>Если вы видите ошибки, связанные с API, убедитесь, что в файле используется пустой ключ API (`const apiKey = "";`), чтобы разрешить системе Canvas автоматически подставить необходимый токен.</p>
            </footer>
        </div>
    );
};

export default TtsApp;

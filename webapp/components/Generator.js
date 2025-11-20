// Файл: webapp/components/Generator.js
import React, { useState, useCallback } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { Loader2 } from 'lucide-react'; // Импорт иконки загрузки

// --- API Configuration ---
// Используем пустой API_KEY, который будет предоставлен средой Canvas.
const API_KEY = ""; 
// Для стабильности, если среда не предоставит ключ, используем заглушку, 
// но в Canvas она всегда будет заменена.
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${API_KEY}`;


// --- Utility Functions for Audio Conversion (Unchanged, necessary for TTS) ---
// Вспомогательные функции для преобразования Base64 PCM в WAV
function base64ToArrayBuffer(base64) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

function pcmToWav(pcm16, sampleRate) {
    const numChannels = 1;
    const bytesPerSample = 2;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;

    const dataLength = pcm16.length * bytesPerSample;
    const buffer = new ArrayBuffer(44 + dataLength);
    const view = new DataView(buffer);

    // RIFF identifier 'RIFF'
    writeString(view, 0, 'RIFF');
    // RIFF chunk length
    view.setUint32(4, 36 + dataLength, true);
    // 'WAVE' format
    writeString(view, 8, 'WAVE');
    // 'fmt ' sub-chunk
    writeString(view, 12, 'fmt ');
    // Sub-chunk size (16 for PCM)
    view.setUint32(16, 16, true);
    // Audio format (1 for PCM)
    view.setUint16(20, 1, true);
    // Number of channels
    view.setUint16(22, numChannels, true);
    // Sample rate
    view.setUint32(24, sampleRate, true);
    // Byte rate
    view.setUint32(28, byteRate, true);
    // Block align
    view.setUint16(32, blockAlign, true);
    // Bits per sample (16)
    view.setUint16(34, 16, true);
    // 'data' sub-chunk
    writeString(view, 36, 'data');
    // Sub-chunk size
    view.setUint32(40, dataLength, true);

    // Write PCM data
    let offset = 44;
    for (let i = 0; i < pcm16.length; i++, offset += bytesPerSample) {
        view.setInt16(offset, pcm16[i], true);
    }

    return new Blob([buffer], { type: 'audio/wav' });
}

function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}
// ---------------------------------------------


const Generator = () => {
    // Деструктурируем только необходимые данные
    const { updateTextToSpeak } = usePlayer(); 
    
    // Инициализация состояний
    const [prompt, setPrompt] = useState('Привет, это тестовое сообщение для приложения Text-to-Speech.');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [speechUrl, setSpeechUrl] = useState(null);
    
    // Для текстового поля, чтобы показать лимит символов
    const MAX_CHARS = 5000;

    // Функция для очистки ввода
    const handleClear = useCallback(() => {
        setPrompt('');
        setError(null);
        setSpeechUrl(null);
        // Опционально: остановить воспроизведение, если оно идет
        if (typeof window !== 'undefined' && window.audioPlayer) {
            window.audioPlayer.pause();
        }
    }, []);

    // Обработчик генерации речи
    const handleGenerateSpeech = useCallback(async () => {
        if (!prompt || isLoading || prompt.length > MAX_CHARS) return;

        setIsLoading(true);
        setError(null);
        setSpeechUrl(null); 

        // Определяем payload для TTS
        const payload = {
            contents: [{
                parts: [{ text: prompt }]
            }],
            generationConfig: {
                responseModalities: ["AUDIO"],
                speechConfig: {
                    // Используем голос, подходящий для русского языка или общий
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: "Kore" } 
                    }
                }
            },
            model: "gemini-2.5-flash-preview-tts"
        };
        
        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts) {
            try {
                // Если API_KEY пуст, Canvas заменит его во время выполнения.
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                
                if (!response.ok) {
                    throw new Error(`API returned status ${response.status}`);
                }

                const result = await response.json();
                const part = result?.candidates?.[0]?.content?.parts?.[0];
                const audioData = part?.inlineData?.data;
                const mimeType = part?.inlineData?.mimeType;

                if (audioData && mimeType && mimeType.startsWith("audio/")) {
                    const rateMatch = mimeType.match(/rate=(\d+)/);
                    const sampleRate = rateMatch ? parseInt(rateMatch[1], 10) : 24000;
                    
                    const pcmData = base64ToArrayBuffer(audioData);
                    const pcm16 = new Int16Array(pcmData);
                    const wavBlob = pcmToWav(pcm16, sampleRate);
                    const newAudioUrl = URL.createObjectURL(wavBlob);
                    
                    updateTextToSpeak(prompt);
                    setSpeechUrl(newAudioUrl);
                    
                    // Воспроизведение аудио
                    if (typeof window !== 'undefined') {
                         if (window.audioPlayer) {
                             window.audioPlayer.pause();
                             window.audioPlayer.src = newAudioUrl;
                         } else {
                             window.audioPlayer = new Audio(newAudioUrl);
                         }
                         window.audioPlayer.play();
                    }

                    setIsLoading(false);
                    return;
                } else {
                    throw new Error("Invalid audio data received from API.");
                }
            } catch (err) {
                console.error(`Attempt ${attempts + 1} failed:`, err);
                attempts++;
                if (attempts < maxAttempts) {
                    await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempts - 1)));
                } else {
                    setError(`Ошибка генерации речи: ${err.message}`);
                }
            }
        }
        setIsLoading(false);
    }, [prompt, isLoading, updateTextToSpeak]);

    // Определяем, активна ли кнопка "Генерировать"
    const isGenerateDisabled = isLoading || prompt.length === 0 || prompt.length > MAX_CHARS;

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold text-txt-primary">Генератор речи</h2>
            <p className="text-txt-secondary text-sm">Введите текст, который хотите озвучить. Используйте естественный язык для контроля тона (например, "Скажи радостно: ...").</p>
            
            <textarea
                className="textarea-input h-32"
                placeholder="Введите текст здесь..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isLoading}
            />
            
            {/* Статус и лимит символов */}
            <div className="flex justify-between items-center text-xs">
                <span className={`transition-colors duration-200 ${prompt.length > MAX_CHARS ? 'text-red-500 font-bold' : 'text-txt-secondary'}`}>
                    {prompt.length} / {MAX_CHARS} символов
                </span>
                <span className="text-txt-secondary">
                    Голос: По умолчанию (Kore)
                </span>
            </div>

            {/* Кнопка генерации (Исправлено: используется класс btn-primary) */}
            <button
                className={`btn-primary w-full flex items-center justify-center`}
                onClick={handleGenerateSpeech}
                disabled={isGenerateDisabled}
            >
                {isLoading ? (
                    <div className="flex items-center space-x-2">
                        {/* Используем mr-2 для отступа иконки */}
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
                disabled={isLoading}
            >
                Очистить Ввод
            </button>

            {/* Сообщения об ошибках и статусе */}
            {error && (
                <div className="p-3 bg-red-800/50 text-red-300 border border-red-500 rounded-lg">
                    Ошибка: {error}
                </div>
            )}
            
            {speechUrl && !isLoading && (
                <div className="p-3 bg-green-800/50 text-green-300 border border-green-500 rounded-lg">
                    Аудио успешно сгенерировано и воспроизводится.
                </div>
            )}
        </div>
    );
};

export default Generator;

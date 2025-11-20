// Файл: webapp/components/Generator.js
import React, { useState, useCallback } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { Loader2 } from 'lucide-react'; // Используем lucide-react для иконок

// --- API Configuration ---
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=`;
const API_KEY = ""; // Canvas runtime provides this

// --- Utility Functions for Audio Conversion ---
// (Взято из инструкции, необходимо для декодирования PCM в WAV)
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
    const { updateTextToSpeak, themeParams, isWebAppReady } = usePlayer();
    const [prompt, setPrompt] = useState('Hello, this is a test of the Telegram Mini App Text-to-Speech generator.');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [speechUrl, setSpeechUrl] = useState(null);
    
    // Получаем цвет кнопки из темы TWA или используем заглушку Tailwind
    const buttonColor = themeParams?.button_color || '#B06EFF';

    const handleGenerateSpeech = useCallback(async () => {
        if (!prompt || isLoading) return;

        setIsLoading(true);
        setError(null);
        setSpeechUrl(null); // Сброс предыдущего URL

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
                const response = await fetch(`${API_URL}${API_KEY}`, {
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
                    // Извлечение sample rate из mimeType (e.g., audio/L16;rate=24000)
                    const rateMatch = mimeType.match(/rate=(\d+)/);
                    const sampleRate = rateMatch ? parseInt(rateMatch[1], 10) : 24000;
                    
                    const pcmData = base64ToArrayBuffer(audioData);
                    const pcm16 = new Int16Array(pcmData);
                    const wavBlob = pcmToWav(pcm16, sampleRate);
                    const newAudioUrl = URL.createObjectURL(wavBlob);
                    
                    // Обновляем контекст плеера для воспроизведения
                    updateTextToSpeak(prompt);
                    setSpeechUrl(newAudioUrl);
                    
                    // Немедленное воспроизведение
                    const audio = new Audio(newAudioUrl);
                    audio.play();

                    setIsLoading(false);
                    return;
                } else {
                    throw new Error("Invalid audio data received from API.");
                }
            } catch (err) {
                console.error(`Attempt ${attempts + 1} failed:`, err);
                attempts++;
                if (attempts < maxAttempts) {
                    // Экспоненциальная задержка
                    await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempts - 1)));
                } else {
                    setError(`Failed to generate speech after ${maxAttempts} attempts: ${err.message}`);
                }
            }
        }
        setIsLoading(false);
    }, [prompt, isLoading, updateTextToSpeak]);

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold text-txt-primary">Сгенерировать речь</h2>
            <p className="text-txt-secondary text-sm">Введите текст, который хотите озвучить. Используйте естественный язык для контроля тона (например, "Скажи радостно: ...").</p>
            
            <textarea
                className="textarea-input h-32"
                placeholder="Введите текст здесь..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isLoading}
            />

            {/* Кнопка генерации */}
            <button
                className={`button-neon w-full flex items-center justify-center font-bold py-3 px-4 rounded-xl transition-all duration-200 shadow-neon text-txt-primary ${
                    isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:opacity-90'
                }`}
                style={{ backgroundColor: buttonColor }}
                onClick={handleGenerateSpeech}
                disabled={isLoading}
            >
                {isLoading ? (
                    <div className="flex items-center space-x-2">
                        <Loader2 className="animate-spin h-5 w-5 mr-3" />
                        <span>Генерация аудио...</span>
                    </div>
                ) : (
                    'Сгенерировать и Воспроизвести Речь'
                )}
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

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Activity, Mic, Volume2, Loader, X, Zap } from 'lucide-react'; 

// ВАЖНО: apiKey ДОЛЖЕН быть пустой строкой, чтобы среда Canvas могла автоматически подставить ключ во время выполнения.
const apiKey = ""; 
const TTS_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent";

// --- Вспомогательные функции для аудио (TTS) ---

const base64ToArrayBuffer = (base64) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
};

const writeString = (view, offset, string) => {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
};

const pcmToWav = (pcmData, sampleRate) => {
    const numChannels = 1;
    const bitsPerSample = 16;
    const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
    const blockAlign = numChannels * (bitsPerSample / 8);
    
    const buffer = new ArrayBuffer(44 + pcmData.byteLength);
    const view = new DataView(buffer);

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + pcmData.byteLength, true); 
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); 
    view.setUint16(20, 1, true); 
    view.setUint16(22, numChannels, true); 
    view.setUint32(24, sampleRate, true); 
    view.setUint32(28, byteRate, true); 
    view.setUint16(32, blockAlign, true); 
    view.setUint16(34, bitsPerSample, true); 
    writeString(view, 36, 'data');
    view.setUint32(40, pcmData.byteLength, true); 

    let offset = 44;
    for (let i = 0; i < pcmData.length; i++, offset += 2) {
        view.setInt16(offset, pcmData[i], true);
    }

    return new Blob([view], { type: 'audio/wav' });
};

// --- Логика API TTS с экспоненциальной задержкой ---

const fetchWithBackoff = async (url, options, maxRetries = 3) => {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url, options);
            if (response.ok) {
                return response;
            } else {
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
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: "Kore" }
                }
            }
        },
        model: "gemini-2.5-flash-preview-tts"
    };

    try {
        const fullApiUrl = `${TTS_API_URL}?key=${apiKey}`;

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
            setError("Ошибка TTS: Доступ запрещен (403). Проверьте ключ API.");
        } else {
            setError(`Ошибка TTS: ${err.message}`);
        }
    } finally {
        setIsLoading(false);
    }
};

// --- Web Speech API для STT (Преобразование речи в текст) ---
// Инициализация перенесена в useEffect, чтобы избежать ошибки "window is not defined".

const SpeechUtilityApp = () => {
    // Состояние для TTS (Text-to-Speech)
    const [ttsText, setTtsText] = useState("Привет, это демонстрация сервиса преобразования текста в речь.");
    const [audioUrl, setAudioUrl] = useState(null);
    const [isTtsLoading, setIsTtsLoading] = useState(false);
    const [ttsError, setTtsError] = useState(null);

    // Состояние для STT (Speech-to-Text)
    const [sttText, setSttText] = useState("");
    const [isListening, setIsListening] = useState(false);
    const [sttError, setSttError] = useState(null);
    
    // Рефы для хранения конструктора и экземпляра, доступных только в браузере
    const recognitionRef = useRef(null);
    const SpeechRecognitionConstructorRef = useRef(null); 

    // Инициализация Web Speech API (выполняется только на стороне клиента)
    useEffect(() => {
        // Проверка наличия объекта window (исключает SSR)
        if (typeof window !== 'undefined') {
            // Безопасное получение конструктора
            SpeechRecognitionConstructorRef.current = window.SpeechRecognition || window.webkitSpeechRecognition;
        }

        if (SpeechRecognitionConstructorRef.current) {
            const SpeechRecognition = SpeechRecognitionConstructorRef.current;
            const recognition = new SpeechRecognition();
            
            recognition.continuous = false; 
            recognition.interimResults = true; 
            recognition.lang = 'ru-RU'; 
            
            recognition.onresult = (event) => {
                let finalTranscript = '';
                // Собираем весь распознанный текст
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript + ' ';
                    }
                }
                
                if (finalTranscript.trim()) {
                    // Обновляем текст только финальными результатами
                    setSttText(prev => prev + finalTranscript);
                }
            };
            
            recognition.onerror = (event) => {
                console.error("STT Error:", event.error);
                setSttError(`Ошибка распознавания: ${event.error}. Убедитесь, что микрофон доступен.`);
                setIsListening(false);
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current = recognition;
        } else {
            setSttError("Ваш браузер не поддерживает Web Speech API для STT.");
        }

        // Очистка при размонтировании
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []); // Запускается один раз при монтировании компонента

    const startListening = () => {
        if (!SpeechRecognitionConstructorRef.current) {
            setSttError("STT недоступен в этом браузере.");
            return;
        }
        if (recognitionRef.current && !isListening) {
            setSttError(null);
            // Добавляем пробел, чтобы новый распознанный текст не прилипал к старому
            if (sttText.trim() && !sttText.endsWith(' ')) {
                 setSttText(prev => prev + ' ');
            }
            setIsListening(true);
            recognitionRef.current.start();
        }
    };

    const stopListening = () => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    };

    const handleGenerateTts = useCallback(() => {
        if (!ttsText.trim()) {
            setTtsError("Пожалуйста, введите текст для синтеза.");
            return;
        }
        generateAudio(ttsText, setAudioUrl, setIsTtsLoading, setTtsError);
    }, [ttsText]);

    // Копирование текста (Используем console.log вместо alert)
    const handleCopyText = () => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(sttText)
                .then(() => console.log('Текст скопирован!')) 
                .catch(err => console.error('Ошибка копирования:', err));
        } else {
            console.error('API буфера обмена недоступен.');
        }
    };


    return (
        <div className="flex flex-col items-center p-4 sm:p-8 min-h-screen bg-bg-default text-txt-primary">
            <h1 className="text-3xl font-bold mb-6 text-accent-neon flex items-center">
                <Zap className="w-6 h-6 mr-3 text-accent-light" />
                Speech Utility
            </h1>

            <div className="w-full max-w-lg space-y-8">
                
                {/* --- БЛОК 1: SPEECH-TO-TEXT (STT) --- */}
                <div className="card-glass p-6 space-y-4">
                    <h2 className="text-xl font-semibold text-txt-primary flex items-center">
                        <Mic className="w-5 h-5 mr-2 text-txt-secondary" /> Речь в Текст (STT)
                    </h2>
                    
                    {/* Вывод распознанного текста */}
                    <textarea
                        className={`textarea-input h-32 ${isListening ? 'border-red-500' : ''}`}
                        value={sttText}
                        onChange={(e) => setSttText(e.target.value)}
                        placeholder="Распознанный текст появится здесь..."
                        // При записи пользователь не должен редактировать текст
                        disabled={isListening} 
                    />
                    
                    {/* Кнопки записи и очистки */}
                    <div className="flex space-x-3">
                        <button
                            onClick={isListening ? stopListening : startListening}
                            disabled={!SpeechRecognitionConstructorRef.current}
                            className={`flex-1 flex justify-center items-center px-4 py-3 rounded-xl font-semibold transition-all duration-300 ${
                                isListening 
                                    ? 'bg-red-700 hover:bg-red-600 shadow-neon-red animate-pulse' 
                                    : 'bg-accent-neon hover:bg-accent-light shadow-neon'
                            }`}
                        >
                            {isListening ? (
                                <div className="flex items-center space-x-2">
                                    <Loader className="w-5 h-5 animate-spin" />
                                    <span>Слушаю... Нажмите, чтобы остановить</span>
                                </div>
                            ) : (
                                <div className="flex items-center space-x-2">
                                    <Mic className="w-5 h-5" />
                                    <span>Начать запись</span>
                                </div>
                            )}
                        </button>

                        <button
                            onClick={() => setSttText('')}
                            className="p-3 bg-bg-glass hover:bg-bg-card border border-txt-muted/50 rounded-xl transition-all duration-300"
                            title="Очистить текст"
                        >
                            <X className="w-5 h-5 text-txt-secondary" />
                        </button>
                    </div>

                    {sttError && (
                        <div className="bg-red-900/50 border border-red-700 text-red-300 p-3 rounded-lg text-sm">
                            <p className="font-medium">Ошибка STT:</p>
                            <p>{sttError}</p>
                            <p className="mt-1 text-xs">
                                Попробуйте использовать браузер Chrome или Edge.
                            </p>
                        </div>
                    )}
                </div>


                {/* --- БЛОК 2: TEXT-TO-SPEECH (TTS) --- */}
                <div className="card-glass p-6 space-y-4">
                    <h2 className="text-xl font-semibold text-txt-primary flex items-center">
                        <Volume2 className="w-5 h-5 mr-2 text-txt-secondary" /> Текст в Речь (TTS)
                    </h2>

                    {/* Поле ввода текста */}
                    <div className="relative">
                        <textarea
                            className="textarea-input h-32"
                            value={ttsText}
                            onChange={(e) => setTtsText(e.target.value)}
                            placeholder="Введите текст для преобразования в речь..."
                            disabled={isTtsLoading}
                        />
                        <p className="text-right text-sm text-txt-secondary mt-1">
                            {ttsText.length} символов
                        </p>
                    </div>

                    {/* Кнопка генерации */}
                    <button
                        onClick={handleGenerateTts}
                        disabled={isTtsLoading || !ttsText.trim()}
                        className="app-button"
                    >
                        {isTtsLoading ? (
                            <div className="flex items-center space-x-2">
                                <Activity className="h-5 w-5 animate-pulse" />
                                <span>Генерация аудио...</span>
                            </div>
                        ) : (
                            <span>Синтезировать речь</span>
                        )}
                    </button>

                    {/* Отображение ошибки TTS */}
                    {ttsError && (
                        <div className="bg-red-900/50 border border-red-700 text-red-300 p-3 rounded-lg text-sm">
                            <p className="font-medium">Ошибка TTS:</p>
                            <p>{ttsError}</p>
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
            </div>
            
            <footer className="mt-8 text-xs text-txt-muted text-center max-w-lg">
                <p>Функция "Речь в Текст" теперь инициализируется только на клиенте, чтобы избежать ошибок сборки Next.js.</p>
            </footer>
        </div>
    );
};

export default SpeechUtilityApp;

// Файл: webapp/components/MiniPlayer.js
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { Play, Pause, StopCircle } from 'lucide-react';

const MiniPlayer = () => {
    const { currentUrl, currentText, isPlaying, playSpeech, stopSpeech } = usePlayer();
    const [audioDuration, setAudioDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const audioRef = useRef(null);

    // Инициализация Audio Player
    useEffect(() => {
        if (typeof window !== 'undefined' && currentUrl) {
            // Используем глобальный audioPlayer, как определено в Generator.js
            if (!window.audioPlayer) {
                window.audioPlayer = new Audio();
            }
            audioRef.current = window.audioPlayer;

            const audio = audioRef.current;
            audio.src = currentUrl;
            
            // Загрузка метаданных (длительность)
            const handleLoadedMetadata = () => {
                setAudioDuration(audio.duration);
                setCurrentTime(0);
                if (isPlaying) {
                     // Убедимся, что воспроизведение начинается при смене URL
                     audio.play().catch(e => console.error("Play failed:", e)); 
                }
            };

            // Обновление текущего времени
            const handleTimeUpdate = () => {
                setCurrentTime(audio.currentTime);
            };

            // Воспроизведение завершено
            const handleEnded = () => {
                stopSpeech();
            };

            audio.addEventListener('loadedmetadata', handleLoadedMetadata);
            audio.addEventListener('timeupdate', handleTimeUpdate);
            audio.addEventListener('ended', handleEnded);

            return () => {
                // Очистка слушателей
                audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
                audio.removeEventListener('timeupdate', handleTimeUpdate);
                audio.removeEventListener('ended', handleEnded);
            };
        }
    }, [currentUrl, isPlaying, stopSpeech]);
    
    // Синхронизация между контекстом и элементом <audio>
    useEffect(() => {
        const audio = audioRef.current;
        if (audio) {
            if (isPlaying) {
                audio.play().catch(e => console.error("Play failed:", e));
            } else {
                audio.pause();
            }
        }
    }, [isPlaying]);

    // Форматирование времени в MM:SS
    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    // Обработчик нажатия на ползунок
    const handleSeek = useCallback((e) => {
        const seekTime = parseFloat(e.target.value);
        if (audioRef.current) {
            audioRef.current.currentTime = seekTime;
            setCurrentTime(seekTime);
        }
    }, []);

    // Если нет активного аудио, не отображаем плеер
    if (!currentUrl) {
        return null;
    }

    // Обработчик кнопки Play/Pause
    const handlePlayPause = () => {
        if (isPlaying) {
            stopSpeech();
        } else {
            // Воспроизводим текущий URL
            playSpeech(currentUrl, currentText); 
        }
    };
    
    // Вычисляем процент заполнения для прогресс-бара
    const progressPercent = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0;
    
    return (
        // Используем card-glass для стилизации
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-bg-default/90 backdrop-blur-sm border-t border-gray-700/50 shadow-2xl z-50">
            <div className="card-glass flex items-center p-3">
                
                {/* 1. Кнопка Play/Pause */}
                <button 
                    className="p-2 rounded-full bg-accent-neon text-white hover:bg-accent-light transition-colors duration-200 shadow-neon"
                    onClick={handlePlayPause}
                    title={isPlaying ? "Пауза" : "Воспроизвести"}
                >
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </button>
                
                <div className="flex-1 ml-3 min-w-0">
                    {/* 2. Текст и Эквалайзер (для визуального эффекта) */}
                    <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-txt-primary truncate font-semibold">
                            {currentText.length > 50 ? `${currentText.substring(0, 50)}...` : currentText}
                        </span>
                        {/* Эквалайзер, который появляется во время воспроизведения */}
                        {isPlaying && (
                            <div className="h-4 w-12 flex items-end ml-2">
                                <span className="bar" style={{height: '80%'}}></span>
                                <span className="bar" style={{height: '40%'}}></span>
                                <span className="bar" style={{height: '60%'}}></span>
                                <span className="bar" style={{height: '90%'}}></span>
                                <span className="bar" style={{height: '50%'}}></span>
                            </div>
                        )}
                    </div>

                    {/* 3. Прогресс-бар и Таймеры */}
                    <div className="flex items-center space-x-2">
                        <span className="text-xs text-txt-secondary flex-shrink-0">
                            {formatTime(currentTime)}
                        </span>
                        
                        <div className="flex-1 relative h-1.5 bg-gray-600 rounded-full cursor-pointer group">
                            {/* Скрытый input range для управления */}
                            <input
                                type="range"
                                min="0"
                                max={audioDuration}
                                value={currentTime}
                                onChange={handleSeek}
                                className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
                            />
                            {/* Видимый прогресс-бар */}
                            <div 
                                className="h-1.5 rounded-full bg-accent-neon transition-all duration-100" 
                                style={{ width: `${progressPercent}%` }}
                            ></div>
                            {/* Ползунок */}
                            <div 
                                className="absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-white border-2 border-accent-neon transition-all duration-100 group-hover:w-4 group-hover:h-4 group-hover:border-4"
                                style={{ left: `${progressPercent}%`, transform: `translate(-${progressPercent}%, -50%)` }}
                            ></div>
                        </div>

                        <span className="text-xs text-txt-secondary flex-shrink-0">
                            {formatTime(audioDuration)}
                        </span>
                    </div>
                </div>

                {/* 4. Кнопка Стоп (сбоку) */}
                <button 
                    className="ml-3 p-1 rounded-full text-txt-secondary hover:text-red-400 transition-colors duration-200"
                    onClick={stopSpeech}
                    title="Остановить и Закрыть"
                >
                    <StopCircle className="h-6 w-6" />
                </button>

            </div>
        </div>
    );
};

export default MiniPlayer;

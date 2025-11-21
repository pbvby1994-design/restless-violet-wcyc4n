// Файл: webapp/components/MiniPlayer.js
"use client"; // <-- КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { Play, Pause, StopCircle } from 'lucide-react';

/**
 * Утилита для форматирования времени (секунды -> "М:СС")
 */
const formatTime = (time) => {
    if (!time || isNaN(time) || time < 0) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const MiniPlayer = () => {
    // Используем только глобальные состояния из PlayerContext, чтобы избежать конфликтов
    const { 
        currentUrl, 
        currentText, 
        isPlaying, 
        togglePlay, 
        stopSpeech, 
        currentTime, // Используем глобальное currentTime
        duration,    // Используем глобальное duration
        seekTo,
        isLoading
    } = usePlayer();

    // Мини-плеер виден только если есть что играть или идет загрузка
    if (!currentUrl && !isLoading) {
        return null;
    }
    
    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

    // Обработчик перемотки
    const handleSeek = (e) => {
        seekTo(parseFloat(e.target.value));
    };


    return (
        // Контейнер Мини-плеера (Фиксирован внизу, над PlayerControl)
        <div className="fixed bottom-0 left-0 right-0 z-40 p-4 pb-16 bg-gray-900/90 backdrop-blur-sm border-t border-gray-700/50 lg:pb-4">
            <div className="max-w-xl mx-auto flex items-center justify-between">
                
                {/* 1. Кнопка Play/Pause */}
                <button
                    onClick={togglePlay}
                    className="p-3 rounded-full bg-accent-neon text-gray-900 hover:bg-accent-neon/80 transition-colors duration-200 shadow-md flex-shrink-0"
                    title={isPlaying ? 'Пауза' : 'Воспроизвести'}
                    disabled={isLoading}
                >
                    {isLoading ? (
                         <StopCircle className="h-6 w-6 animate-pulse" />
                    ) : isPlaying ? (
                        <Pause className="h-6 w-6 fill-current" />
                    ) : (
                        <Play className="h-6 w-6 fill-current" />
                    )}
                </button>

                {/* 2. Контент и Прогресс */}
                <div className="flex-1 min-w-0 mx-4">
                    <p className="text-sm font-semibold text-white truncate">
                        {currentText.substring(0, 70)}...
                    </p>
                    
                    {/* 3. Прогресс-бар с ползунком */}
                    <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-txt-secondary flex-shrink-0">
                            {formatTime(currentTime)}
                        </span>

                        <div className="relative flex-1 h-3 group">
                            {/* Невидимый ползунок для управления */}
                            <input
                                type="range"
                                min="0"
                                max={duration || 0}
                                step="0.01"
                                value={currentTime}
                                onChange={handleSeek}
                                className="absolute top-0 w-full h-full opacity-0 cursor-pointer z-10"
                                disabled={!currentUrl || isLoading}
                            />
                            {/* Видимый прогресс-бар */}
                            <div 
                                className="absolute top-1/2 -translate-y-1/2 w-full h-1.5 rounded-full bg-gray-700/50"
                            >
                                <div 
                                    className="h-1.5 rounded-full bg-accent-neon transition-all duration-100" 
                                    style={{ width: `${progressPercent}%` }}
                                ></div>
                            </div>
                        </div>

                        <span className="text-xs text-txt-secondary flex-shrink-0">
                            {formatTime(duration)}
                        </span>
                    </div>
                </div>

                {/* 4. Кнопка Стоп (сбоку) */}
                <button 
                    className="ml-3 p-1 rounded-full text-txt-secondary hover:text-red-400 transition-colors duration-200 flex-shrink-0"
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

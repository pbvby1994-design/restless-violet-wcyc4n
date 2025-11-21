// Файл: webapp/context/PlayerContext.js

import React, { 
    createContext, 
    useContext, 
    useState, 
    useEffect, 
    useCallback,
    useRef
} from 'react';

const PlayerContext = createContext(null);

export const usePlayer = () => {
    const context = useContext(PlayerContext);
    if (context === null) {
        throw new Error('usePlayer must be used within a PlayerProvider');
    }
    return context;
};

/**
 * Именованный экспорт провайдера контекста.
 */
export const PlayerProvider = ({ children }) => {
    // --- Состояния плеера ---
    const [currentUrl, setAudioUrl] = useState(null);
    const [currentText, setCurrentText] = useState(''); 
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false); 
    const [error, setError] = useState(null); 
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    
    // ✅ НОВЫЕ СОСТОЯНИЯ: Громкость и Скорость
    const [volume, setVolume] = useState(1.0); 
    const [playbackRate, setPlaybackRate] = useState(1.0); 

    // --- (Моковые/импортированные данные Auth/DB - замените на useAuth() при необходимости) ---
    const db = null; 
    const userId = 'anonymous';
    const isAuthReady = true;
    const themeParams = {};
    // -----------------------------------------------------------------------------------------
    
    // Ссылка на HTML Audio Element
    const audioRef = useRef(null);
    
    // --- Инициализация Audio-объекта и обработчиков ---
    useEffect(() => {
        if (typeof window !== 'undefined' && !window.audioPlayer) {
            window.audioPlayer = new Audio();
        }
        audioRef.current = window.audioPlayer;

        const audio = audioRef.current;
        if (!audio) return;

        // Обработчики событий аудио (timeupdate, loadedmetadata, ended, error)
        const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
        const handleLoadedMetadata = () => setDuration(audio.duration);
        const handleEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
        };
        const handleError = (e) => {
            console.error("Audio error:", e);
            setError("Ошибка воспроизведения аудио.");
            setIsLoading(false);
            setIsPlaying(false);
        };

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('error', handleError);

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('error', handleError);
        };
    }, []);


    // --- Функции управления плеером (playSpeech, stopSpeech, togglePlay, seekTo) ---

    const playSpeech = useCallback(() => {
        const audio = audioRef.current;
        if (audio && audio.src) {
            audio.play().catch(e => {
                console.error("Failed to start playback:", e);
                setError("Не удалось начать воспроизведение.");
                setIsPlaying(false);
            });
            setIsPlaying(true);
        }
    }, []);

    const togglePlay = useCallback(() => {
        if (isPlaying) {
            audioRef.current?.pause();
            setIsPlaying(false);
        } else {
            playSpeech();
        }
    }, [isPlaying, playSpeech]);
    
    // ... (остальные функции управления)

    // --- УПРАВЛЕНИЕ СКОРОСТЬЮ И ГРОМКОСТЬЮ (КЛЮЧЕВОЕ ИЗМЕНЕНИЕ) ---

    // ✅ Эффект для синхронизации скорости (playbackRate)
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.playbackRate = playbackRate;
        }
    }, [playbackRate]);

    // ✅ Эффект для синхронизации громкости (volume)
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    // --- ОБЪЕКТ КОНТЕКСТА ---

    const value = {
        // ... (все существующие состояния и функции)
        
        // ✅ НОВЫЕ ЗНАЧЕНИЯ: Управление скоростью и громкостью
        volume,
        setVolume,
        playbackRate,
        setPlaybackRate,

        // ... (Auth/DB данные)
    };

    return (
        <PlayerContext.Provider value={value}>
            {children}
        </PlayerContext.Provider>
    );
};

// ✅ КРИТИЧЕСКОЕ ДОБАВЛЕНИЕ: Экспорт по умолчанию для устранения ошибки "f is not a function"
export default PlayerContext;

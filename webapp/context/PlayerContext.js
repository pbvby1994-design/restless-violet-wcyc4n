import React, { 
    createContext, 
    useContext, 
    useState, 
    useEffect, 
    useCallback,
    useRef
} from 'react';
// Предполагаем, что Auth/DB/TWA параметры импортируются из соседнего AuthContext
// или определены выше (как в вашем AuthContext.js). 
// Для чистоты кода, мы предполагаем, что необходимые данные (db, userId, isAuthReady, setError) 
// уже доступны, например, через импорт из AuthContext или пропс.
// В данном примере мы их мокаем для полноты контекста.

// ⚠️ ЗАМЕТКА: Если у вас два отдельных контекста (AuthContext и PlayerContext), 
// вам нужно будет импортировать данные из AuthContext и объединить их здесь.
// Для простоты, мы предполагаем, что PlayerContext может получить необходимые данные 
// (db, userId, isAuthReady) из пропсов или другого внешнего источника.

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
    const [currentText, setCurrentText] = useState(''); // Для отображения текста в плеере
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false); // Глобальное состояние загрузки
    const [error, setError] = useState(null); // Глобальное состояние ошибки
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    
    // ✅ НОВЫЕ СОСТОЯНИЯ: Громкость и Скорость (по умолчанию 1.0)
    const [volume, setVolume] = useState(1.0); 
    const [playbackRate, setPlaybackRate] = useState(1.0); 

    // --- Моковые данные Auth/DB (если они импортируются из AuthContext, удалите эти строки) ---
    // Если у вас AuthContext, вам нужно будет импортировать эти данные оттуда.
    const db = null; 
    const userId = 'anonymous';
    const isAuthReady = true;
    const themeParams = {};
    // -----------------------------------------------------------------------------------------
    
    // Ссылка на HTML Audio Element
    const audioRef = useRef(null);
    
    // --- Инициализация и очистка ---
    useEffect(() => {
        // Инициализация Audio-объекта только на клиенте
        if (typeof window !== 'undefined' && !window.audioPlayer) {
            window.audioPlayer = new Audio();
        }
        audioRef.current = window.audioPlayer;

        const audio = audioRef.current;
        if (!audio) return;

        // Обработчики событий аудио
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

        // Очистка при размонтировании
        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('error', handleError);
            // ⚠️ ВНИМАНИЕ: Не удаляйте window.audioPlayer, если он используется глобально
        };
    }, []);


    // --- Функции управления плеером ---

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

    const stopSpeech = useCallback(() => {
        const audio = audioRef.current;
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
            setIsPlaying(false);
            // При необходимости, можно сбросить и URL
            // setAudioUrl(null); 
            // setCurrentText('');
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
    
    const seekTo = useCallback((time) => {
        if (audioRef.current && duration > 0) {
            audioRef.current.currentTime = time;
            setCurrentTime(time);
        }
    }, [duration]);

    const resetPlayer = useCallback(() => {
        setAudioUrl(null);
        setCurrentText('');
        setIsPlaying(false);
        setIsLoading(false);
        setCurrentTime(0);
        setDuration(0);
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = '';
        }
    }, []);


    // --- УПРАВЛЕНИЕ СКОРОСТЬЮ И ГРОМКОСТЬЮ (КЛЮЧЕВОЕ ИЗМЕНЕНИЕ) ---

    // ✅ Эффект для синхронизации скорости (playbackRate)
    useEffect(() => {
        if (audioRef.current) {
            // Устанавливаем скорость для HTML Audio Element
            audioRef.current.playbackRate = playbackRate;
        }
    }, [playbackRate]);

    // ✅ Эффект для синхронизации громкости (volume)
    useEffect(() => {
        if (audioRef.current) {
            // Устанавливаем громкость для HTML Audio Element
            audioRef.current.volume = volume;
        }
    }, [volume]);

    // --- ОБЪЕКТ КОНТЕКСТА ---

    const value = {
        // Состояния плеера
        currentUrl,
        setAudioUrl,
        currentText,
        setCurrentText,
        isPlaying,
        setIsPlaying,
        isLoading,
        setIsLoading,
        error,
        setError,
        currentTime,
        duration,
        
        // Функции плеера
        playSpeech,
        stopSpeech,
        togglePlay,
        seekTo,
        resetPlayer,
        
        // ✅ НОВЫЕ ЗНАЧЕНИЯ: Управление скоростью и громкостью
        volume,
        setVolume,
        playbackRate,
        setPlaybackRate,

        // Auth/DB данные (если они обрабатываются здесь)
        db, 
        userId, 
        isAuthReady,
        themeParams,
        // ... другие поля из вашего проекта
    };

    return (
        <PlayerContext.Provider value={value}>
            {children}
        </PlayerContext.Provider>
    );
};

// ⚠️ Это именованный экспорт, как мы обсуждали ранее.
// export default PlayerProvider; 
// Если вы используете 'export default PlayerProvider' в файле, 
// то в _app.js импорт должен быть: 
// () => import('@/context/PlayerContext')

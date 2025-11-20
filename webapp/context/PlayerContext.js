// Файл: webapp/context/PlayerContext.js (УНИФИЦИРОВАННАЯ ВЕРСИЯ)
import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import WebApp from '@twa-dev/sdk'; 
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage'; 

// --- Глобальные переменные из среды Canvas (для Vercel/TMA) ---
const firebaseConfig = typeof __firebase_config !== 'undefined' 
    ? JSON.parse(__firebase_config) 
    : {};
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const initialAuthToken = typeof __initial_auth_token !== 'undefined' 
    ? __initial_auth_token 
    : null;
// ---------------------------------------------

let app, db, auth, storage; 
if (Object.keys(firebaseConfig).length > 0 && typeof window !== 'undefined') {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    storage = getStorage(app); 
    console.log("Firebase initialized successfully on client.");
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
}

// 1. Создание контекста
const PlayerContext = createContext();

// 2. Пользовательский хук для использования контекста
export const usePlayer = () => useContext(PlayerContext);

// 3. Компонент провайдера
export const PlayerProvider = ({ children }) => {
    // --- TWA / Theme State ---
    const [themeParams, setThemeParams] = useState({});
    const [isWebAppReady, setIsWebAppReady] = useState(false);
    
    // --- Firebase Auth / DB State ---
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    
    // --- Player State (New/Merged) ---
    const [currentUrl, setCurrentUrl] = useState(null);
    const [currentText, setCurrentText] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [duration, setDuration] = useState(0);                   
    const [currentTime, setCurrentTime] = useState(0);             
    const audioRef = useRef(null);

    // --- TWA / Theme Initialization ---
    useEffect(() => {
        if (typeof window !== 'undefined' && WebApp.isReady) {
            setIsWebAppReady(true);
            setThemeParams(WebApp.themeParams || { 
                bg_color: '#0B0F15', 
                text_color: '#FFFFFF' 
            });
            // ✅ Установим обработчик закрытия, чтобы остановить воспроизведение
            WebApp.onEvent('main_button_pressed', () => {
                if (isPlaying) stopSpeech();
            });
        }
        return () => {
             // Удаляем обработчик при размонтировании
            if (WebApp.offEvent && typeof window !== 'undefined' && WebApp.isReady) {
                WebApp.offEvent('main_button_pressed');
            }
        }
    }, [isPlaying]);

    // --- Firebase Auth Initialization ---
    useEffect(() => {
        if (typeof window === 'undefined' || !auth) {
            if (!auth) console.warn("Firebase Auth not initialized on client.");
            setIsAuthReady(true); 
            return;
        }

        const initAuth = async () => {
            try {
                // Приоритет Custom Token от Telegram (если есть)
                if (initialAuthToken) {
                    await signInWithCustomToken(auth, initialAuthToken);
                } else {
                    // Fallback на анонимную аутентификацию
                    await signInAnonymously(auth);
                }
            } catch (error) {
                console.error("Authentication failed:", error);
            }
        };
        initAuth();

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUserId(user.uid);
            } else {
                // Генерируем временный ID, если аутентификация не удалась
                setUserId(crypto.randomUUID()); 
            }
            setIsAuthReady(true);
        });

        return () => unsubscribe();
    }, []);

    // --- Player Functions (Copied from the previous AuthContext/Player logic) ---
    
    const setAudioUrl = useCallback((url, text) => {
        setCurrentUrl(url);
        setCurrentText(text || 'Аудиозапись');
        setIsLoading(true); // Загрузка начнется после установки URL
        // setIsPlaying(true); // Воспроизведение начнется в useEffect
    }, []);

    const playSpeech = useCallback((url, text) => {
        if (currentUrl && currentUrl === url) {
            // Если пытаемся воспроизвести текущий трек, просто переключаем состояние
            if (audioRef.current) {
                isPlaying ? audioRef.current.pause() : audioRef.current.play();
                setIsPlaying(!isPlaying);
            }
        } else {
            // Воспроизводим новый трек
            setAudioUrl(url, text);
            setIsPlaying(true); // Установим isPlaying=true, чтобы useEffect запустил .play()
        }
    }, [currentUrl, isPlaying, setAudioUrl]);
    
    const stopSpeech = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        setIsPlaying(false);
        setCurrentUrl(null); // Скрываем плеер
        setCurrentText(null);
        setDuration(0);
        setCurrentTime(0);
    }, []);

    const togglePlay = useCallback(() => {
        if (audioRef.current) {
            isPlaying ? audioRef.current.pause() : audioRef.current.play().catch(e => console.error("Play failed:", e));
            setIsPlaying(!isPlaying);
        }
    }, [isPlaying]);

    // Эффект для управления объектом Audio
    useEffect(() => {
        if (typeof window === 'undefined') return;

        if (!audioRef.current) {
            audioRef.current = new Audio();
        }

        const audio = audioRef.current;

        // 1. Обработка смены URL
        if (currentUrl) {
            if (audio.src !== currentUrl) {
                audio.src = currentUrl;
                audio.load();
            }
            // 2. Управление воспроизведением/паузой
            if (isPlaying) {
                 // Пытаемся начать воспроизведение
                 audio.play().catch(e => {
                    console.error("Auto-play blocked or failed:", e);
                    setError("Ошибка автовоспроизведения. Нажмите Play вручную.");
                    setIsPlaying(false);
                 });
            } else {
                audio.pause();
            }
        } else {
            audio.pause();
            if (audio.src) audio.src = '';
        }

        // 3. Обработчики событий Audio
        const handleLoadedMetadata = () => {
            setDuration(audio.duration);
            setCurrentTime(0);
            setIsLoading(false); // Загрузка завершена
        };
        const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
        const handleEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
        };
        const handleError = (e) => {
            console.error("Audio playback error:", e);
            setError("Ошибка воспроизведения аудио.");
            setIsLoading(false);
            setIsPlaying(false);
        };

        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('error', handleError);

        return () => {
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('error', handleError);
        };
    }, [currentUrl, isPlaying]);

    // --- Context Value ---
    const value = {
        // Player State
        currentUrl,
        currentText,
        isPlaying,
        isLoading,
        error,
        duration,
        currentTime,
        // Player Functions
        playSpeech,
        stopSpeech,
        togglePlay,
        setAudioUrl: (url, text) => { 
            // setAudioUrl используется только Generator.js, 
            // но мы будем использовать playSpeech для унификации
            playSpeech(url, text); 
        },
        setIsLoading,
        setError,
        
        // TWA State
        themeParams,
        isWebAppReady,
        
        // Auth/DB State (для Library.js)
        db, 
        auth,
        userId,
        isAuthReady,
        appId,
        storage, // Экспортируем storage
    };

    return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
};

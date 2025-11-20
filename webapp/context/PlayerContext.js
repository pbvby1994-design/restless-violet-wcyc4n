// Файл: webapp/context/PlayerContext.js
import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
// 🛑 Важно: WebApp не импортируем на верхнем уровне, чтобы избежать ошибки SSR
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { randomUUID } from 'crypto'; 

// --- 1. Конфигурация Firebase и инициализация (SSR-безопасно) ---
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const appId = firebaseConfig.appId || 'default-app-id';
const initialAuthToken = null; 

let app, db, auth;
// Инициализация Firebase ТОЛЬКО на клиенте
if (typeof window !== 'undefined' && firebaseConfig.apiKey) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
}

// --- 2. Создание контекста с заглушками функций ---

const PlayerContext = createContext({
  // TWA/Firebase/Text
  textToSpeak: '',
  updateTextToSpeak: () => {},
  themeParams: {},
  isWebAppReady: false,
  db: null,
  auth: null,
  userId: null,
  isAuthReady: false,
  appId: appId,
  
  // Audio Player
  currentUrl: null, // Используем currentUrl, как ожидается в Library.js
  currentText: '',
  isPlaying: false,
  isLoading: false,
  error: null,
  duration: 0,
  currentTime: 0,
  volume: 1.0,
  playbackRate: 1.0,
  
  // Audio Player Functions (обязательно должны быть функциями)
  setAudioUrl: () => {},
  playSpeech: () => {},
  stopSpeech: () => {},
  togglePlay: () => {},
  seekTo: () => {},
  resetPlayer: () => {},
  setVolume: () => {},
  setPlaybackRate: () => {},
  setError: () => {}, // Для генератора
});

// Пользовательский хук
export const usePlayer = () => useContext(PlayerContext);

// --- 3. Компонент Провайдера ---

export const PlayerProvider = ({ children }) => {
  // --- Состояния TWA/Firebase/Text ---
  const [themeParams, setThemeParams] = useState({});
  const [isWebAppReady, setIsWebAppReady] = useState(false);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [textToSpeak, setTextToSpeak] = useState('');
  
  // --- Состояния Аудио Плеера (из AuthContext.js) ---
  const [currentAudioUrl, setCurrentAudioUrl] = useState(null); 
  const [currentText, setCurrentText] = useState(''); // Для отображения в плеере
  const [isPlaying, setIsPlaying] = useState(false);             
  const [isLoading, setIsLoading] = useState(false);             
  const [error, setError] = useState(null);                      
  const [duration, setDuration] = useState(0);                   
  const [currentTime, setCurrentTime] = useState(0);             
  const [volume, setVolumeState] = useState(1.0); 
  const [playbackRate, setPlaybackRateState] = useState(1.0); 
  const audioRef = useRef(null);
  
  // --- Функции управления аудио ---
  
  const setAudioUrl = useCallback((url) => {
    setCurrentAudioUrl(url);
    setIsPlaying(false); // Сбрасываем isPlaying при смене URL
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      if (isPlaying) {
        audio.pause();
      } else {
        audio.play().catch(e => console.error("Play failed:", e));
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);
  
  /**
   * Воспроизводит новый URL и устанавливает текст. Используется в Library.js.
   */
  const playSpeech = useCallback((url, text) => {
      // 1. Сначала очищаем старый URL, чтобы пересоздать Audio-элемент (если нужно)
      if (audioRef.current && audioRef.current.src && audioRef.current.src !== url) {
          audioRef.current.pause();
          URL.revokeObjectURL(audioRef.current.src);
          audioRef.current = null;
      }

      // 2. Инициализация или использование существующего
      if (!audioRef.current) {
          audioRef.current = new Audio(url);
          audioRef.current.onended = () => setIsPlaying(false);
          audioRef.current.onerror = (e) => {
              console.error("Audio playback error:", e);
              setError("Ошибка воспроизведения аудио.");
              setIsPlaying(false);
          };
          audioRef.current.onloadedmetadata = () => {
              setDuration(audioRef.current.duration);
              setCurrentTime(0);
          };
          audioRef.current.ontimeupdate = () => {
              setCurrentTime(audioRef.current.currentTime);
          };
      }
      
      // 3. Установка нового состояния
      setCurrentAudioUrl(url);
      setCurrentText(text);
      setIsPlaying(true);
      
      // 4. Воспроизведение
      audioRef.current.src = url;
      audioRef.current.volume = volume;
      audioRef.current.playbackRate = playbackRate;
      audioRef.current.play().catch(e => console.error("Play failed:", e));

  }, [volume, playbackRate]);

  /**
   * Останавливает и сбрасывает плеер. Используется в MiniPlayer.js.
   */
  const stopSpeech = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    // Освобождаем Blob URL, если это была временная генерация
    if (currentAudioUrl && currentAudioUrl.startsWith('blob:')) {
        URL.revokeObjectURL(currentAudioUrl); 
    }
    setCurrentAudioUrl(null);
    setCurrentText('');
    setIsPlaying(false);
    setDuration(0);
    setCurrentTime(0);
    setIsLoading(false);
  }, [currentAudioUrl]);

  // Функции для управления скоростью и громкостью
  const setVolume = useCallback((newVolume) => {
    const safeVolume = Math.min(1.0, Math.max(0.0, newVolume));
    setVolumeState(safeVolume);
    if (audioRef.current) audioRef.current.volume = safeVolume;
  }, []);

  const setPlaybackRate = useCallback((newRate) => {
    const safeRate = Math.min(2.0, Math.max(0.5, newRate));
    setPlaybackRateState(safeRate);
    if (audioRef.current) audioRef.current.playbackRate = safeRate;
  }, []);
  
  // Дополнительная функция для Generator.js
  const updateTextToSpeak = useCallback((newText) => {
    setTextToSpeak(newText);
  }, []);

  // --- 4. Эффекты (TWA и Firebase) ---

  // Инициализация Telegram WebApp SDK (ТОЛЬКО на клиенте)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) {
      const WebApp = window.Telegram.WebApp; 
      
      setThemeParams(WebApp.themeParams || {});
      setIsWebAppReady(WebApp.ready || false);
      
      const handleThemeChange = () => {
        setThemeParams(WebApp.themeParams || {});
      };
      WebApp.onEvent('themeChanged', handleThemeChange);
      
      if (WebApp.MainButton) {
        WebApp.MainButton.setText('Генератор Голоса');
        WebApp.MainButton.show();
      }

      return () => {
        if (WebApp.offEvent) {
          WebApp.offEvent('themeChanged', handleThemeChange);
        }
      };
    }
  }, []); 

  // Инициализация Firebase Auth (ТОЛЬКО на клиенте)
  useEffect(() => {
    if (typeof window === 'undefined' || !auth) {
      if (!auth) console.warn("Firebase Auth object is null.");
      setIsAuthReady(true); 
      return;
    }

    const initAuth = async () => {
      try {
        if (initialAuthToken) {
          await signInWithCustomToken(auth, initialAuthToken);
        } else {
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
        setUserId(randomUUID()); 
      }
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, [auth]); 

  // --- 5. Объект Context Value ---
  const value = {
    // TWA/Firebase/Text
    textToSpeak,
    updateTextToSpeak,
    themeParams,
    isWebAppReady,
    db: db,
    auth: auth,
    userId, 
    isAuthReady, 
    appId,
    
    // Audio Player
    currentUrl: currentAudioUrl, // Используем currentUrl для совместимости с MiniPlayer.js
    currentText,
    isPlaying,
    isLoading,
    error,
    duration,
    currentTime,
    volume,
    playbackRate,
    
    // Audio Player Functions
    setAudioUrl,
    playSpeech, // ✅ Добавлено
    stopSpeech, // ✅ Добавлено
    togglePlay, // ✅ Добавлено
    // seekTo - не добавлено, так как его нет в Library/MiniPlayer.js
    // resetPlayer - не добавлено
    setVolume,
    setPlaybackRate,
    setIsLoading,
    setError,
  };

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
};

// Экспорт хука для Firebase/Auth для удобства
export const useAuth = () => {
    const context = useContext(PlayerContext);
    return {
        userId: context.userId,
        isAuthReady: context.isAuthReady,
        db: context.db,
        auth: context.auth
    };
};

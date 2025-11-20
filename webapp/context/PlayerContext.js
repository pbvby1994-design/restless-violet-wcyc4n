// Файл: webapp/context/PlayerContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
// Импортируем WebApp динамически или обрабатываем его использование
import WebApp from '@twa-dev/sdk'; 
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// --- Глобальные переменные из среды Canvas ---
const firebaseConfig = typeof __firebase_config !== 'undefined' 
    ? JSON.parse(__firebase_config) 
    : {};
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const initialAuthToken = typeof __initial_auth_token !== 'undefined' 
    ? __initial_auth_token 
    : null;
// ---------------------------------------------

let app, db, auth;
if (Object.keys(firebaseConfig).length > 0 && typeof window !== 'undefined') {
  // Инициализация Firebase ТОЛЬКО на клиенте, чтобы избежать ошибок
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    console.log("Firebase initialized successfully on client.");
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
}

// Создание контекста
const PlayerContext = createContext({
  textToSpeak: '',
  updateTextToSpeak: () => {},
  themeParams: {},
  isWebAppReady: false,
  // Firestore / Auth
  db: db || null,
  auth: auth || null,
  userId: null,
  isAuthReady: false,
  appId: appId,
});

export const PlayerProvider = ({ children }) => {
  const [textToSpeak, setTextToSpeak] = useState('');
  // Инициализируем themeParams заглушкой, чтобы избежать ошибок SSR
  const [themeParams, setThemeParams] = useState({});
  const [isWebAppReady, setIsWebAppReady] = useState(false);
  
  // Auth & Firestore State
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);


  // 1. Инициализация WebApp SDK (ТОЛЬКО на клиенте)
  useEffect(() => {
    if (typeof window !== 'undefined' && WebApp.initDataUnsafe) {
      WebApp.ready();
      WebApp.expand();
      setIsWebAppReady(true);
      setThemeParams(WebApp.themeParams);

      // Listener для смены темы
      WebApp.onEvent('themeChanged', (newThemeParams) => {
        setThemeParams(newThemeParams);
      });

      return () => {
        WebApp.offEvent('themeChanged', setThemeParams);
      };
    } else {
      // Имитация темы при SSR или локальном запуске без TWA
      setThemeParams({
        bg_color: '#0B0F15',
        header_bg_color: '#1A1E24',
        text_color: '#FFFFFF',
        button_color: '#B06EFF',
        button_text_color: '#FFFFFF'
      });
    }
  }, []);

  // 2. Инициализация Firebase Auth (ТОЛЬКО на клиенте)
  useEffect(() => {
    if (typeof window === 'undefined' || !auth) {
      // Блокируем выполнение на сервере
      if (!auth) console.warn("Firebase Auth not initialized on client.");
      setIsAuthReady(true); // Считаем готовым для SSR/локальных тестов
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
        setUserId(crypto.randomUUID()); 
      }
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, [auth]);


  const updateTextToSpeak = useCallback((newText) => {
    setTextToSpeak(newText);
  }, []);

  const value = {
    textToSpeak,
    updateTextToSpeak,
    themeParams,
    isWebAppReady,
    db: db,
    auth: auth,
    userId,
    isAuthReady,
    appId,
  };

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};

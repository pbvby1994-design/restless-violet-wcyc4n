// Файл: webapp/context/PlayerContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import WebApp from '@twa-dev/sdk';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// --- Глобальные переменные из среды Canvas (обязательно для использования) ---
// Инициализация Firebase Config и App ID
const firebaseConfig = typeof __firebase_config !== 'undefined' 
    ? JSON.parse(__firebase_config) 
    : {};
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const initialAuthToken = typeof __initial_auth_token !== 'undefined' 
    ? __initial_auth_token 
    : null;
// --------------------------------------------------------------------------


// Инициализация Firebase, если конфигурация доступна
let app, db, auth;
if (Object.keys(firebaseConfig).length > 0) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    console.log("Firebase initialized successfully.");
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
}

// Создание контекста с заглушками (заглушка предотвращает ошибки при использовании до инициализации)
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
  const [themeParams, setThemeParams] = useState(WebApp.themeParams || {});
  const [isWebAppReady, setIsWebAppReady] = useState(WebApp.ready);
  
  // Auth & Firestore State
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);


  // 1. Инициализация WebApp SDK
  useEffect(() => {
    if (WebApp.initDataUnsafe) {
      WebApp.ready();
      WebApp.expand();
      setIsWebAppReady(true);
      setThemeParams(WebApp.themeParams);

      // Listener для смены темы
      WebApp.onEvent('themeChanged', (newThemeParams) => {
        setThemeParams(newThemeParams);
      });

      // Очистка при размонтировании
      return () => {
        WebApp.offEvent('themeChanged', setThemeParams);
      };
    } else {
      // Имитация темы при локальном запуске
      setThemeParams({
        bg_color: '#0B0F15',
        header_bg_color: '#1A1E24',
        text_color: '#FFFFFF',
        button_color: '#B06EFF',
        button_text_color: '#FFFFFF'
      });
    }
  }, []);

  // 2. Инициализация Firebase Auth
  useEffect(() => {
    if (!auth) {
      console.warn("Firebase Auth not initialized. Cannot proceed with authentication.");
      setIsAuthReady(true); // Считаем готовым, чтобы не блокировать UI
      return;
    }

    const initAuth = async () => {
      try {
        if (initialAuthToken) {
          // Авторизация с помощью предоставленного Canvas Custom Token
          await signInWithCustomToken(auth, initialAuthToken);
        } else {
          // Анонимный вход, если токен не предоставлен (для тестов вне Canvas)
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Authentication failed:", error);
      }
    };
    initAuth();

    // Listener для отслеживания состояния авторизации
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        // Устанавливаем временный ID, если анонимный вход не удался
        setUserId(crypto.randomUUID()); 
      }
      setIsAuthReady(true); // Теперь Firestore может начать работу
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
    // Firestore / Auth
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
  // Проверка для отладки, если хук вызван вне провайдера
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};

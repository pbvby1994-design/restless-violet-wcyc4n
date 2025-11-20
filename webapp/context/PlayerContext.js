import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
// 🛑 УДАЛЕН импорт WebApp, который вызывал ошибку SSR!
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// --- Инициализация конфигурации Firebase из переменных окружения Next.js ---
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
// Инициализация Firebase ТОЛЬКО на клиенте (безопасно)
if (typeof window !== 'undefined' && firebaseConfig.apiKey) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    // console.log("Firebase initialized successfully on client.");
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
  db: null,
  auth: null,
  userId: null,
  isAuthReady: false,
  appId: appId,
});

export const usePlayer = () => useContext(PlayerContext);

export const PlayerProvider = ({ children }) => {
  // ✅ ИСПРАВЛЕНИЕ SSR: Инициализация с безопасными значениями
  // WebApp доступен только на клиенте, поэтому инициализируем с безопасными значениями.
  const [themeParams, setThemeParams] = useState({});
  const [isWebAppReady, setIsWebAppReady] = useState(false);
  
  // Состояния Auth/DB
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  
  // Состояние ввода текста
  const [textToSpeak, setTextToSpeak] = useState('');

  // 1. Инициализация Telegram WebApp SDK (ТОЛЬКО на клиенте)
  useEffect(() => {
    // Проверяем, что мы на клиенте И что глобальный объект TWA доступен
    if (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) {
      // ✅ БЕЗОПАСНОЕ ИСПОЛЬЗОВАНИЕ: Получаем объект WebApp только внутри useEffect
      const WebApp = window.Telegram.WebApp; 
      
      // Инициализация цветов темы
      setThemeParams(WebApp.themeParams || {});
      setIsWebAppReady(WebApp.ready || false);
      
      // Обработчик события изменения темы
      const handleThemeChange = () => {
        setThemeParams(WebApp.themeParams || {});
      };
      WebApp.onEvent('themeChanged', handleThemeChange);
      
      // Установка MainButton
      if (WebApp.MainButton) {
        WebApp.MainButton.setText('Генератор Голоса');
        WebApp.MainButton.show();
      }

      // Чистка
      return () => {
        if (WebApp.offEvent) {
          WebApp.offEvent('themeChanged', handleThemeChange);
        }
      };
    }
  }, []); // Пустой массив зависимостей: запускается один раз при монтировании на клиенте

  // 2. Инициализация Firebase Auth (ТОЛЬКО на клиенте)
  useEffect(() => {
    // Выходим, если не на клиенте ИЛИ нет объекта Auth
    if (typeof window === 'undefined' || !auth) {
      if (!auth) console.warn("Firebase Auth object is null. Check Firebase config.");
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

    // Слушатель состояния аутентификации
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        // Запасной ID, если Auth не удался, для совместимости в других компонентах
        setUserId(`stub-${Date.now()}-${Math.random().toString(36).substring(2)}`); 
      }
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, [auth]); 

  // Функция для обновления текста
  const updateTextToSpeak = useCallback((newText) => {
    setTextToSpeak(newText);
  }, []);

  // Объект контекста
  const value = {
    textToSpeak,
    updateTextToSpeak,
    themeParams,
    isWebAppReady,
    db: db,
    auth: auth,
    userId, // ID текущего аутентифицированного пользователя
    isAuthReady, // Флаг готовности аутентификации
    appId,
  };

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
};

// Экспорт хука для использования в компонентах
export const useAuth = () => {
    const context = useContext(PlayerContext);
    return {
        userId: context.userId,
        isAuthReady: context.isAuthReady,
        db: context.db,
        auth: context.auth
    };
};

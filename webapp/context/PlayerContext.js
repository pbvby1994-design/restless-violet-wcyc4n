import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
// Импортируем WebApp динамически или обрабатываем его использование
import WebApp from '@twa-dev/sdk'; 
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// --- КОНФИГУРАЦИЯ FIREBASE ИЗ NEXT.JS ENVIRONMENT VARIABLES ---
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Проверяем, что хотя бы apiKey предоставлен
const isConfigValid = !!firebaseConfig.apiKey; 

// Старые глобальные переменные для совместимости, но конфигурация берется из env
const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'default-app-id';
const initialAuthToken = typeof __initial_auth_token !== 'undefined' 
    ? __initial_auth_token 
    : null;
// -----------------------------------------------------------------

let app, db, auth;
// Инициализация Firebase ТОЛЬКО на клиенте и только при наличии валидной конфигурации
if (isConfigValid && typeof window !== 'undefined') {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    console.log("Firebase initialized successfully on client.");
  } catch (error) {
    console.error("Firebase initialization failed:", error);
    // Выводим предупреждение, которое вы видели, если инициализация не удалась
    console.warn("Firebase Auth not initialized on client. Check Vercel/Firebase configuration.");
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
  appId: 'default-app-id',
});

// Пользовательский хук для использования контекста
export const usePlayer = () => useContext(PlayerContext);

// Компонент провайдера
export const PlayerProvider = ({ children }) => {
  const [textToSpeak, setTextToSpeak] = useState('');
  const [themeParams, setThemeParams] = useState({});
  const [isWebAppReady, setIsWebAppReady] = useState(false);
  
  // Состояния для Firebase
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // 1. Инициализация Telegram WebApp SDK (ТОЛЬКО на клиенте)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Инициализация WebApp SDK
      WebApp.ready();
      setIsWebAppReady(true);
      
      // Чтение параметров темы
      setThemeParams(WebApp.themeParams || {
        bg_color: '#0B0F15',
        header_bg_color: '#1A1E24',
        text_color: '#FFFFFF'
      });
    }
  }, []);

  // 2. Инициализация Firebase Auth (ТОЛЬКО на клиенте)
  useEffect(() => {
    // Блокируем выполнение, если нет объекта auth (конфигурация невалидна или SSR)
    if (typeof window === 'undefined' || !auth) {
      if (!auth) console.warn("Firebase Auth not initialized on client. Missing/invalid config.");
      setIsAuthReady(true); // Считаем готовым для обхода
      return;
    }

    const initAuth = async () => {
      try {
        if (initialAuthToken) {
          // Для кастомной аутентификации (редкий случай)
          await signInWithCustomToken(auth, initialAuthToken);
        } else {
          // Основной метод: Анонимная аутентификация
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Authentication failed:", error);
        // В случае ошибки аутентификации используем заглушку userId
        setUserId(window.crypto.randomUUID());
        setIsAuthReady(true);
      }
    };
    initAuth();

    // Слушатель изменений состояния аутентификации
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        // Если пользователь вышел, генерируем временный ID (редкий случай)
        setUserId(window.crypto.randomUUID()); 
      }
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, [auth]); // Зависит от объекта auth

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
    userId, // UID аутентифицированного пользователя
    isAuthReady, // Флаг готовности аутентификации
    appId, // ID приложения (для информации)
  };

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
};

export default PlayerContext;

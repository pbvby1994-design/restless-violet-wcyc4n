import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
// Импортируем WebApp динамически или обрабатываем его использование
import WebApp from '@twa-dev/sdk'; 
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { randomUUID } from 'crypto'; // Для генерации ID анонимного пользователя (на случай сбоя Auth)

// --- Инициализация конфигурации Firebase из переменных окружения Next.js ---
// Next.js автоматически предоставляет доступ к переменным, начинающимся с NEXT_PUBLIC_
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Заглушки, поскольку кастомные токены и App ID теперь в конфиге выше.
const appId = firebaseConfig.appId || 'default-app-id';
const initialAuthToken = null; 
// ---------------------------------------------\n

let app, db, auth;
// Инициализация Firebase ТОЛЬКО на клиенте и ТОЛЬКО если есть API Key
if (firebaseConfig.apiKey && typeof window !== 'undefined') {
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

// Пользовательский хук для использования контекста
export const usePlayer = () => useContext(PlayerContext);

// Компонент провайдера
export const PlayerProvider = ({ children }) => {
  // Состояния TWA
  const [themeParams, setThemeParams] = useState(WebApp.themeParams || {});
  const [isWebAppReady, setIsWebAppReady] = useState(WebApp.ready);
  
  // Состояния Auth/DB
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  
  // Состояние ввода текста
  const [textToSpeak, setTextToSpeak] = useState('');

  // 1. Инициализация Telegram WebApp SDK
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Инициализация цветов темы
      setThemeParams(WebApp.themeParams);
      setIsWebAppReady(WebApp.ready);
      
      // Обработчик события изменения темы
      WebApp.onEvent('themeChanged', () => {
        setThemeParams(WebApp.themeParams);
      });
      
      // Установка MainButton (временно, для примера)
      WebApp.MainButton.setText('Генератор Голоса');
      WebApp.MainButton.show();
      
      // Чистка
      return () => WebApp.offEvent('themeChanged', setThemeParams);
    }
  }, []);

  // 2. Инициализация Firebase Auth (ТОЛЬКО на клиенте)
  useEffect(() => {
    // Выходим, если не на клиенте ИЛИ нет объекта Auth
    if (typeof window === 'undefined' || !auth) {
      if (!auth) console.warn("Firebase Auth object is null. Check Firebase config.");
      // Считаем готовым для SSR/локальных тестов
      setIsAuthReady(true); 
      return;
    }

    const initAuth = async () => {
      try {
        if (initialAuthToken) {
          // Если бы мы использовали Custom Token
          await signInWithCustomToken(auth, initialAuthToken);
        } else {
          // Основной метод для TWA: Анонимная аутентификация
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
        // Если аутентификация по какой-то причине не удалась, генерируем временный ID 
        // для локальных тестов, но в продакшене это нужно перехватить.
        setUserId(crypto.randomUUID()); 
      }
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, [auth]); // Зависимость от объекта auth

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

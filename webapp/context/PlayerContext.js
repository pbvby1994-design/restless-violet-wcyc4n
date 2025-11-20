// Файл: webapp/context/AuthContext.js (TWA SDK, Firebase, Auth)
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
// Импортируем WebApp динамически или обрабатываем его использование
import WebApp from '@twa-dev/sdk'; 
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// --- Глобальные переменные из среды Canvas (для Vercel/TMA) ---
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
const AuthContext = createContext({
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

// Хук для использования контекста
export const useAuth = () => useContext(AuthContext);

// Компонент провайдера
export const AuthProvider = ({ children }) => {
  const [textToSpeak, setTextToSpeak] = useState('');
  const [isWebAppReady, setIsWebAppReady] = useState(false);
  const [themeParams, setThemeParams] = useState({});
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // 1. Инициализация TWA SDK (ТОЛЬКО на клиенте)
  useEffect(() => {
    if (typeof window !== 'undefined' && WebApp.isReady) {
      setIsWebAppReady(true);
      setThemeParams(WebApp.themeParams || { 
        bg_color: '#0B0F15', 
        text_color: '#FFFFFF' 
      });
    }
  }, []);

  // 2. Инициализация Firebase Auth (ТОЛЬКО на клиенте)
  useEffect(() => {
    if (typeof window === 'undefined' || !auth) {
      if (!auth) console.warn("Firebase Auth not initialized on client.");
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useTwaData = () => {
  console.error("useTwaData must be used within an AuthProvider.");
  return {
    themeParams: {},
    isWebAppReady: false,
    db: null,
    auth: null,
    userId: null,
    isAuthReady: false,
    appId: 'default-app-id',
  };
};

export default AuthProvider;

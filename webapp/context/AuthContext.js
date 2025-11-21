// Файл: webapp/context/AuthContext.js
"use client"; // <-- Добавлено

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import WebApp from '@twa-dev/sdk'; // <-- КРИТИЧЕСКИЙ ИМПОРТ TWA SDK
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

// Инициализация Firebase в блоке, который выполняется при импорте модуля (до useEffect)
let app, db, auth, storage; 
if (Object.keys(firebaseConfig).length > 0 && typeof window !== 'undefined') { // <-- Используется window
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

const AuthContext = createContext({
// ... (остальная часть контекста) ...
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
// ... (логика внутри компонента) ...

  // 1. Инициализация TWA SDK
  useEffect(() => {
    if (typeof window !== 'undefined' && WebApp.isReady) { // <-- Используется WebApp
      setIsWebAppReady(true);
      setThemeParams(WebApp.themeParams || { 
        bg_color: '#0B0F15', 
        text_color: '#FFFFFF' 
      });
    }
  }, []);

// ... (остальная часть компонента) ...
};

export default AuthProvider;

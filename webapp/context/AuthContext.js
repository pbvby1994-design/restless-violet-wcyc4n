// Файл: webapp/context/AuthContext.js (Новый файл, чистая реализация)

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import WebApp from '@twa-dev/sdk'; 
import { signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';

// ✅ Импортируем готовые сервисы из изолированного клиентского файла
import { auth, db, storage } from '@/lib/firebaseClient'; 

// --- Глобальные переменные из среды (TMA/Canvas) ---
const initialAuthToken = typeof __initial_auth_token !== 'undefined' 
    ? __initial_auth_token 
    : null;
// -------------------------------------------------------------

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [isWebAppReady, setIsWebAppReady] = useState(false);
    const [themeParams, setThemeParams] = useState(null);
    
    // 1. Инициализация TWA SDK
    useEffect(() => {
        if (typeof window !== 'undefined' && WebApp.isReady) {
            setIsWebAppReady(true);
            setThemeParams(WebApp.themeParams || { 
                bg_color: '#0B0F15', 
                text_color: '#FFFFFF' 
            });
        }
    }, []);

    // 2. Инициализация Firebase Auth
    useEffect(() => {
        // Мы используем импортированный "auth". Если он не инициализирован (хотя должен быть), 
        // это будет сообщено в консоли, но не сломает SSR.
        if (!auth) {
            console.warn("Firebase Auth service is unavailable.");
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
    }, []); 

    // Включение всех необходимых данных в контекст
    const value = {
        userId,
        isAuthReady,
        themeParams,
        isWebAppReady,
        db, // ✅ Доступ к Firestore
        auth, // Доступ к Auth API
        storage, // Доступ к Storage API
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ✅ КРИТИЧЕСКОЕ ДОБАВЛЕНИЕ: Экспорт по умолчанию для AuthContext
export default AuthContext;

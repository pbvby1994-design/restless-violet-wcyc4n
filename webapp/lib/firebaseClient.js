// Файл: webapp/lib/firebaseClient.js

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// ⚠️ Предполагается, что вы определили эти переменные окружения
// в настройках Vercel или в .env.local

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Функция для получения или инициализации App
const initializeFirebaseApp = () => {
    // Если приложение уже инициализировано, возвращаем его
    if (getApps().length) {
        return getApp();
    }
    // Иначе инициализируем новое
    return initializeApp(firebaseConfig);
};

// Инициализация App
const app = initializeFirebaseApp();

// Экспорт необходимых сервисов
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app); 

// Также экспортируем саму константу, если она нужна
export const firebaseApp = app;

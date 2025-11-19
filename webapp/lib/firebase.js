// Файл: lib/firebase.js

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  collection, 
  onSnapshot, 
  query, 
  where, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp, 
  getDocs, // <-- Теперь импортирован корректно
  addDoc // <-- Добавлено для полноты
} from 'firebase/firestore';

// Глобальные переменные, предоставляемые средой Canvas
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' 
  ? JSON.parse(__firebase_config) 
  : { /* Вставьте заглушку конфигурации, если нужно для локального запуска */ };
const initialAuthToken = typeof __initial_auth_token !== 'undefined' 
  ? __initial_auth_token 
  : null;

// Инициализация Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let currentUserId = null;
let isAuthReady = false;

// Асинхронная функция для инициализации аутентификации
async function initializeAuth() {
  return new Promise(async (resolve) => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        currentUserId = user.uid;
      } else {
        // Если токен есть, но onAuthStateChanged не вернул пользователя (редко, но возможно), 
        // пробуем войти по токену.
        if (initialAuthToken) {
          try {
            const userCredential = await signInWithCustomToken(auth, initialAuthToken);
            currentUserId = userCredential.user.uid;
          } catch (error) {
            console.error("Error signing in with custom token:", error);
            // Если токен не сработал, или его нет, входим анонимно
            await signInAnonymously(auth);
            currentUserId = auth.currentUser?.uid || crypto.randomUUID();
          }
        } else {
          // Если токена нет, входим анонимно
          await signInAnonymously(auth);
          currentUserId = auth.currentUser?.uid || crypto.randomUUID();
        }
      }
      isAuthReady = true;
      console.log(`Firebase initialized. User ID: ${currentUserId}`);
      resolve(currentUserId);
    });
    
    // Начальная попытка входа по токену, если onAuthStateChanged еще не сработал
    if (!auth.currentUser && initialAuthToken) {
        try {
            await signInWithCustomToken(auth, initialAuthToken);
        } catch (error) {
            // Если custom token не сработал, onAuthStateChanged обработает анонимный вход
            console.warn("Custom token initial sign-in failed, relying on onAuthStateChanged or anonymous sign-in.", error);
        }
    } else if (!auth.currentUser) {
        // Запускаем анонимный вход, если нет токена
        await signInAnonymously(auth);
    }
  });
}

// Запускаем инициализацию аутентификации
initializeAuth();


/**
 * Возвращает путь к личной коллекции пользователя.
 * @param {string} collectionName - Название коллекции (например, 'books').
 * @returns {string} Полный путь к коллекции.
 */
const getPrivateCollectionPath = (collectionName) => {
  if (!currentUserId) {
    console.warn("Attempted to access collection before user ID was set. Using placeholder.");
    return `artifacts/${appId}/users/placeholder-user/${collectionName}`;
  }
  return `artifacts/${appId}/users/${currentUserId}/${collectionName}`;
};


// Экспортируем основные объекты и функции
export { db, auth, getPrivateCollectionPath, currentUserId, isAuthReady };

// Экспортируем все необходимые функции Firestore
export { doc, setDoc, collection, onSnapshot, query, where, updateDoc, deleteDoc, serverTimestamp, getDocs, addDoc };

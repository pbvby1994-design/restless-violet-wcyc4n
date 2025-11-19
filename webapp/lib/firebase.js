// Файл: webapp/lib/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, collection, onSnapshot, query, where, updateDoc, deleteDoc, serverTimestamp, setLogLevel } from 'firebase/firestore';

// Глобальные переменные, предоставленные средой Canvas
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Инициализация (переменные будут установлены в Layout.js)
let app = null;
let db = null;
let auth = null;
let currentUserId = null;

// ПУТИ FIREBASE (Правило: /artifacts/{appId}/users/{userId}/{collectionName})
const getPrivateCollectionPath = (collectionName) => {
  if (!currentUserId) {
    console.error("Firebase not initialized or user ID is missing.");
    return null;
  }
  return `artifacts/${appId}/users/${currentUserId}/${collectionName}`;
};

/**
 * Инициализирует Firebase и выполняет аутентификацию.
 * @returns {Promise<{db: Firestore, auth: Auth, userId: string}>}
 */
export const initializeFirebase = async () => {
  if (app) return { db, auth, userId: currentUserId };

  if (!firebaseConfig) {
    console.error("Firebase config is missing.");
    return null;
  }

  try {
    // Включить отладку (опционально)
    setLogLevel('Debug');
    
    // Инициализация
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);

    // Аутентификация
    if (initialAuthToken) {
      await signInWithCustomToken(auth, initialAuthToken);
    } else {
      await signInAnonymously(auth);
    }

    // Ожидание состояния аутентификации
    await new Promise(resolve => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          currentUserId = user.uid;
          console.log("Firebase Auth initialized. User ID:", currentUserId);
        } else {
          // Если анонимная аутентификация не удалась, используем UUID
          currentUserId = crypto.randomUUID(); 
          console.warn("Firebase Auth: Anonymous sign-in failed, using random UUID:", currentUserId);
        }
        unsubscribe(); // Отписка после первой проверки
        resolve();
      });
    });

    return { db, auth, userId: currentUserId };

  } catch (error) {
    console.error("Error initializing Firebase:", error);
    return null;
  }
};

export { db, auth, getPrivateCollectionPath, currentUserId };

// Экспортируем все необходимые функции Firestore
export { doc, setDoc, collection, onSnapshot, query, where, updateDoc, deleteDoc, serverTimestamp, getDocs };

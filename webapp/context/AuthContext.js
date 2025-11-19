import React, { createContext, useContext, useState, useEffect } from 'react';
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
  serverTimestamp,
} from 'firebase/firestore';
import { setLogLevel } from 'firebase/firestore';

// 1. Константы для Firebase (Canvas Globals)
// Эти переменные предоставляются средой Canvas
const firebaseConfig = typeof __firebase_config !== 'undefined' 
  ? JSON.parse(__firebase_config) 
  : null;
const initialAuthToken = typeof __initial_auth_token !== 'undefined' 
  ? __initial_auth_token 
  : null;
const appId = typeof __app_id !== 'undefined' 
  ? __app_id 
  : 'default-app-id';

// 2. Создание контекста
const AuthContext = createContext();

// 3. Хук для использования контекста
export const useAuth = () => useContext(AuthContext);

// 4. Компонент провайдера
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [db, setDb] = useState(null);

  useEffect(() => {
    // 4.1. Инициализация Firebase
    if (!firebaseConfig) {
      console.error("Firebase config is missing. Cannot initialize Firestore.");
      setIsAuthReady(true);
      return;
    }
    
    try {
      setLogLevel('Debug');
      const app = initializeApp(firebaseConfig);
      const auth = getAuth(app);
      const firestore = getFirestore(app);
      
      setDb(firestore);

      // 4.2. Обработка аутентификации
      const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        if (currentUser) {
          // Пользователь авторизован
          setUser(currentUser);
          setUserId(currentUser.uid);
        } else if (initialAuthToken) {
          // Если есть токен, но еще не авторизован (первый запуск)
          try {
            await signInWithCustomToken(auth, initialAuthToken);
            console.log("Signed in with custom token.");
          } catch (e) {
            console.error("Custom token sign-in failed. Signing in anonymously.", e);
            await signInAnonymously(auth);
          }
        } else {
          // Если нет токена, входим анонимно
          try {
            await signInAnonymously(auth);
            console.log("Signed in anonymously.");
          } catch (e) {
            console.error("Anonymous sign-in failed.", e);
          }
        }
        setIsAuthReady(true);
      });

      return () => unsubscribe(); // Отписка при размонтировании
    } catch (e) {
      console.error("Error during Firebase initialization or sign-in:", e);
      setIsAuthReady(true);
    }
  }, []);

  /**
   * 4.3. Функция для сохранения данных в библиотеку (Firestore)
   * Путь: /artifacts/{appId}/users/{userId}/library/{docId}
   * @param {string} text - Исходный текст
   * @param {string} audioUrl - Blob URL или постоянный URL
   */
  const saveAudioToLibrary = async (text, audioUrl) => {
    if (!db || !userId) {
      console.error("Firestore DB or User ID is not available.");
      return null;
    }

    const libraryCollectionRef = collection(db, 'artifacts', appId, 'users', userId, 'library');

    try {
      const newDocRef = doc(libraryCollectionRef); // Автоматический ID
      await setDoc(newDocRef, {
        text: text,
        // Сохраняем только текст, так как Blob URL не переживет перезагрузку. 
        // В продакшене тут будет ссылка на Firebase Storage.
        audioUrl: audioUrl.startsWith('blob:') ? 'GENERATED_BLOB_URL' : audioUrl, 
        voice: 'Kore', // Пока используем хардкодный голос
        createdAt: serverTimestamp(),
      });
      console.log("Document successfully written with ID:", newDocRef.id);
      return newDocRef.id;
    } catch (e) {
      console.error("Error adding document to library: ", e);
      return null;
    }
  };
  
  /**
   * 4.4. Функция для получения ссылки на коллекцию библиотеки
   */
  const getLibraryCollectionRef = () => {
    if (!db || !userId) return null;
    return collection(db, 'artifacts', appId, 'users', userId, 'library');
  };


  const contextValue = {
    user,
    userId,
    isAuthReady,
    db,
    saveAudioToLibrary,
    getLibraryCollectionRef,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

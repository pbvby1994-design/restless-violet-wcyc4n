// Файл: webapp/lib/firebase.js

// 🔥 Заглушки (Stubs) для Firebase для обеспечения успешной сборки Next.js.
// Эти функции имитируют Firebase Firestore и Auth, чтобы компоненты, которые
// их используют, не вызывали ошибок в процессе сборки.

export function initializeFirebase() {
  console.warn("Firebase stub: not initialized.");
  return null;
}

export function getFirestore() {
  console.warn("Firestore stub: no DB instance.");
  // Возвращаем объект, имитирующий DB
  return {
    collection: () => ({}),
    doc: () => ({}),
  };
}

// Заглушки для функций Firestore, используемых в приложении
export function saveToFirestore(_, __) {
  console.warn("Firestore stub: save ignored.");
  return null;
}

export function loadFromFirestore() {
  console.warn("Firestore stub: returning empty list.");
  return [];
}

// 🔥 Основные экспорты, которые используются в контексте и компонентах
export const db = getFirestore();
export const auth = null;
export const currentUserId = "stub-user-id";
export const getPrivateCollectionPath = (collectionName) => `stub/path/${collectionName}`;

// Экспортируем заглушки Firestore для модулей, которые их используют
export const doc = () => null;
export const setDoc = () => Promise.resolve();
export const collection = () => null;

/**
 * Заглушка для onSnapshot. Имитирует получение данных и возвращает функцию отписки.
 * @param {any} ref - Ссылка на коллекцию или документ.
 * @param {(snapshot: any) => void} callback - Функция обратного вызова.
 */
export const onSnapshot = (ref, callback) => {
    console.warn("Firestore stub: onSnapshot called. Returning unsubscribe function.");
    // Имитация первоначального пустого снапшота через 100мс
    setTimeout(() => callback({ empty: true, docs: [], docChanges: () => [] }), 100);
    // Возвращаем функцию отписки
    return () => console.log("Firestore stub: unsubscribe called.");
};

export const query = () => null;
export const where = () => null;
export const updateDoc = () => Promise.resolve();
export const deleteDoc = () => Promise.resolve();
export const serverTimestamp = () => new Date();

/**
 * Заглушка для getDocs. Имитирует получение пустого списка документов.
 */
export const getDocs = () => Promise.resolve({ 
  docs: [], 
  empty: true,
  forEach: () => {} // Добавляем forEach для совместимости
});

export const addDoc = () => Promise.resolve({ id: 'stub-id' });

// Также экспортируем initializeAuth, так как оно может быть вызвано в контексте
export function initializeAuth() {
    console.warn("Auth stub: initialization skipped.");
    return Promise.resolve("stub-user-id");
}

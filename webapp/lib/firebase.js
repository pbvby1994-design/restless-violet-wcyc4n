// lib/firebase.js
// STUB — временная заглушка, безопасна для server-side сборки и для разработки.
// Экспортирует минимальный набор функций, которые ожидает приложение.
// Когда настроишь Firebase — заменишь это на реальную реализацию.

const isClient = typeof window !== 'undefined';

function notInitializedWarning(name) {
  return () => {
    console.warn(`[firebase-stub] called ${name} — Firebase не настроен. Возвращаю заглушку.`);
    // для getDocs/запросов возвращаем пустой результат/промис
    if (name === 'getDocs' || name === 'fetchCollection') return Promise.resolve([]);
    return Promise.resolve(null);
  };
}

// Экспортируем "имена", которые использует проект.
// Подстрой под то, что реально импортируешь в коде.
export const db = null;
export const auth = null;
export const getPrivateCollectionPath = () => null;
export const currentUserId = () => null;

// Функции Firestore-API (заглушки)
export const doc = () => null;
export const setDoc = notInitializedWarning('setDoc');
export const collection = () => null;
export const onSnapshot = () => {
  // возвращаем функцию отписки
  return () => {};
};
export const query = () => null;
export const where = () => null;
export const updateDoc = notInitializedWarning('updateDoc');
export const deleteDoc = notInitializedWarning('deleteDoc');
export const serverTimestamp = () => new Date();
export const getDocs = notInitializedWarning('getDocs');

// Доп. хелперы
export async function fetchCollection(collectionPath) {
  console.warn(`[firebase-stub] fetchCollection(${collectionPath}) — Firebase не настроен.`);
  return [];
}

// Если хочешь — возможность динамически включать реальную инициализацию на клиенте:
// (например, когда в дальнейшем будешь хранить конфиг в localStorage или получать от сервера)
export async function initializeFirebaseIfAvailable() {
  if (!isClient) return;
  // noop for stub
  console.warn('[firebase-stub] initializeFirebaseIfAvailable called — заглушка.');
}

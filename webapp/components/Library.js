// Файл: webapp/components/Library.js
import { motion } from 'framer-motion';
import { BookOpen, AlertCircle, Loader2 } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { initializeFirebase, getPrivateCollectionPath, onSnapshot, collection, query, getDocs } from '../lib/firebase';
import BookCard from './BookCard';

export default function Library({ onPlay }) {
    const [books, setBooks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [firestoreDb, setFirestoreDb] = useState(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const { db: firestore, userId } = await initializeFirebase();
            if (!firestore || !userId) {
                throw new Error("Не удалось инициализировать Firebase.");
            }
            setFirestoreDb(firestore);

            const path = getPrivateCollectionPath('tts_library');
            if (!path) throw new Error("Не удалось получить путь к коллекции.");
            
            const q = query(collection(firestore, path));
            
            // Используем onSnapshot для прослушивания изменений в реальном времени
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const fetchedBooks = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ref: doc.ref.path, // Путь для прямого доступа к документу
                    ...doc.data(),
                }));
                
                // Сортировка по времени создания (новые сверху)
                fetchedBooks.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)); 
                
                setBooks(fetchedBooks);
                setIsLoading(false);
                setError(null);
            }, (err) => {
                console.error("Firestore subscription error:", err);
                setError("Ошибка загрузки данных библиотеки.");
                setIsLoading(false);
            });

            // Функция очистки для отписки от слушателя
            return unsubscribe;

        } catch (e) {
            console.error("Firebase fetch error:", e);
            setError(e.message);
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const unsubscribePromise = fetchData();
        // Очистка при размонтировании
        return () => {
            if (unsubscribePromise) {
                unsubscribePromise.then(unsubscribe => unsubscribe && unsubscribe());
            }
        };
    }, [fetchData]);

    // Обработчик удаления, чтобы обновить состояние, если onSnapshot не сработал мгновенно
    const handleBookDelete = useCallback((id) => {
        setBooks(prev => prev.filter(book => book.id !== id));
    }, []);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-txt-secondary">
                <Loader2 size={32} className="animate-spin text-accent-neon mb-4" />
                <p>Загрузка вашей библиотеки...</p>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-red-400 bg-red-900/20 rounded-xl m-4">
                <AlertCircle size={32} className="mb-4" />
                <p>Ошибка: {error}</p>
                <p className="text-sm text-red-300 mt-2">Проверьте соединение и разрешения.</p>
            </div>
        );
    }

    return (
        <div className="p-4 pt-10 min-h-screen max-w-lg mx-auto">
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                <BookOpen size={28} className="text-accent-neon" />
                Ваша Библиотека
            </h2>

            {books.length === 0 ? (
                <div className="text-center p-8 card-glass mt-8">
                    <p className="text-txt-secondary">
                        Ваша библиотека пуста. Сгенерируйте свой первый аудиофайл на **Главной странице**!
                    </p>
                </div>
            ) : (
                <motion.div 
                    initial="hidden"
                    animate="visible"
                    variants={{
                        visible: { transition: { staggerChildren: 0.05 } },
                    }}
                    className="space-y-4"
                >
                    {books.map(book => (
                        <BookCard 
                            key={book.id} 
                            book={book} 
                            onPlay={onPlay} 
                            onDeleteSuccess={handleBookDelete}
                            firestoreDb={firestoreDb}
                        />
                    ))}
                </motion.div>
            )}
        </div>
    );
}

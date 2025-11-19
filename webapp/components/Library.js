// Файл: webapp/components/Library.js
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion'; // ✅ Исправлено: Импорт motion для Framer Motion
import { Library as BookIcon, Trash2, Loader2, Play } from 'lucide-react';

// Импортируем заглушки из Firebase
import { 
  onSnapshot, 
  collection, 
  getFirestore, 
  query, 
  getPrivateCollectionPath, 
  deleteDoc, 
  doc
  // initializeAuth, // Не используется напрямую здесь, но может быть в контексте
} from '@/lib/firebase';
import { usePlayer } from '@/context/PlayerContext';

/**
 * Компонент для отображения списка сохраненных фрагментов текста.
 * @param {object} props - Свойства компонента.
 * @param {function} props.onPlay - Функция, вызываемая при нажатии кнопки "Слушать".
 */
const Library = ({ onPlay }) => {
  const [libraryItems, setLibraryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUserId } = usePlayer(); // Используем userId из контекста плеера/Firebase

  // Анимационные варианты для Framer Motion
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };
  
  // Эффект нажатия для кнопок
  const tapEffect = { scale: 0.95 };


  useEffect(() => {
    let unsubscribe = () => {};

    // Проверяем, что ID пользователя доступен. Если используется заглушка, пропускаем реальный запрос.
    if (!currentUserId || currentUserId.startsWith('stub')) {
      console.warn("Library: Skipping Firestore due to stub user ID.");
      setLoading(false);
      return;
    }

    try {
      // Получаем путь к коллекции.
      const path = getPrivateCollectionPath('text_fragments');
      // Используем заглушку getFirestore() и collection()
      const fragmentsCollection = collection(getFirestore(), path);
      const q = query(fragmentsCollection);

      // Подписываемся на изменения в реальном времени с использованием заглушки onSnapshot
      unsubscribe = onSnapshot(q, (snapshot) => {
        const items = [];
        // Используем forEach для обработки документов
        snapshot.docs.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() });
        });
        
        // Сортируем по дате создания, если она есть (в реальном приложении)
        items.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setLibraryItems(items);
        setLoading(false);
      }, (e) => {
        console.error("Firestore error:", e);
        setError("Не удалось загрузить библиотеку.");
        setLoading(false);
      });

    } catch (e) {
      console.error("Setup error:", e);
      setError("Ошибка инициализации библиотеки.");
      setLoading(false);
    }

    // Очистка подписки при размонтировании компонента
    return () => unsubscribe();
  }, [currentUserId]); // Зависит от ID пользователя

  /**
   * Удаляет элемент из библиотеки.
   * @param {string} id - ID документа.
   */
  const handleDelete = async (id) => {
    if (!currentUserId || currentUserId.startsWith('stub')) {
      console.warn("Delete aborted: Firebase stub in use. Deleting locally for imitation.");
      // Удаляем из локального состояния, чтобы имитировать удаление
      setLibraryItems(prev => prev.filter(item => item.id !== id));
      return;
    }
    
    try {
      const path = getPrivateCollectionPath('text_fragments');
      // Используем заглушку doc() и deleteDoc()
      await deleteDoc(doc(getFirestore(), path, id));
    } catch (e) {
      console.error("Failed to delete document:", e);
      setError("Не удалось удалить фрагмент.");
    }
  };


  if (loading) {
    return (
      <div className="flex justify-center items-center py-8 text-txt-secondary">
        <Loader2 className="animate-spin mr-2" size={24} /> Загрузка библиотеки...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-400 border border-red-700/50 rounded-xl p-4 bg-red-900/10">
        <BookIcon size={24} className="mx-auto mb-2" />
        {error}
      </div>
    );
  }

  if (libraryItems.length === 0) {
    return (
      <div className="text-center py-8 text-txt-secondary">
        <BookIcon size={24} className="mx-auto mb-2" />
        <p>Библиотека пуста. Сохраните что-нибудь, чтобы увидеть здесь.</p>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold text-txt-primary mb-4 flex items-center">
        <BookIcon className="mr-2" size={20} /> Ваша Библиотека
      </h2>
      
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-3"
      >
        {libraryItems.map((item) => (
          <motion.div 
            key={item.id} 
            variants={itemVariants}
            className="card-glass p-4 rounded-xl flex justify-between items-start border border-white/5"
          >
            <div className="flex-grow pr-4">
              <p className="font-semibold text-txt-primary truncate">
                {item.title || 'Без названия'}
              </p>
              <p className="text-sm text-txt-secondary line-clamp-2 mt-1">
                {item.text}
              </p>
              <p className="text-xs text-txt-muted mt-2">
                Сохранено: {item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000).toLocaleDateString() : 'Дата неизвестна'}
              </p>
            </div>
            
            <div className="flex space-x-2 flex-shrink-0">
              {/* Кнопка "Слушать" */}
              <motion.button
                onClick={() => onPlay(item)}
                whileTap={tapEffect}
                className="p-2 rounded-full bg-accent-neon hover:bg-accent-light text-white transition-colors shadow-lg shadow-accent-neon/30"
                aria-label={`Слушать фрагмент: ${item.title || 'Без названия'}`}
              >
                <Play size={20} />
              </motion.button>
              
              {/* Кнопка "Удалить" */}
              <motion.button
                onClick={() => handleDelete(item.id)}
                whileTap={tapEffect}
                className="p-2 rounded-full bg-red-600/50 hover:bg-red-600 text-white transition-colors"
                aria-label={`Удалить фрагмент: ${item.title || 'Без названия'}`}
              >
                <Trash2 size={20} />
              </motion.button>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default Library;

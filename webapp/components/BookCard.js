// Файл: webapp/components/BookCard.js
import { motion } from 'framer-motion';
import { Play, Clock, Pencil, Trash2, Save, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { updateDoc, deleteDoc } from '../lib/firebase';
import { doc } from 'firebase/firestore';

// Генерация случайного градиента для обложки (имитация обложки книги)
const getRandomGradient = () => {
    const gradients = [
        "from-purple-600 to-blue-600",
        "from-emerald-500 to-teal-900",
        "from-orange-500 to-red-900",
        "from-yellow-500 to-orange-700",
        "from-pink-500 to-red-600",
        "from-sky-500 to-indigo-700"
    ];
    return gradients[Math.floor(Math.random() * gradients.length)];
};

// Утилита для форматирования времени в часы/минуты (для заглушки)
const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.round(seconds % 60);
    
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
};

export default function BookCard({ book, onPlay, onDeleteSuccess, firestoreDb }) {
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(book.title);
    const inputRef = useRef(null);

    // Фокус на инпуте при включении режима редактирования
    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);
    
    // Градиент вычисляется один раз
    const [gradient] = useState(() => getRandomGradient());

    const handleSave = async () => {
        if (!firestoreDb) return console.error("Firestore DB is not available.");
        if (title.trim() === book.title) {
            setIsEditing(false);
            return;
        }
        
        try {
            const bookDocRef = doc(firestoreDb, book.ref);
            await updateDoc(bookDocRef, {
                title: title.trim(),
            });
            setIsEditing(false);
        } catch (error) {
            console.error("Error updating document:", error);
            // Возвращаем старое название в случае ошибки
            setTitle(book.title); 
        }
    };
    
    const handleDelete = async () => {
        if (!firestoreDb) return console.error("Firestore DB is not available.");
        if (!window.confirm(`Вы уверены, что хотите удалить "${book.title}"?`)) {
            return;
        }
        
        try {
            const bookDocRef = doc(firestoreDb, book.ref);
            await deleteDoc(bookDocRef);
            if (onDeleteSuccess) onDeleteSuccess(book.id);
        } catch (error) {
            console.error("Error deleting document:", error);
        }
    };

    return (
        <motion.div 
            whileHover={{ scale: 1.01 }}
            className="flex items-center gap-4 p-4 rounded-2xl bg-bg-card border border-white/5 transition"
        >
            {/* Обложка */}
            <div className={`w-16 h-20 rounded-xl bg-gradient-to-br ${gradient} shadow-lg flex-shrink-0`} />
            
            {/* Информация */}
            <div className="flex-grow min-w-0">
                {isEditing ? (
                    <div className="flex items-center gap-2">
                        <input
                            ref={inputRef}
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSave();
                                if (e.key === 'Escape') setIsEditing(false);
                            }}
                            className="bg-bg-glass p-1 rounded border-b border-accent-neon text-white font-bold text-base truncate w-full"
                        />
                        <motion.button whileTap={{ scale: 0.9 }} onClick={handleSave} className="text-accent-neon hover:text-white">
                            <Save size={18} />
                        </motion.button>
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => { setTitle(book.title); setIsEditing(false); }} className="text-txt-muted hover:text-white">
                            <X size={18} />
                        </motion.button>
                    </div>
                ) : (
                    <h4 className="text-white font-bold text-base truncate">{book.title}</h4>
                )}
               
               <p className="text-txt-secondary text-sm truncate mt-1">
                   {book.text.substring(0, 50)}...
               </p>
               
               <div className="flex items-center gap-3 mt-2 text-xs text-txt-muted">
                  <span className="flex items-center gap-1"><Clock size={12}/> {formatDuration(book.duration || 0)}</span>
                  <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5">TTS</span>
               </div>
            </div>

            {/* Кнопки действий */}
            <div className="flex flex-col gap-2 items-center flex-shrink-0">
                <motion.button 
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onPlay(book)}
                    className="w-10 h-10 rounded-full bg-accent-neon/20 flex items-center justify-center text-accent-neon hover:bg-accent-neon/30 transition"
                    title="Воспроизвести"
                >
                    <Play size={20} fill="currentColor" className="translate-x-[1px]" />
                </motion.button>
                
                <motion.button 
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsEditing(true)}
                    className="text-txt-secondary hover:text-white transition"
                    title="Редактировать название"
                >
                    <Pencil size={16} />
                </motion.button>

                <motion.button 
                    whileTap={{ scale: 0.9 }}
                    onClick={handleDelete}
                    className="text-red-400 hover:text-red-300 transition"
                    title="Удалить"
                >
                    <Trash2 size={16} />
                </motion.button>
            </div>
        </motion.div>
    );
}

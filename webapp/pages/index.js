import { useState } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'framer-motion';

import TabBar from '../components/TabBar';
import FullPlayer from '../components/FullPlayer';
import { usePlayer } from '../context/PlayerContext';

// Динамический импорт Layout
const Layout = dynamic(() => import('../components/Layout'), { ssr: false });

// Мок-данные (имитация библиотеки)
const LIBRARY_ITEMS = [
  { id: 1, title: "Искусство Войны", author: "Сунь-цзы", category: "Философия", color: "from-red-500 to-orange-500", text: "Война — это великое дело для государства..." },
  { id: 2, title: "Атомные привычки", author: "Джеймс Клир", category: "Саморазвитие", color: "from-blue-500 to-cyan-500", text: "Небольшие изменения приводят к впечатляющим результатам..." },
  { id: 3, title: "Sapiens", author: "Юваль Ной Харари", category: "История", color: "from-emerald-500 to-green-500", text: "Сто тысяч лет назад землю населяло..." },
  { id: 4, title: "1984", author: "Джордж Оруэлл", category: "Фантастика", color: "from-purple-500 to-pink-500", text: "Был холодный ясный апрельский день..." },
];

// Внутренний компонент для контента страницы
const AppContent = () => {
  const [activeTab, setActiveTab] = useState('library');
  const { playTrack, currentTrack } = usePlayer();
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  // Логика генерации (из старого index.js, адаптированная)
  const handleGenerate = async (text, itemTitle) => {
    if (!text) return;
    setLoading(true);
    
    try {
      const response = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text, voice: 'default' }),
      });
      
      if (!response.ok) throw new Error('API Error');
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      // Запускаем плеер через контекст и переходим в таб плеера
      playTrack({ title: itemTitle, author: 'TTS Voice', textPreview: text }, url);
      setActiveTab('player');
      
    } catch (e) {
      alert('Ошибка генерации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full relative">
      
      {/* --- TAB: LIBRARY --- */}
      {activeTab === 'library' && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="p-6 pb-32 h-full overflow-y-auto no-scrollbar"
        >
          {/* Header */}
          <div className="flex justify-between items-end mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Библиотека</h1>
              <p className="text-gray-400 text-sm mt-1">Ваши книги и статьи</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center border border-white/10">
              👤
            </div>
          </div>

          {/* Search / Input Text */}
          <div className="mb-8">
            <div className="relative">
              <textarea 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Вставьте текст или ссылку для озвучивания..."
                className="w-full bg-[#1C1C1E] border border-white/5 rounded-2xl p-4 text-white placeholder-gray-500 focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all resize-none h-32 text-sm"
              />
              {inputText.length > 0 && (
                <button 
                  onClick={() => handleGenerate(inputText, "Мой Текст")}
                  disabled={loading}
                  className="absolute bottom-3 right-3 bg-white text-black px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-200 transition"
                >
                  {loading ? "..." : "Озвучить ➝"}
                </button>
              )}
            </div>
          </div>

          {/* Grid */}
          <h2 className="text-xl font-semibold mb-4 text-white">Популярное</h2>
          <div className="grid grid-cols-2 gap-4">
            {LIBRARY_ITEMS.map((item) => (
              <motion.div 
                key={item.id}
                whileTap={{ scale: 0.96 }}
                onClick={() => handleGenerate(item.text, item.title)}
                className="bg-[#1C1C1E] p-3 rounded-2xl border border-white/5 relative group overflow-hidden"
              >
                {/* Обложка */}
                <div className={`w-full aspect-[3/4] rounded-xl bg-gradient-to-br ${item.color} mb-3 relative shadow-lg`}>
                   <div className="absolute bottom-2 left-2 right-2 bg-black/30 backdrop-blur-md rounded-lg p-2">
                     <span className="text-[10px] text-white font-bold uppercase tracking-wider">{item.category}</span>
                   </div>
                </div>
                <h3 className="font-bold text-sm text-white truncate">{item.title}</h3>
                <p className="text-xs text-gray-500">{item.author}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* --- TAB: PLAYER --- */}
      {activeTab === 'player' && (
        <FullPlayer />
      )}

      {/* --- TAB: SETTINGS (Placeholder) --- */}
      {activeTab === 'settings' && (
         <div className="p-6 flex flex-col items-center justify-center h-full text-gray-400">
            <h2 className="text-2xl font-bold text-white mb-2">Личный Кабинет</h2>
            <p className="text-sm mb-6">Доступно в Premium версии</p>
            <button className="w-full py-4 bg-gradient-to-r from-brand-primary to-brand-accent rounded-2xl text-white font-bold shadow-glow">
               Оформить подписку
            </button>
         </div>
      )}

      {/* Нижняя навигация */}
      <TabBar activeTab={activeTab} setActiveTab={setActiveTab} />
      
    </div>
  );
};

export default function Index() {
  return (
    <Layout>
      <AppContent />
    </Layout>
  );
}
